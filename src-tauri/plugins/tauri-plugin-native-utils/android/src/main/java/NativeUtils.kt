package com.altsendme.plugin.native_utils

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResult
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

@TauriPlugin
class NativeUtils(private val activity: Activity) : Plugin(activity) {

    companion object {
        private const val RW_PERMISSION_FLAGS =
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION
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
        this::handleSendFileSelection.name
    )

    @Command
    fun select_send_folder(invoke: Invoke) = startActivityForResult(
        invoke,
        Intent(Intent.ACTION_OPEN_DOCUMENT_TREE),
        this::handleSendFolderSelection.name
    )

    @ActivityCallback
    fun handleDownloadFolderSelection(invoke: Invoke, result: ActivityResult) {
        if (Activity.RESULT_OK != result.resultCode) return invoke.resolve(null)

        val uri = result.data?.data ?: return invoke.resolve(null)

        try {
            activity.contentResolver.takePersistableUriPermission(uri, RW_PERMISSION_FLAGS)

            invoke.resolve(JSObject().apply {
                put("uri", uri.toString())
                put("path", uri.extractFolderOsPath())
            })

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
    fun handleSendFileSelection(invoke: Invoke, result: ActivityResult) {
        if (Activity.RESULT_OK != result.resultCode) return invoke.resolve(null)

        val uri = result.data?.data ?: return invoke.resolve(null)

        try {
            val fileName = FileUtils.getFileName(uri, activity)

            val path = listOf(
                activity.cacheDir.absolutePath,
                "file_cache",
                System.currentTimeMillis().toString(),
                fileName ?: "unknown"
            ).joinToString(File.separator)

            val tempFile = File(path)

            CoroutineScope(Dispatchers.IO).launch {
                tempFile.parentFile?.mkdirs()

                activity.contentResolver.openInputStream(uri)?.use { inputStream ->
                    FileOutputStream(tempFile).use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
            }

            invoke.resolve(JSObject().apply {
                put("uri", uri.toString())
                put("path", fileName ?: "Unknown")
                put("cachedPath", tempFile.absolutePath)
            })
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }

    @ActivityCallback
    fun handleSendFolderSelection(invoke: Invoke, result: ActivityResult) {
        if (Activity.RESULT_OK != result.resultCode) return invoke.resolve(null)

        val uri = result.data?.data ?: return invoke.resolve(null)

        try {
            val fileName = uri.extractFolderOsPath()?.let {
                if(it.endsWith("/")) {
                    it.substringBeforeLast("/").substringAfterLast("/")
                } else {
                    it.substringAfterLast("/")
                }
            }

            val path = listOf(
                activity.cacheDir.absolutePath,
                "file_cache",
                System.currentTimeMillis().toString(),
                fileName ?: "unknown"
            ).joinToString(File.separator)

            val cachedFolder = File(path)

            CoroutineScope(Dispatchers.IO).launch {
                FileUtils.cacheDirectory(uri, cachedFolder, activity.contentResolver)
            }

            invoke.resolve(JSObject().apply {
                put("uri", uri.toString())
                put("path", fileName ?: "Unknown")
                put("cachedPath", cachedFolder.absolutePath)
            })
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }
}