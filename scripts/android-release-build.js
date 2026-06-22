#!/usr/bin/env node
/**
 * Builds signed release APKs for Android (F-Droid / CI).
 *
 * Profiles (see ANDROID_APK_PROFILES):
 *   universal — all ABIs in one APK (F-Droid; default Tauri universal output)
 *   arm64     — `--target aarch64`  (arm64-v8a / armv8a)
 *   armv7     — `--target armv7`    (armeabi-v7a / armv7a)
 *   x86       — `--target i686`     (x86)
 *   x86_64    — `--target x86_64`   (x86_64)
 *
 * Per-ABI split APKs (`--split-per-abi`) are supported by Tauri v2 but conflict with
 * scripts/patches/01-fdroid-gradle.patch (abi splits disabled for universal). Use
 * `--target` per profile instead, or adjust the Gradle patch for split releases.
 *
 * @see https://v2.tauri.app/distribute/google-play/#separate-bundles-per-architecture
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const genAndroid = path.join(rootDir, 'src-tauri/gen/android')
const universalApkDir = path.join(
	genAndroid,
	'app/build/outputs/apk/universal/release'
)
const extraSignedDir = path.join(rootDir, 'build/android-apks')

/** @type {Record<string, { buildArgs: string[], signedFileName: string, signedDir: string }>} */
const APK_PROFILES = {
	universal: {
		buildArgs: ['--apk'],
		signedFileName: 'app-universal-release.apk',
		signedDir: universalApkDir,
	},
}

for (const [name, target] of Object.entries({
	arm64: 'aarch64',
	armv7: 'armv7',
	x86: 'i686',
	x86_64: 'x86_64',
})) {
	APK_PROFILES[name] = {
		buildArgs: ['--apk', '--target', target],
		signedFileName: `app-${name}-release.apk`,
		signedDir: extraSignedDir,
	}
}

const javaRoot = path.join(genAndroid, 'app/src/main/java')

/** Gradle ABI output folders for per-target builds */
const PROFILE_ABI_DIRS = {
	arm64: 'arm64-v8a',
	armv7: 'armeabi-v7a',
	x86: 'x86',
	x86_64: 'x86_64',
}

function outputDirForProfile(profileName) {
	if (profileName === 'universal') {
		return universalApkDir
	}
	const abi = PROFILE_ABI_DIRS[profileName]
	if (!abi) {
		throw new Error(`android-release-build: no APK output dir for profile "${profileName}"`)
	}
	return path.join(genAndroid, 'app/build/outputs/apk', abi, 'release')
}

/** @returns {{ apk: string, gradleSigned: boolean } | null} */
function findApkInDir(dir) {
	if (!fs.existsSync(dir)) {
		return null
	}
	const files = fs.readdirSync(dir).filter((f) => f.endsWith('.apk'))
	const unsigned = files.find((f) => f.endsWith('-unsigned.apk'))
	if (unsigned) {
		return { apk: path.join(dir, unsigned), gradleSigned: false }
	}
	const signed = files.find((f) => !f.endsWith('-unsigned.apk'))
	if (signed) {
		return { apk: path.join(dir, signed), gradleSigned: true }
	}
	return null
}

/** @returns {{ apk: string, gradleSigned: boolean } | null} */
function resolveApkAfterBuild(profileName, buildStartedAt) {
	const preferred = findApkInDir(outputDirForProfile(profileName))
	if (preferred) {
		return preferred
	}

	if (profileName !== 'universal') {
		const fromUniversal = findApkInDir(universalApkDir)
		if (
			fromUniversal &&
			fs.statSync(fromUniversal.apk).mtimeMs >= buildStartedAt - 2000
		) {
			return fromUniversal
		}
	}

	const apkRoot = path.join(genAndroid, 'app/build/outputs/apk')
	let newest = null
	/** @param {string} dir */
	function walk(dir) {
		if (!fs.existsSync(dir)) {
			return
		}
		for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, ent.name)
			if (ent.isDirectory()) {
				walk(p)
				continue
			}
			if (!ent.name.endsWith('.apk')) {
				continue
			}
			const mtime = fs.statSync(p).mtimeMs
			if (mtime < buildStartedAt - 2000) {
				continue
			}
			if (!newest || mtime > newest.mtime) {
				newest = {
					apk: p,
					gradleSigned: !ent.name.endsWith('-unsigned.apk'),
					mtime,
				}
			}
		}
	}
	walk(apkRoot)
	if (!newest) {
		return null
	}
	return { apk: newest.apk, gradleSigned: newest.gradleSigned }
}

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

function resolveApksigner() {
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
	return apksigner
}

