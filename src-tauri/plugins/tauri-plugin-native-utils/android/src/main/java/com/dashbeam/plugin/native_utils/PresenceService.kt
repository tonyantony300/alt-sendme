package com.dashbeam.plugin.native_utils

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Keeps the app process at foreground importance so pairing presence and mDNS
 * survive the user navigating away. Both ride tokio tasks in this process,
 * which Android throttles once it caches a backgrounded app.
 *
 * The multicast lock matters even in the foreground: Android drops multicast to
 * apps that don't hold one.
 *
 * Lifetime is owned by Rust (`presence_service`), not this class — see [start]
 * and [stop]. `android:stopWithTask="true"` means swiping the app away takes
 * the device offline, deliberately.
 */
class PresenceService : Service() {
    private var multicastLock: WifiManager.MulticastLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForegroundNotification()
        acquireLocks()
        // Rust decides when presence runs; never restart on our own.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        releaseLocks()
        super.onDestroy()
    }

    private fun startForegroundNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // IMPORTANCE_LOW: ongoing but silent — status, not an alert.
            val channel = NotificationChannel(
                CHANNEL_ID,
                getString(R.string.presence_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.presence_channel_description)
                setShowBadge(false)
            }
            manager.createNotificationChannel(channel)
        }

        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            buildNotification(),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            } else {
                0
            }
        )
    }

    private fun buildNotification(): Notification {
        val launch = packageManager.getLaunchIntentForPackage(packageName)?.let {
            PendingIntent.getActivity(
                this,
                0,
                it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.presence_notification_title))
            .setContentText(getString(R.string.presence_notification_text))
            .setSmallIcon(R.drawable.ic_presence_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setOngoing(true)
            .setShowWhen(false)
            .setContentIntent(launch)
            .build()
    }

    /** Non-reference-counted and released in [onDestroy], so repeated
     * `startService` calls can't leak them. */
    private fun acquireLocks() {
        if (multicastLock != null || wifiLock != null) return

        val wifi = applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
            ?: return

        multicastLock = runCatching {
            wifi.createMulticastLock(MULTICAST_LOCK_TAG).apply {
                setReferenceCounted(false)
                acquire()
            }
        }.getOrElse {
            Log.w(TAG, "multicast lock unavailable; mDNS may be unreliable", it)
            null
        }

        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            WifiManager.WIFI_MODE_FULL_LOW_LATENCY
        } else {
            @Suppress("DEPRECATION")
            WifiManager.WIFI_MODE_FULL_HIGH_PERF
        }
        wifiLock = runCatching {
            wifi.createWifiLock(mode, WIFI_LOCK_TAG).apply {
                setReferenceCounted(false)
                acquire()
            }
        }.getOrElse {
            Log.w(TAG, "wifi lock unavailable; multicast replies may be delayed", it)
            null
        }
    }

    private fun releaseLocks() {
        multicastLock?.let { if (it.isHeld) runCatching { it.release() } }
        wifiLock?.let { if (it.isHeld) runCatching { it.release() } }
        multicastLock = null
        wifiLock = null
    }

    companion object {
        private const val TAG = "DashBeamPresence"
        private const val CHANNEL_ID = "dashbeam_presence"
        private const val NOTIFICATION_ID = 4711
        private const val MULTICAST_LOCK_TAG = "dashbeam-mdns"
        private const val WIFI_LOCK_TAG = "dashbeam-presence"

        /**
         * Idempotent: starting an already-running service just re-delivers
         * `onStartCommand`, which re-posts the same notification id.
         */
        fun start(context: Context) {
            val intent = Intent(context, PresenceService::class.java)
            runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            }.onFailure {
                // Losing background presence must not take the app down.
                Log.w(TAG, "could not start presence service", it)
            }
        }

        fun stop(context: Context) {
            runCatching {
                context.stopService(Intent(context, PresenceService::class.java))
            }.onFailure {
                Log.w(TAG, "could not stop presence service", it)
            }
        }
    }
}
