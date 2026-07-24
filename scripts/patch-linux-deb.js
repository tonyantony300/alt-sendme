#!/usr/bin/env node

/**
 * Rewrites .deb dependency metadata so installs work on Debian and Ubuntu, then
 * re-uploads the patched package to the GitHub release (overwriting the asset
 * that tauri-action just uploaded).
 *
 * Tauri's bundler emits Ubuntu 22.04 package names (libappindicator3-1,
 * libgtk-3-0). Debian and newer Ubuntu releases use libayatana-appindicator3-1
 * and libgtk-3-0t64 instead, so we declare both alternatives.
 *
 * Runs as a post-build step in CI. Re-upload is skipped when RELEASE_ID is not
 * set, so the script can also be run locally to patch a build.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')

const COMPATIBLE_DEPENDS =
	'libayatana-appindicator3-1 | libappindicator3-1, libwebkit2gtk-4.1-0, libgtk-3-0t64 | libgtk-3-0'

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
	const tmpDir = fs.mkdtempSync(path.join('/tmp', 'dashbeam-deb-'))
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
			return false
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
		return true
	} finally {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	}
}

function reuploadAsset(debPath) {
	const releaseId = process.env.RELEASE_ID
	const repo = process.env.GITHUB_REPOSITORY
	if (!releaseId || !repo) {
		console.log('RELEASE_ID/GITHUB_REPOSITORY not set; skipping re-upload.')
		return
	}

	const name = path.basename(debPath)
	const assetId = execSync(
		`gh api "repos/${repo}/releases/${releaseId}/assets" --jq ".[] | select(.name == \\"${name}\\") | .id // empty"`
	)
		.toString()
		.trim()

	if (assetId) {
		execSync(
			`gh api --method DELETE "repos/${repo}/releases/assets/${assetId}"`,
			{
				stdio: 'pipe',
			}
		)
	}

	execSync(
		`gh api --method POST -H "Content-Type: application/vnd.debian.binary-package" --input ${JSON.stringify(debPath)} "https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${name}"`,
		{ stdio: 'pipe' }
	)
	console.log(`Re-uploaded ${name} to release ${releaseId}`)
}

const debPaths = findDebArtifacts()
if (debPaths.length === 0) {
	console.log('No .deb artifacts found; skipping dependency patch.')
} else {
	for (const debPath of debPaths) {
		const changed = patchDeb(debPath)
		if (changed) {
			reuploadAsset(debPath)
		}
	}
}