function readKeystoreProps() {
	const keystorePropsPath = path.join(genAndroid, 'keystore.properties')
	if (!fs.existsSync(keystorePropsPath)) {
		return null
	}
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
	const ksPassword = props.storePassword || props.password
	const keyPass = props.keyPassword || props.password
	if (!storeFile || !alias || !ksPassword || !keyPass) {
		return null
	}
	return { storeFile, alias, ksPassword, keyPass }
}

function signApk(unsignedApk, signedApk, keystore) {
	fs.mkdirSync(path.dirname(signedApk), { recursive: true })
	const apksigner = resolveApksigner()
	const ksPassEnvVar = 'ALTSENDME_APKSIGNER_KS_PASS'
	const keyPassEnvVar = 'ALTSENDME_APKSIGNER_KEY_PASS'
	const r = spawnSync(
		apksigner,
		[
			'sign',
			'--ks',
			keystore.storeFile,
			'--ks-key-alias',
			keystore.alias,
			'--ks-pass',
			`env:${ksPassEnvVar}`,
			'--key-pass',
			`env:${keyPassEnvVar}`,
			'--out',
			signedApk,
			unsignedApk,
		],
		{
			stdio: 'inherit',
			cwd: rootDir,
			env: {
				...process.env,
				[ksPassEnvVar]: keystore.ksPassword,
				[keyPassEnvVar]: keystore.keyPass,
			},
		}
	)
	if (r.status !== 0) {
		process.exit(r.status ?? 1)
	}
	console.log('\nSigned APK:', signedApk)
}

function selectedProfiles() {
	const raw =
		process.env.ANDROID_APK_PROFILES || 'universal,arm64,armv7,x86,x86_64'
	const names = raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
	const unknown = names.filter((n) => !APK_PROFILES[n])
	if (unknown.length > 0) {
		console.error(
			`android-release-build: unknown profile(s): ${unknown.join(', ')}`,
			`(valid: ${Object.keys(APK_PROFILES).join(', ')})`
		)
		process.exit(1)
	}
	return names.map((name) => ({ name, ...APK_PROFILES[name] }))
}

// 0. Ensure gen/android exists with the correct Java package tree.
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

// 1. CI keystore
const keyBase64 = process.env.ANDROID_KEY_BASE64
const keyAlias = process.env.ANDROID_KEY_ALIAS
const keyPassword = process.env.ANDROID_KEY_PASSWORD
const storePassword = process.env.ANDROID_STORE_PASSWORD || keyPassword
if (keyBase64 && keyAlias && keyPassword) {
	const keystorePath = path.join(rootDir, '.keystore.jks')
	fs.writeFileSync(keystorePath, Buffer.from(keyBase64, 'base64'), {
		mode: 0o600,
	})
	fs.writeFileSync(
		path.join(genAndroid, 'keystore.properties'),
		`keyAlias=${keyAlias}\nkeyPassword=${keyPassword}\nstoreFile=${path.resolve(keystorePath)}\nstorePassword=${storePassword}\n`,
		{ mode: 0o600 }
	)
}

// 2. Gradle patches (universal APK + optional release signing)
run('node', [path.join(__dirname, 'apply-android-release-gradle-patches.js')])

const keystore = readKeystoreProps()
const profiles = selectedProfiles()

for (const profile of profiles) {
	console.log(`\nandroid-release-build: building profile "${profile.name}"`)
	const buildStartedAt = Date.now()
	run(
		'npx',
		['tauri', 'android', 'build', ...profile.buildArgs],
		{ noCi: true }
	)

	const built = resolveApkAfterBuild(profile.name, buildStartedAt)
	if (!built) {
		console.error(
			`android-release-build: APK not found for profile "${profile.name}"`,
			`(checked ${outputDirForProfile(profile.name)} and recent outputs under gen/android/app/build/outputs/apk)`
		)
		process.exit(1)
	}

	const signedApk = path.join(profile.signedDir, profile.signedFileName)
	if (built.gradleSigned) {
		fs.mkdirSync(path.dirname(signedApk), { recursive: true })
		if (path.resolve(built.apk) !== path.resolve(signedApk)) {
			fs.copyFileSync(built.apk, signedApk)
		}
		console.log('\nSigned APK (Gradle):', signedApk)
	} else if (keystore) {
		signApk(built.apk, signedApk, keystore)
	} else {
		const dest = signedApk.replace(/\.apk$/, '-unsigned.apk')
		fs.mkdirSync(path.dirname(dest), { recursive: true })
		fs.copyFileSync(built.apk, dest)
		console.log(`\nUnsigned APK (no keystore): ${dest}`)
	}
}
