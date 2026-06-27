#!/usr/bin/env node

/**
 * Linux release build: run `tauri build`, then rewrite the .deb dependency
 * metadata so installs work on Debian and Ubuntu.
 *
 * Tauri's bundler emits Ubuntu 22.04 package names (libappindicator3-1,
 * libgtk-3-0). Debian and newer Ubuntu releases use libayatana-appindicator3-1
 * and libgtk-3-0t64 instead, so we declare both alternatives.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')

const COMPATIBLE_DEPENDS =
	'libayatana-appindicator3-1 | libappindicator3-1, libwebkit2gtk-4.1-0, libgtk-3-0t64 | libgtk-3-0'

function runTauriBuild(args) {
	if (args.length === 0) {
		console.error('Usage: node scripts/tauri-build-linux.js <tauri args...>')
		process.exit(1)
	}

	execSync(`npx tauri ${args.map((arg) => JSON.stringify(arg)).join(' ')}`, {
		cwd: repoRoot,
		stdio: 'inherit',
		shell: true,
	})
}

function findDebArtifacts() {
	const debDir = path.join(repoRoot, 'src-tauri/target/release/bundle/deb')
	if (!fs.existsSync(debDir)) {
		return []
	}

	return fs
		.readdirSync(debDir)
		.filter((name) => name.endsWith('.deb'))
		.map((name) => path.join(debDir, name))
}

function patchDeb(debPath) {
	const tmpDir = fs.mkdtempSync(path.join('/tmp', 'altsendme-deb-'))
	try {
		execSync(
			`dpkg-deb -R ${JSON.stringify(debPath)} ${JSON.stringify(tmpDir)}`,
			{
				stdio: 'pipe',
			}
		)

		const controlPath = path.join(tmpDir, 'DEBIAN', 'control')
		const original = fs.readFileSync(controlPath, 'utf8')
		if (!/^Depends: .+$/m.test(original)) {
			throw new Error(`No Depends line found in ${debPath}`)
		}

		const patched = original.replace(
			/^Depends: .+$/m,
			`Depends: ${COMPATIBLE_DEPENDS}`
		)
		if (patched === original) {
			console.log(`Already compatible: ${debPath}`)
			return
		}

		fs.writeFileSync(controlPath, patched)
		execSync(
			`dpkg-deb -b ${JSON.stringify(tmpDir)} ${JSON.stringify(debPath)}`,
			{
				stdio: 'pipe',
			}
		)

		console.log(`Patched ${debPath}`)
		console.log(`  Depends: ${COMPATIBLE_DEPENDS}`)
	} finally {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	}
}

runTauriBuild(process.argv.slice(2))

const debPaths = findDebArtifacts()
if (debPaths.length === 0) {
	console.log('No .deb artifacts found; skipping dependency patch.')
} else {
	for (const debPath of debPaths) {
		patchDeb(debPath)
	}
}
