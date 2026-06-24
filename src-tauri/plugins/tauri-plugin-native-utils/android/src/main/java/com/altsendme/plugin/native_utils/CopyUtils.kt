package com.altsendme.plugin.native_utils

import android.content.Context
import android.net.Uri
import android.provider.DocumentsContract
import androidx.annotation.Keep
import androidx.documentfile.provider.DocumentFile
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import java.io.File
import java.io.IOException

const val BUFFER_SIZE = 1024 * 1024

@Keep
data class CopyProgress(
    val copiedBytes: Long,
    val totalBytes: Long,
    val cachedPath: String?,
) {
    val progress: Float = if (totalBytes == 0L) 0f else copiedBytes / totalBytes.toFloat()
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

    val source = DocumentFile.fromSingleUri(context, uri)
    val fileName = source?.name
        ?: throw IOException("Cannot get file name for $uri")

    val target = destination.resolve(fileName)
    target.parentFile?.mkdirs()
        ?: throw IOException("Cannot create parent directory for: ${target.path}")

    emit(
        CopyProgress(
            copiedBytes = 0,
            totalBytes = source.length(),
            target.absolutePath,
        )
    )

    var copiedBytes = 0L
    val totalBytes = source.length()

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
    } ?: throw IOException("Cannot open stream for: $source")

    emit(
        CopyProgress(
            copiedBytes = totalBytes,
            totalBytes = totalBytes,
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