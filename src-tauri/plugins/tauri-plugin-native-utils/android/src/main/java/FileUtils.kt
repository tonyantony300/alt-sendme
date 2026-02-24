package com.altsendme.plugin.native_utils

import android.content.ContentResolver
import android.content.Context
import android.net.Uri
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import android.util.Log
import java.io.File

object FileUtils {
    private const val TAG = "FileUtils"

    fun getFileName(uri: Uri, context: Context): String? {
        var result: String? = null

        try {
            if (uri.scheme == "content") {
                context.contentResolver.query(
                    uri,
                    arrayOf(OpenableColumns.DISPLAY_NAME),
                    null,
                    null,
                    null
                ).use { cursor ->
                    if (cursor != null && cursor.moveToFirst()) {
                        result = cursor.getString(
                            cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME)
                        )
                    }
                }
            }
            if (result == null) {
                result = uri.path?.substringAfterLast('/')
            }
        } catch (ex: Exception) {
            Log.e(
                TAG,
                "Failed to handle file name: $ex"
            )
        }

        return result
    }

    fun cacheDirectory(uri: Uri, cachePath: File, contentResolver: ContentResolver) {
        cachePath.mkdirs()
        val rootDocId = DocumentsContract.getTreeDocumentId(uri)
        traverseAndCopy(uri, rootDocId, cachePath, contentResolver)
    }

    private fun traverseAndCopy(
        treeUri: Uri,
        parentDocId: String,
        destinationDir: File,
        contentResolver: ContentResolver
    ) {
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, parentDocId)

        val projection = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME
        )

        contentResolver.query(childrenUri, projection, null, null, null)?.use { cursor ->
            while (cursor.moveToNext()) {
                val docId = cursor.getString(0)
                val mimeType = cursor.getString(1)
                val displayName = cursor.getString(2)

                if (mimeType == DocumentsContract.Document.MIME_TYPE_DIR) {
                    val subDir = File(destinationDir, displayName)
                    subDir.mkdirs()
                    traverseAndCopy(treeUri, docId, subDir, contentResolver)
                } else {
                    val documentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, docId)
                    val destinationFile = File(destinationDir, displayName)

                    contentResolver.openInputStream(documentUri)?.use { input ->
                        destinationFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                }
            }
        }
    }
}