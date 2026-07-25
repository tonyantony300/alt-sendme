package com.dashbeam.plugin.native_utils

import android.content.Context
import android.net.Uri
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import androidx.annotation.Keep
import androidx.documentfile.provider.DocumentFile
import app.tauri.plugin.JSObject
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import java.io.File
import java.io.IOException

const val BUFFER_SIZE = 1024 * 1024

fun resolveDisplayName(context: Context, uri: Uri): String {
    DocumentFile.fromSingleUri(context, uri)?.name?.takeIf { it.isNotBlank() }?.let { return it }

    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
        ?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index >= 0) {
                    cursor.getString(index)?.takeIf { it.isNotBlank() }?.let { return it }
                }
            }
        }

    val lastSegment = uri.lastPathSegment?.substringAfterLast('/')?.takeIf { it.isNotBlank() }
    return lastSegment ?: "shared-file-${System.currentTimeMillis()}"
}

fun resolveContentLength(context: Context, uri: Uri): Long {
    DocumentFile.fromSingleUri(context, uri)?.length()?.takeIf { it >= 0 }?.let { return it }

    context.contentResolver.query(uri, arrayOf(OpenableColumns.SIZE), null, null, null)
        ?.use { cursor ->
            if (cursor.moveToFirst()) {
                val index = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (index >= 0 && !cursor.isNull(index)) {
                    return cursor.getLong(index).coerceAtLeast(0L)
                }
            }
        }

    return 0L
}

@Keep
data class CopyProgress(
    val copiedBytes: Long,
    val totalBytes: Long,
    val cachedPath: String?,
) {
    val progress: Float = if (totalBytes == 0L) 0f else copiedBytes / totalBytes.toFloat()

    fun toJSObject(): JSObject = JSObject().apply {
        put("copiedBytes", copiedBytes.toString())
        put("totalBytes", totalBytes.toString())
        put("cachedPath", cachedPath)
        put("progress", progress)
    }
}

private fun DocumentFile.walkFilesWithPath(
    relativePath: String = "",
): Sequence<Pair<DocumentFile, String>> = sequence {
    for (child in listFiles()) {
        val childPath = if (relativePath.isEmpty()) child.name ?: continue
        else "$relativePath/${child.name ?: continue}"
        if (child.isDirectory) {
            yieldAll(child.walkFilesWithPath(childPath))
        } else if (child.isFile) {
            yield(child to childPath)
        }
    }
}

fun copyUri(
    context: Context,
    uri: Uri,
    destination: File,
    bufferSize: Int = BUFFER_SIZE,
): Flow<CopyProgress> = flow {
    if (DocumentsContract.isTreeUri(uri)) {
        return@flow emitAll(
            copyUriTreeWithProgress(
                context,
                uri,
                destination,
                bufferSize,
            )
        )
    }

    val fileName = resolveDisplayName(context, uri)
    val totalBytes = resolveContentLength(context, uri)

    val target = destination.resolve(fileName)
    target.parentFile?.mkdirs()
        ?: throw IOException("Cannot create parent directory for: ${target.path}")

    emit(
        CopyProgress(
            copiedBytes = 0,
            totalBytes = totalBytes,
            target.absolutePath,
        )
    )

    var copiedBytes = 0L

    context.contentResolver.openInputStream(uri)?.use { input ->
        target.outputStream().use { output ->
            val buffer = ByteArray(bufferSize)
            var bytesRead: Int
            while (input.read(buffer).also { bytesRead = it } != -1) {
                currentCoroutineContext().ensureActive()
                output.write(buffer, 0, bytesRead)
                copiedBytes += bytesRead
                emit(
                    CopyProgress(
                        copiedBytes = copiedBytes,
                        totalBytes = totalBytes,
                        null
                    )
                )
            }
        }
    } ?: throw IOException("Cannot open stream for: $uri")

    val finalTotal = if (totalBytes > 0) totalBytes else copiedBytes
    emit(
        CopyProgress(
            copiedBytes = finalTotal,
            totalBytes = finalTotal,
            target.absolutePath,
        )
    )
}

private fun copyUriTreeWithProgress(
    context: Context,
    uri: Uri,
    destination: File,
    bufferSize: Int = BUFFER_SIZE,
): Flow<CopyProgress> = flow {
    val sourceRoot = DocumentFile.fromTreeUri(context, uri)
        ?: throw IOException("Cannot open tree URI: $uri")
    val folderName = sourceRoot.name ?: throw IOException("Cannot get file name for $uri")
    val targetFolder = destination.resolve(folderName)

    require(sourceRoot.isDirectory) { "Source URI is not a directory" }

    val allFiles: List<Pair<DocumentFile, String>> = sourceRoot.walkFilesWithPath().toList()
    val totalBytes: Long = allFiles.sumOf { (file, _) -> file.length() }

    emit(
        CopyProgress(
            copiedBytes = 0,
            totalBytes = totalBytes,
            targetFolder.absolutePath
        )
    )

    var copiedBytes = 0L
    var lastProgress = .0F

    for ((file, relativePath) in allFiles) {
        currentCoroutineContext().ensureActive()

        val target = targetFolder.resolve(relativePath)
        target.parentFile?.mkdirs()
            ?: throw IOException("Cannot create parent directory for: ${target.path}")

        context.contentResolver.openInputStream(file.uri)?.use { input ->
            target.outputStream().use { output ->
                val buffer = ByteArray(bufferSize)
                var bytesRead: Int
                while (input.read(buffer).also { bytesRead = it } != -1) {
                    currentCoroutineContext().ensureActive()
                    output.write(buffer, 0, bytesRead)
                    copiedBytes += bytesRead
                    val progress = CopyProgress(
                        copiedBytes = copiedBytes,
                        totalBytes = totalBytes,
                        null
                    )
                    if(progress.progress >= lastProgress + .01) {
                        emit(
                            progress
                        )
                        lastProgress = progress.progress
                    }
                }
            }
        } ?: throw IOException("Cannot open stream for: ${file.uri}")
    }

    emit(
        CopyProgress(
            copiedBytes = totalBytes,
            totalBytes = totalBytes,
            targetFolder.absolutePath
        )
    )
}