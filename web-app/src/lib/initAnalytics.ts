/**
 * Load GoatCounter only on desktop builds. Stripped for Android via build-time
 * TAURI_PLATFORM so the script is never requested on mobile.
 */
export function initAnalytics(): void {
	if (import.meta.env.TAURI_PLATFORM === 'android') {
		return
	}
	const script = document.createElement('script')
	script.dataset.goatcounter = 'https://alt-sendme.goatcounter.com/count'
	script.dataset.goatcounterSettings = '{"allow_local":true,"no_onload":true}'
	script.async = true
	script.src = 'https://gc.zgo.at/count.js'
	document.head.appendChild(script)
}
