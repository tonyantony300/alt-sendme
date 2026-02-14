package com.altsendme.plugin.native_utils

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.lang.ref.WeakReference

@TauriPlugin
class NativeUtils(private val activity: Activity): Plugin(activity) {
    var pendingSelectorInvoke: Invoke? = null

    companion object {
        private const val DOWNLOAD_FOLDER_SELECTOR_REQUEST_CODE = 100
        private const val RW_PERMISSION_FLAGS = Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION
        private var instance: WeakReference<NativeUtils>? = null
        fun getInstance(): WeakReference<NativeUtils>? = instance
    }

    override fun load(webView: WebView) {
        instance = WeakReference(this)
        super.load(webView)
    }

    @Command
    fun select_download_folder(invoke: Invoke) {
        pendingSelectorInvoke = invoke

        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE)
            activity.startActivityForResult(intent, DOWNLOAD_FOLDER_SELECTOR_REQUEST_CODE)
        } catch (e: Exception) {
            invoke.reject(e.message)
            pendingSelectorInvoke = null
        }
    }

    fun handleResult(requestCode: Int, resultCode: Int, intent: Intent?) {
        if(requestCode == DOWNLOAD_FOLDER_SELECTOR_REQUEST_CODE) {
            pendingSelectorInvoke?.let { invoke ->
                if (Activity.RESULT_OK == resultCode && intent != null) {
                    handleSelectedPath(invoke,intent.data)
                }
                pendingSelectorInvoke = null
            }
        }
    }

    fun handleSelectedPath(invoke: Invoke, uri: Uri?) {
        if(uri == null) {
            return invoke.resolve(null)
        }

        try {
            activity.contentResolver.takePersistableUriPermission(uri, RW_PERMISSION_FLAGS)
            invoke.resolve(JSObject().apply {
                put("uri", uri.toString())
                put("path", uri.extractOsPath())
            })
        } catch (e: Exception) {
            invoke.reject(e.message)
        }
    }
}