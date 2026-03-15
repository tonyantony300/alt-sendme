#!/usr/bin/env node
/**
 * Patches src-tauri/gen/android/app/build.gradle.kts for F-Droid and release signing.
 * Idempotent: skips injection if the relevant blocks already exist.
 *
 * Adds:
 * - dependenciesInfo { includeInApk = false; includeInBundle = false }
 * - splits { abi { isEnable = false } } for a single universal APK
 * - signingConfigs + release.signingConfig only if gen/android/keystore.properties exists
 *
 * Run after gen/ is populated (e.g. after "npx tauri android build --apk") and before
 * "gradlew assembleRelease". See docs/android-release-build.md.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const buildGradlePath = path.join(
	rootDir,
	'src-tauri/gen/android/app/build.gradle.kts'
)
const keystorePropsPath = path.join(
	rootDir,
	'src-tauri/gen/android/keystore.properties'
)

if (!fs.existsSync(buildGradlePath)) {
	console.error('patch-android-release-gradle: not found:', buildGradlePath)
	console.error(
		'Run "npx tauri android build --apk" first to generate gen/android/.'
	)
	process.exit(1)
}

let content = fs.readFileSync(buildGradlePath, 'utf8')
const hasDependenciesInfo = content.includes('dependenciesInfo')
const hasSplits = /splits\s*\{[\s\S]*?abi[\s\S]*?isEnable\s*=\s*false/.test(
	content
)
const hasSigningConfigs =
	content.includes('signingConfigs') && content.includes('create("release")')
const hasReleaseSigningConfig =
	/getByName\("release"\)\s*\{[^}]*signingConfig\s*=/.test(content)
const hasKeystore = fs.existsSync(keystorePropsPath)

let modified = false

// Insert once after "buildFeatures { ... }\n    }\n" (before android block closing "}")
function findInsertPointAfterBuildFeatures(content) {
	const buildFeaturesStart = content.indexOf('    buildFeatures {')
	if (buildFeaturesStart === -1) return -1
	const afterBuildFeatures =
		content.indexOf('buildConfig = true', buildFeaturesStart) +
		'buildConfig = true'.length
	const closing = content.indexOf('    }\n}', afterBuildFeatures)
	if (closing === -1) return -1
	return closing + '    }\n'.length
}

// 1. dependenciesInfo  2. Universal APK (splits) — inject together so insertion point is correct
const blocksToAdd = []
if (!hasDependenciesInfo) {
	blocksToAdd.push(`
    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }`)
}
if (!hasSplits) {
	blocksToAdd.push(`
    splits {
        abi {
            isEnable = false
        }
    }`)
}
if (blocksToAdd.length > 0) {
	const insertAfter = findInsertPointAfterBuildFeatures(content)
	if (insertAfter === -1) {
		console.error(
			'patch-android-release-gradle: could not find buildFeatures block'
		)
		process.exit(1)
	}
	content =
		content.slice(0, insertAfter) +
		blocksToAdd.join('') +
		'\n' +
		content.slice(insertAfter)
	modified = true
}

// 3. Signing (only if keystore.properties exists)
if (hasKeystore && (!hasSigningConfigs || !hasReleaseSigningConfig)) {
	if (!content.includes('import java.io.FileInputStream')) {
		content = content.replace(
			'import java.util.Properties',
			'import java.util.Properties\nimport java.io.FileInputStream'
		)
		modified = true
	}

	if (!hasSigningConfigs) {
		const buildTypesStart = content.indexOf('    buildTypes {')
		if (buildTypesStart === -1) {
			console.error(
				'patch-android-release-gradle: could not find buildTypes block'
			)
			process.exit(1)
		}
		const block = `    signingConfigs {
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            val keystoreProperties = Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["password"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["password"] as String
        }
    }
    `
		content =
			content.slice(0, buildTypesStart) + block + content.slice(buildTypesStart)
		modified = true
	}

	if (!hasReleaseSigningConfig) {
		content = content.replace(
			/getByName\("release"\) \{\s*isMinifyEnabled = true/m,
			'getByName("release") {\n            signingConfig = signingConfigs.getByName("release")\n            isMinifyEnabled = true'
		)
		modified = true
	}
}

if (modified) {
	fs.writeFileSync(buildGradlePath, content)
	console.log('patch-android-release-gradle: updated', buildGradlePath)
} else {
	console.log(
		'patch-android-release-gradle: no changes needed (already patched)'
	)
}
