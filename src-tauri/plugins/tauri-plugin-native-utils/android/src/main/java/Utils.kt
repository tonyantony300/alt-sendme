package com.altsendme.plugin.native_utils

import android.net.Uri
import android.os.Environment
import android.provider.DocumentsContract

fun Uri.extractFolderOsPath(): String? {
    val path = this.path ?: return null
    val baseExternalPath = Environment.getExternalStorageDirectory().path
    return try {
        if(!DocumentsContract.isTreeUri(this)) return null
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