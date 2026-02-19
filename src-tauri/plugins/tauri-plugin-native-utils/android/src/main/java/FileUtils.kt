package com.altsendme.plugin.native_utils

import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
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
                        result =
                            cursor.getString(cursor.getColumnIndexOrThrow(OpenableColumns.DISPLAY_NAME))
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

    private fun getPathFromTreeUri(uri: Uri): String {
        val docId = DocumentsContract.getTreeDocumentId(uri)
        val parts = docId.split(":")

        // Check if the URI corresponds to external storage
        return if (parts.size > 1) {
            val volumeId = parts[0]
            val path = parts[1]

            // Map volume ID to external storage path
            if ("primary".equals(volumeId, ignoreCase = true)) {
                "${Environment.getExternalStorageDirectory()}/$path"
            } else {
                "/storage/$volumeId/$path"
            }
        } else {
            "${Environment.getExternalStorageDirectory()}/${parts.last()}"
        }
    }

    fun getFullPathFromTreeUri(treeUri: Uri?, context: Context): String? {
        if (treeUri == null) {
            return null
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            if (isDownloadsDocument(treeUri)) {
                val docId = DocumentsContract.getDocumentId(treeUri)
                val extPath =
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).path
                if (docId == "downloads") {
                    return extPath
                } else if (docId.matches("^ms[df]:.*".toRegex())) {
                    // Handle "msf:" (Media Store File) and "msd:" (Media Store Directory) prefixes.
                    // These are commonly seen on Android 10+ (API 29+) when selecting files from the
                    // "Downloads" category in the system picker.
                    // Note that this does not happen on all devices.
                    // Example URI: content://com.android.providers.downloads.documents/document/msf:1000000033
                    val fileName = getFileName(treeUri, context)
                    return "$extPath/$fileName"
                } else if (docId.startsWith("raw:")) {
                    return docId.split(":".toRegex()).dropLastWhile { it.isEmpty() }
                        .toTypedArray()[1]
                }
                return null
            }
        }

        var volumePath = getPathFromTreeUri(treeUri)

        if (volumePath.endsWith(File.separator)) {
            volumePath = volumePath.dropLast(1)
        }

        var documentPath = getDocumentPathFromTreeUri(treeUri)

        if (documentPath.endsWith(File.separator)) {
            documentPath = documentPath.dropLast(1)
        }
        return if (documentPath.isNotEmpty()) {
            if (volumePath.endsWith(documentPath)) {
                volumePath
            } else {
                if (documentPath.startsWith(File.separator)) {
                    volumePath + documentPath
                } else {
                    volumePath + File.separator + documentPath
                }
            }
        } else {
            volumePath
        }
    }

    private fun getDocumentPathFromTreeUri(treeUri: Uri): String {
        val docId = DocumentsContract.getTreeDocumentId(treeUri)
        val split = docId.split(":".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        return if ((split.size >= 2)) split[1]
        else File.separator
    }

    private fun isDownloadsDocument(uri: Uri): Boolean {
        return uri.authority == "com.android.providers.downloads.documents"
    }
}