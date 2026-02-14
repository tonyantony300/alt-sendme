package com.altsendme.plugin.native_utils

import android.net.Uri
import android.os.Environment
import android.provider.DocumentsContract

fun Uri.extractOsPath(): String? {
    val path = this.path ?: return null
    val baseExternalPath = Environment.getExternalStorageDirectory().path
    return try {
        val isFolder = DocumentsContract.isTreeUri(this)
        val docId = if (isFolder) {
            DocumentsContract.getTreeDocumentId(this)
        } else {
            DocumentsContract.getDocumentId(this)
        }
        val segments = docId.split(":")
        if (!isFolder && segments.size == 1) return path
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