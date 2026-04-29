#!/usr/bin/env node
/**
 * Builds a release APK for Android (F-Droid / signed release).
 * 1. Run "tauri android build --apk" to populate gen/ and produce an unsigned APK.
 * 2. In CI (ANDROID_KEY_BASE64 set), write keystore to gen/android/keystore.properties.
 * 3. Apply scripts/patches/*.patch to app/build.gradle.kts (F-Droid + optional signing).
 * 4. If keystore is available, sign the unsigned APK with apksigner (no second Gradle run —
 *    gradlew assembleRelease would trigger Tauri CLI WebSocket and fail when run standalone).
 *
 * Output (signed): app-universal-release.apk
 * Output (unsigned): app-universal-release-unsigned.apk
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const genAndroid = path.join(rootDir, 'src-tauri/gen/android')
const apkDir = path.join(genAndroid, 'app/build/outputs/apk/universal/release')
const unsignedApk = path.join(apkDir, 'app-universal-release-unsigned.apk')
const signedApk = path.join(apkDir, 'app-universal-release.apk')

const javaRoot = path.join(genAndroid, 'app/src/main/java')

function readAndroidBundleIdentifier() {
	const p = path.join(rootDir, 'src-tauri/tauri.android.conf.json')
	if (!fs.existsSync(p)) {
		throw new Error(`android-release-build: missing ${p}`)
	}
	const j = JSON.parse(fs.readFileSync(p, 'utf8'))
	if (!j.identifier || typeof j.identifier !== 'string') {
		throw new Error(
			'android-release-build: tauri.android.conf.json must set "identifier"'
		)
	}
	return j.identifier
}

/** e.g. com.altsendme.android -> .../java/com/altsendme/android (must exist after init). */
function expectedAppJavaDir() {
	const id = readAndroidBundleIdentifier()
	return path.join(javaRoot, ...id.split('.'))
}

function run(cmd, args, opts = {}) {
	const cwd = opts.cwd ?? rootDir
	const env = { ...process.env, ...opts.env }
	if (opts.noCi) {
		delete env.CI
	}
	const r = spawnSync(cmd, args, { stdio: 'inherit', cwd, env })
	if (r.status !== 0) {
		process.exit(r.status ?? 1)
	}
}

// 0. CI / fresh clone has no gen/android (gitignored), or a stale/partial gen without the
//    Java package tree for bundle identifier in tauri.android.conf.json. Tauri build checks
//    .../java/<identifier segments>/ and errors if that path is missing.
if (!fs.existsSync(expectedAppJavaDir())) {
	if (fs.existsSync(genAndroid)) {
		console.log(
			'android-release-build: removing incomplete gen/android before tauri android init'
		)
		fs.rmSync(genAndroid, { recursive: true, force: true })
	}
	console.log(
		'android-release-build: tauri android init (missing app Java package for identifier)'
	)
	run('npx', ['tauri', 'android', 'init', '--ci'], { noCi: true })
}
if (!fs.existsSync(expectedAppJavaDir())) {
	console.error(
		'android-release-build: after init, expected Java package dir is still missing:',
		expectedAppJavaDir()
	)
	process.exit(1)
}

// 1. Populate gen/ and build once (unsigned)
run('npx', ['tauri', 'android', 'build', '--apk'], { noCi: true })

// 2. In CI, write keystore now (gen/ exists)
const keyBase64 = process.env.ANDROID_KEY_BASE64
const keyAlias = process.env.ANDROID_KEY_ALIAS
const keyPassword = process.env.ANDROID_KEY_PASSWORD
if (keyBase64 && keyAlias && keyPassword) {
	const keystorePath = path.join(rootDir, '.keystore.jks')
	fs.writeFileSync(keystorePath, Buffer.from(keyBase64, 'base64'))
	fs.writeFileSync(
		path.join(genAndroid, 'keystore.properties'),
		`keyAlias=${keyAlias}\npassword=${keyPassword}\nstoreFile=${path.resolve(keystorePath)}\n`
	)
}

// 3. Apply Gradle patches (git apply; see scripts/apply-android-release-gradle-patches.js)
run('node', [path.join(__dirname, 'apply-android-release-gradle-patches.js')])

// 4. Sign the unsigned APK with apksigner (do not run gradlew again — it would trigger Tauri CLI WebSocket)
const keystorePropsPath = path.join(genAndroid, 'keystore.properties')
if (!fs.existsSync(unsignedApk)) {
	console.error('android-release-build: unsigned APK not found:', unsignedApk)
	process.exit(1)
}

if (fs.existsSync(keystorePropsPath)) {
	const props = Object.fromEntries(
		fs
			.readFileSync(keystorePropsPath, 'utf8')
			.split('\n')
			.filter((l) => l && !l.startsWith('#'))
			.map((l) => {
				const i = l.indexOf('=')
				return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
			})
	)
	const storeFile = props.storeFile || props.store
	const alias = props.keyAlias || props.alias
	const password = props.password

	if (storeFile && alias && password) {
		const androidHome =
			process.env.ANDROID_HOME ||
			process.env.ANDROID_SDK_ROOT ||
			path.join(process.env.HOME || '', 'Library/Android/sdk')
		let apksigner = path.join(androidHome, 'build-tools', '34.0.0', 'apksigner')
		if (!fs.existsSync(apksigner)) {
			const buildTools = path.join(androidHome, 'build-tools')
			if (fs.existsSync(buildTools)) {
				const versions = fs.readdirSync(buildTools).sort().reverse()
				for (const v of versions) {
					const p = path.join(buildTools, v, 'apksigner')
					if (fs.existsSync(p)) {
						apksigner = p
						break
					}
				}
			}
		}
		if (!fs.existsSync(apksigner)) {
			console.error(
				'android-release-build: apksigner not found. Set ANDROID_HOME and ensure build-tools is installed.'
			)
			process.exit(1)
		}

		const r = spawnSync(
			apksigner,
			[
				'sign',
				'--ks',
				storeFile,
				'--ks-key-alias',
				alias,
				'--ks-pass',
				`pass:${password}`,
				'--out',
				signedApk,
				unsignedApk,
			],
			{ stdio: 'inherit', cwd: rootDir }
		)
		if (r.status !== 0) {
			process.exit(r.status ?? 1)
		}
		console.log('\nSigned APK:', signedApk)
	} else {
		console.log('\nUnsigned APK (keystore.properties incomplete):', unsignedApk)
	}
} else {
	console.log('\nUnsigned APK (no keystore.properties):', unsignedApk)
}
