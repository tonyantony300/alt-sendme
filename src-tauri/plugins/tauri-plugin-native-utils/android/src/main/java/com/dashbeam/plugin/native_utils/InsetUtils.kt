package com.dashbeam.plugin.native_utils

import android.app.Activity
import androidx.annotation.Keep
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

@Keep
data class WindowInsetsResponse(
    val top: Double,
    val right: Double,
    val bottom: Double,
    val left: Double,
)

/**
 * Reads the system bar and display cutout insets in CSS pixels.
 *
 * Edge-to-edge is mandatory from API 35 onwards, so the WebView is laid out behind the
 * status and navigation bars. Android WebView only forwards these insets to
 * `env(safe-area-inset-*)` on some versions (broken below 136 and again between 138 and
 * 143), so the frontend needs a dependable source of the same numbers.
 */
fun Activity.readWindowInsets(): WindowInsetsResponse {
    val insets = ViewCompat.getRootWindowInsets(window.decorView)
        ?: return WindowInsetsResponse(0.0, 0.0, 0.0, 0.0)

    val safeArea = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
    )

    // CSS pixels are density independent pixels, so undo the device scale factor.
    val density = resources.displayMetrics.density.takeIf { it > 0f } ?: 1f
    return WindowInsetsResponse(
        top = safeArea.top / density.toDouble(),
        right = safeArea.right / density.toDouble(),
        bottom = safeArea.bottom / density.toDouble(),
        left = safeArea.left / density.toDouble(),
    )
}
