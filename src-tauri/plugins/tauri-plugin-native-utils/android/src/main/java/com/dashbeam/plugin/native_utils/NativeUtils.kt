package com.dashbeam.plugin.native_utils

import android.app.Activity
import android.app.DownloadManager
import android.content.ContentResolver
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.DocumentsContract
import android.webkit.WebView
import androidx.activity.result.ActivityResult
import androidx.annotation.Keep
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Channel
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import java.io.File
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue

@InvokeArg
class SelectorArgs {
    lateinit var channel: Channel
}

@InvokeArg
class CancelJobArgs(
    var channelId: Long = 0
)

@InvokeArg
class ExportToTreeArgs {
    var treeUri: String = ""
    var sourceDir: String = ""
}

@InvokeArg
class OpenDownloadFolderArgs {
    var treeUri: String = ""
}

@InvokeArg
class ExportToMediaStoreArgs {
    var sourceDir: String = ""
}

@InvokeArg
class OpenDownloadTargetArgs {
    var uri: String = ""
}

@Keep
data class DownloadFolderSelectionResponse(
    val uri: String,
    val path: String,
)

@TauriPlugin
class NativeUtils(private val activity: Activity) : Plugin(activity) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val jobs = ConcurrentHashMap<Long, Pair<Job, String>>()
    private val pendingShareBatches = ConcurrentLinkedQueue<List<Uri>>()

    companion object {
        private const val RW_PERMISSION_FLAGS =
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION
        private const val SHARE_RECEIVED_EVENT = "shareReceived"

        /** Sentinel the Rust side matches to fall back to app-private staging. */
        const val MEDIA_STORE_UNSUPPORTED = "MEDIA_STORE_UNSUPPORTED"
    }

    @Command
    fun select_download_folder(invoke: Invoke) = startActivityForResult(
        invoke,
        Intent(Intent.ACTION_OPEN_DOCUMENT_TREE),
        this::handleDownloadFolderSelection.name
    )

    @Command
    fun select_send_document(invoke: Invoke) = startActivityForResult(
        invoke,
        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            type = "*/*"
        },
        this::handleSendSelection.name
    )

    @Command
    fun select_send_folder(invoke: Invoke) = startActivityForResult(
        invoke,
        Intent(Intent.ACTION_OPEN_DOCUMENT_TREE),
        this::handleSendSelection.name
    )

    @Command
    fun consume_share_intent(invoke: Invoke) {
        val args = invoke.parseArgs(SelectorArgs::class.java)
        val uris = takePendingOrIntentShare()
            ?: return invoke.resolveObject(false)

        startUriCopy(uris, args.channel)
        invoke.resolveObject(true)
    }

    @Command
    fun cancel_job(invoke: Invoke) {
        val args = invoke.parseArgs(CancelJobArgs::class.java)
        val channelId = args.channelId
        val (job, tempFolder) = jobs.remove(channelId)
            ?: return invoke.reject("Trying to cancel a non existing job")
        scope.launch {
            try {
                job.cancelAndJoin()
                File(tempFolder).deleteRecursively()
                invoke.resolve()
            } catch (e: Exception) {
                invoke.reject(e.message)
            }
        }
    }

    @Command
    fun export_to_tree(invoke: Invoke) {
        val args = invoke.parseArgs(ExportToTreeArgs::class.java)
        scope.launch {
            try {
                val treeUri = Uri.parse(args.treeUri)
                val sourceDir = File(args.sourceDir)
                val result = exportDirectoryToTree(activity, treeUri, sourceDir)
                invoke.resolveObject(result)
            } catch (e: SecurityException) {
                invoke.reject(e.message ?: "SAF permission denied")
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to export to selected folder")
            }
        }
    }

    @Command
    fun get_window_insets(invoke: Invoke) {
        activity.runOnUiThread {
            try {
                invoke.resolveObject(activity.readWindowInsets())
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to read window insets")
            }
        }
    }

    @Command
    fun open_download_folder(invoke: Invoke) {
        val args = invoke.parseArgs(OpenDownloadFolderArgs::class.java)
        val treeUriString = args.treeUri.trim()
        if (treeUriString.isEmpty()) {
            return invoke.reject("No download folder URI available")
        }

        try {
            val treeUri = Uri.parse(treeUriString)
            if (!DocumentsContract.isTreeUri(treeUri)) {
                return invoke.reject("Invalid download folder URI")
            }

            val docId = DocumentsContract.getTreeDocumentId(treeUri)
            val documentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(documentUri, DocumentsContract.Document.MIME_TYPE_DIR)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            try {
                activity.startActivity(intent)
            } catch (_: android.content.ActivityNotFoundException) {
                activity.startActivity(Intent.createChooser(intent, null))
            }
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message ?: "Failed to open download folder")
        }
    }

    @Command
    fun export_to_media_store(invoke: Invoke) {
        val args = invoke.parseArgs(ExportToMediaStoreArgs::class.java)
        scope.launch {
            try {
                val result = exportDirectoryToMediaStore(activity, File(args.sourceDir))
                invoke.resolveObject(result)
            } catch (_: MediaStoreUnsupportedException) {
                invoke.reject(MEDIA_STORE_UNSUPPORTED)
            } catch (e: Exception) {
                invoke.reject(e.message ?: "Failed to export to the Downloads folder")
            }
        }
    }

    /**
     * Show a received file, or the system Downloads list when there is no
     * single file to show.
     *
     * A MediaStore export has no tree URI to hand back, so opening the folder
     * the SAF way is not available here.
     */
    @Command
    fun open_download_target(invoke: Invoke) {
        val args = invoke.parseArgs(OpenDownloadTargetArgs::class.java)
        val uriString = args.uri.trim()

        try {
            val intent = if (uriString.isEmpty()) {
                Intent(DownloadManager.ACTION_VIEW_DOWNLOADS)
            } else {
                val uri = Uri.parse(uriString)
                val mime = activity.contentResolver.getType(uri) ?: "*/*"
                Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, mime)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            try {
                activity.startActivity(intent)
            } catch (_: android.content.ActivityNotFoundException) {
                activity.startActivity(Intent.createChooser(intent, null))
            }
            invoke.resolve()
        } catch (e: Exception) {
            invoke.reject(e.message ?: "Failed to open the downloaded file")
        }
    }

    @ActivityCallback
    fun handleDownloadFolderSelection(invoke: Invoke, result: ActivityResult) {
        if (Activity.RESULT_OK != result.resultCode) return invoke.resolve(null)

        val uri = result.data?.data ?: return invoke.resolve(null)

        try {
            activity.contentResolver.takePersistableUriPermission(uri, RW_PERMISSION_FLAGS)

            invoke.resolveObject(
                DownloadFolderSelectionResponse(
                    uri.toString(),
                    uri.extractFolderOsPath(),
                )
            )

            activity.contentResolver.persistedUriPermissions.stream()
                .filter { it.uri != uri }
                .forEach {
                    activity.contentResolver.releasePersistableUriPermission(
                        it.uri,
                        RW_PERMISSION_FLAGS
                    )
                }
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @ActivityCallback
    fun handleSendSelection(invoke: Invoke, result: ActivityResult) {
        val args = invoke.parseArgs(SelectorArgs::class.java)
        val channel = args.channel

        if (Activity.RESULT_OK != result.resultCode) return invoke.resolveObject(false)

        val uri = result.data?.data ?: return invoke.resolveObject(false)

        startUriCopy(listOf(uri), channel)
        invoke.resolveObject(true)
    }

    override fun load(webView: WebView) {
        super.load(webView)
        // Cold start: capture share URI before / as the frontend mounts.
        // Skip wiping file_cache when a share is pending so cleanup cannot race the copy.
        val shareUris = takeShareUris(activity.intent)
        if (shareUris != null) {
            pendingShareBatches.add(shareUris)
            // Notify after the WebView can register plugin listeners (cold-start race).
            webView.post {
                trigger(SHARE_RECEIVED_EVENT, JSObject())
            }
        } else {
            scope.launch {
                activity.cacheDir.resolve("file_cache").deleteRecursively()
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Without this, activity.intent stays the old MAIN launcher intent under singleTask.
        activity.intent = intent

        val uris = takeShareUris(intent) ?: return
        pendingShareBatches.add(uris)
        trigger(SHARE_RECEIVED_EVENT, JSObject())
    }

    override fun onResume() {
        super.onResume()
        // Safety net: if the frontend missed the first event (listener not ready yet),
        // re-advertise any still-unconsumed share when we come to the foreground.
        val uris = takeShareUris(activity.intent) ?: return
        pendingShareBatches.add(uris)
        trigger(SHARE_RECEIVED_EVENT, JSObject())
    }

    override fun onDestroy() {
        jobs.forEach { _, (job, tempFolder) ->
            try {
                job.cancel()
                File(tempFolder).deleteRecursively()
            } catch (_: Exception) {
            }
        }

        scope.cancel()
        super.onDestroy()
    }

    private fun startUriCopy(uris: List<Uri>, channel: Channel) {
        val path = listOf(
            activity.cacheDir.absolutePath,
            "file_cache",
            System.currentTimeMillis().toString(),
        ).joinToString(File.separator)

        val tempFolder = File(path)
        val job = scope.launch(start = CoroutineStart.LAZY) {
            try {
                tempFolder.parentFile?.mkdirs()
                    ?: throw IOException("Unable to create parent folders for ${tempFolder.absolutePath}")

                if (uris.size == 1) {
                    copyUri(activity, uris.single(), tempFolder).collect {
                        channel.send(it.toJSObject())
                    }
                } else {
                    val totalBytes = uris.sumOf { resolveContentLength(activity, it) }
                    channel.send(CopyProgress(0, totalBytes, tempFolder.absolutePath).toJSObject())

                    var copiedBytes = 0L
                    val cachedPaths = mutableListOf<String>()
                    uris.forEachIndexed { index, uri ->
                        var fileBytes = 0L
                        copyUri(activity, uri, tempFolder.resolve(index.toString())).collect { progress ->
                            fileBytes = progress.copiedBytes
                            progress.cachedPath?.takeIf { progress.completed }?.let(cachedPaths::add)
                            channel.send(
                                CopyProgress(
                                    copiedBytes + progress.copiedBytes,
                                    totalBytes,
                                    null,
                                ).toJSObject()
                            )
                        }
                        copiedBytes += fileBytes
                    }

                    channel.send(
                        CopyProgress(
                            copiedBytes,
                            if (totalBytes > 0) totalBytes else copiedBytes,
                            null,
                            cachedPaths,
                            completed = true,
                        ).toJSObject()
                    )
                }
            } catch (e: Exception) {
                tempFolder.deleteRecursively()
                channel.send(
                    JSObject().apply {
                        put("error", e.message ?: "Failed to copy shared file")
                        put("progress", -1.0)
                        put("copiedBytes", "0")
                        put("totalBytes", "0")
                    }
                )
            } finally {
                jobs.remove(channel.id)
            }
        }

        jobs[channel.id] = job to tempFolder.absolutePath
        job.start()
    }

    @Synchronized
    private fun takePendingOrIntentShare(): List<Uri>? {
        return pendingShareBatches.poll() ?: takeShareUris(activity.intent)
    }

    private fun peekShareUris(intent: Intent?): List<Uri>? {
        if (intent == null ||
            (intent.action != Intent.ACTION_SEND && intent.action != Intent.ACTION_SEND_MULTIPLE)
        ) {
            return null
        }
        return extractShareUris(intent).takeIf { it.isNotEmpty() }
    }

    private fun takeShareUris(intent: Intent?): List<Uri>? {
        val uris = peekShareUris(intent) ?: return null
        intent?.action = null
        return uris
    }

    private fun extractShareUris(intent: Intent): List<Uri> {
        val uris = mutableListOf<Uri>()
        parcelableStreamExtras(intent)?.let(uris::addAll)

        when (val stream = intent.extras?.get(Intent.EXTRA_STREAM)) {
            is Uri -> uris.add(stream)
            is String -> if (stream.isNotBlank()) uris.add(Uri.parse(stream))
            is List<*> -> uris.addAll(stream.filterIsInstance<Uri>())
        }

        val clip = intent.clipData
        if (clip != null) {
            repeat(clip.itemCount) { index ->
                clip.getItemAt(index)?.uri?.let(uris::add)
            }
        }

        intent.data?.let(uris::add)

        return uris.distinct().filter { it.scheme == ContentResolver.SCHEME_CONTENT }
    }

    @Suppress("DEPRECATION")
    private fun parcelableStreamExtras(intent: Intent): List<Uri>? {
        return if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
            } else {
                intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)
            }
        } else {
            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
            } else {
                intent.getParcelableExtra(Intent.EXTRA_STREAM) as? Uri
            }
            uri?.let(::listOf)
        }
    }
}

fun Uri.extractFolderOsPath(): String {
    require(DocumentsContract.isTreeUri(this))

    val path = this.path
        ?: throw IOException("Unable to get path from selected download folder uri: $this")
    val baseExternalPath = Environment.getExternalStorageDirectory().path
    return try {
        val docId = DocumentsContract.getTreeDocumentId(this)
        val segments = docId.split(":")
        when {
            "primary" == segments[0] && segments.size > 1 -> "${baseExternalPath}/${segments[1]}"
            "primary" == segments[0] -> baseExternalPath
            segments.size > 1 -> "/storage/${segments[0]}/${segments[1]}"
            else -> "/storage/${segments[0]}/"
        }
    } catch (_: Exception) {
        path
    }
}
