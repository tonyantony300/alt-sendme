#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootPackageJsonPath = path.join(__dirname, '../package.json')
const syncVersionScript = path.join(__dirname, 'sync-version.js')
const validateVersionScript = path.join(__dirname, 'validate-version.js')

const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'))
const currentVersion = rootPackageJson.version

if (!currentVersion) {
	console.error('Error: No version found in package.json')
	process.exit(1)
}

const versionArg = process.argv[2]

if (!versionArg) {
	console.error(
		'Error: Please specify version bump type (patch/minor/major) or exact version (e.g., 0.3.0)'
	)
	process.exit(1)
}

let newVersion
if (
	versionArg === 'patch' ||
	versionArg === 'minor' ||
	versionArg === 'major'
) {
	const [major, minor, patch] = currentVersion.split('.').map(Number)

	switch (versionArg) {
		case 'patch':
			newVersion = `${major}.${minor}.${patch + 1}`
			break
		case 'minor':
			newVersion = `${major}.${minor + 1}.0`
			break
		case 'major':
			newVersion = `${major + 1}.0.0`
			break
	}
} else {
	if (!/^\d+\.\d+\.\d+$/.test(versionArg)) {
		console.error(
			`Error: Invalid version format "${versionArg}". Expected format: X.Y.Z (e.g., 0.3.0)`
		)
		process.exit(1)
	}
	newVersion = versionArg
}

rootPackageJson.version = newVersion
fs.writeFileSync(
	rootPackageJsonPath,
	`${JSON.stringify(rootPackageJson, null, 2)}\n`
)

try {
	execSync(`node "${syncVersionScript}"`, { stdio: 'inherit' })
} catch (_error) {
	console.error('Failed to sync versions')
	process.exit(1)
}

try {
	execSync(`node "${validateVersionScript}"`, { stdio: 'inherit' })
} catch (_error) {
	console.error('Version validation failed')
	process.exit(1)
}

try {
	execSync('git status --short', { stdio: 'inherit' })
} catch (_error) {}
