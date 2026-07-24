#!/usr/bin/env node

/**
 * Build a no-install Windows portable ZIP from the Tauri release payload, then
 * upload it to the GitHub draft release.
 *
 * Tauri 2 has no native `zip` bundle target, so we package the same files the
 * NSIS installer would deploy (main exe + optional WebView2Loader.dll +
 * resources/) and stamp a `.portable` marker so the app can disable
 * installer-style auto-updates.
 *
 * Env:
 *   RUST_TARGET   – e.g. x86_64-pc-windows-msvc (required)
 *   VERSION       – release version (defaults to root package.json)
 *   RELEASE_ID    – GitHub release id (optional; skips upload when unset)
 *   GITHUB_REPOSITORY – owner/repo (required when uploading)
 *   GITHUB_TOKEN  – used by `gh` for upload
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '..')

const PRODUCT_NAME = 'DashBeam'
const PORTABLE_MARKER = '.portable'
const PORTABLE_README = 'README-PORTABLE.txt'

const PORTABLE_README_BODY = `${PRODUCT_NAME} portable (no installer)
====================================

1. Extract this folder anywhere (USB drive, Downloads, etc.).
2. Run ${PRODUCT_NAME}.exe.
3. Keep the .portable file next to the executable — do not delete it.

Notes
- App data is stored under your user profile (not inside this folder).
- Edge WebView2 Runtime is required (usually already installed on Windows 10/11).
- Auto-update is disabled for portable builds. Download a newer ZIP from GitHub Releases to upgrade.
- If you enable Explorer "Send with ${PRODUCT_NAME}" and later move this folder, turn the option off and on again in Settings so the shortcut points at the new path.
- To remove Explorer menu leftovers after deleting this folder, re-download briefly and disable the option in Settings, or delete the "Send with ${PRODUCT_NAME}" keys under HKCU\\Software\\Classes.
`

function readVersion() {
	if (process.env.VERSION?.trim()) {
		return process.env.VERSION.trim()
	}
	const pkg = JSON.parse(
		fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
	)
	return pkg.version
}

function archLabel(rustTarget) {
	if (rustTarget.startsWith('aarch64-') || rustTarget.includes('arm64')) {
		return 'arm64'
	}
	if (rustTarget.startsWith('x86_64-') || rustTarget.includes('x64')) {
		return 'x64'
	}
	throw new Error(`Unsupported RUST_TARGET for portable ZIP: ${rustTarget}`)
}

/** Cargo package name → binary; Tauri may also rename via mainBinaryName / productName. */
const EXE_CANDIDATES = [`${PRODUCT_NAME}.exe`, 'AltSendme.exe', 'alt-sendme.exe']

function findBuiltExe(releaseDir) {
	for (const name of EXE_CANDIDATES) {
		const exe = path.join(releaseDir, name)
		if (fs.existsSync(exe)) {
			return exe
		}
	}
	return null
}

function findReleaseDir(rustTarget) {
	const candidates = [
		path.join(repoRoot, 'src-tauri', 'target', rustTarget, 'release'),
		path.join(repoRoot, 'src-tauri', 'target', 'release'),
	]
	for (const dir of candidates) {
		if (findBuiltExe(dir)) {
			return dir
		}
	}
	throw new Error(
		`Could not find ${EXE_CANDIDATES.join(' or ')} under target/${rustTarget}/release or target/release. Run the Windows Tauri build first.`
	)
}

function copyFile(src, dest) {
	fs.mkdirSync(path.dirname(dest), { recursive: true })
	fs.copyFileSync(src, dest)
}

function copyDir(src, dest) {
	fs.mkdirSync(dest, { recursive: true })
	for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
		const from = path.join(src, entry.name)
		const to = path.join(dest, entry.name)
		if (entry.isDirectory()) {
			copyDir(from, to)
		} else if (entry.isFile()) {
			copyFile(from, to)
		}
	}
}

/**
 * Tauri packages `bundle.resources` into installers but often does not leave a
 * persistent `resources/` tree next to the release exe. Prefer that tree when
 * present; otherwise assemble it from src-tauri paths listed in tauri.conf.json.
 */
function stageResources(releaseDir, stagingAppDir) {
	const stagedResources = path.join(stagingAppDir, 'resources')
	const releaseResources = path.join(releaseDir, 'resources')

	if (fs.existsSync(releaseResources)) {
		copyDir(releaseResources, stagedResources)
		console.log(`Bundled resources/ from ${releaseResources}`)
		return
	}

	const confPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.json')
	const conf = JSON.parse(fs.readFileSync(confPath, 'utf8'))
	const resourceEntries = conf?.bundle?.resources
	if (!Array.isArray(resourceEntries) || resourceEntries.length === 0) {
		throw new Error(
			`No resources/ next to the exe and no bundle.resources in ${confPath}`
		)
	}

	const srcTauri = path.join(repoRoot, 'src-tauri')
	for (const entry of resourceEntries) {
		if (typeof entry !== 'string') {
			throw new Error(
				`Unsupported bundle.resources entry (expected string path): ${JSON.stringify(entry)}`
			)
		}
		const from = path.join(srcTauri, entry)
		if (!fs.existsSync(from) || !fs.statSync(from).isFile()) {
			throw new Error(`bundle.resources file missing: ${from}`)
		}
		copyFile(from, path.join(stagedResources, entry))
	}
	console.log(
		`Assembled resources/ from src-tauri (${resourceEntries.length} file(s); Tauri did not leave resources/ under ${releaseDir})`
	)
}

function stagePortablePayload(releaseDir, stagingAppDir) {
	fs.rmSync(stagingAppDir, { recursive: true, force: true })
	fs.mkdirSync(stagingAppDir, { recursive: true })

	const builtExe = findBuiltExe(releaseDir)
	if (!builtExe) {
		throw new Error(
			`Missing Windows binary in ${releaseDir} (looked for ${EXE_CANDIDATES.join(', ')})`
		)
	}

	// Always ship as DashBeam.exe for a stable portable layout / README.
	const exeName = `${PRODUCT_NAME}.exe`
	copyFile(builtExe, path.join(stagingAppDir, exeName))
	if (path.basename(builtExe) !== exeName) {
		console.log(
			`Renamed ${path.basename(builtExe)} → ${exeName} for portable ZIP`
		)
	}

	const loader = path.join(releaseDir, 'WebView2Loader.dll')
	if (fs.existsSync(loader)) {
		copyFile(loader, path.join(stagingAppDir, 'WebView2Loader.dll'))
	}

	stageResources(releaseDir, stagingAppDir)

	fs.writeFileSync(
		path.join(stagingAppDir, PORTABLE_MARKER),
		'portable\n',
		'utf8'
	)
	fs.writeFileSync(
		path.join(stagingAppDir, PORTABLE_README),
		PORTABLE_README_BODY,
		'utf8'
	)

	const stagedExe = path.join(stagingAppDir, exeName)
	const stagedMarker = path.join(stagingAppDir, PORTABLE_MARKER)
	if (!fs.existsSync(stagedExe) || !fs.existsSync(stagedMarker)) {
		throw new Error(
			'Portable staging incomplete: missing exe or .portable marker'
		)
	}
}

function createZipArchive(folderToZip, zipPath) {
	fs.mkdirSync(path.dirname(zipPath), { recursive: true })
	fs.rmSync(zipPath, { force: true })

	const parent = path.dirname(folderToZip)
	const base = path.basename(folderToZip)

	if (process.platform === 'win32') {
		// Compress-Archive mirrors Electron Forge's maker-zip layout: root folder inside the zip.
		execFileSync(
			'powershell.exe',
			[
				'-NoProfile',
				'-NonInteractive',
				'-Command',
				`Compress-Archive -LiteralPath ${JSON.stringify(folderToZip)} -DestinationPath ${JSON.stringify(zipPath)} -CompressionLevel Optimal -Force`,
			],
			{ stdio: 'inherit' }
		)
		return
	}

	// Local smoke-test path on macOS/Linux (zip must be available).
	execFileSync('zip', ['-r', '-q', zipPath, base], {
		cwd: parent,
		stdio: 'inherit',
	})
}

function assertZipLooksValid(zipPath) {
	const stat = fs.statSync(zipPath)
	if (stat.size < 1024 * 100) {
		throw new Error(
			`Portable ZIP looks too small (${stat.size} bytes): ${zipPath}`
		)
	}

	let listing = ''
	if (process.platform === 'win32') {
		listing = execFileSync(
			'powershell.exe',
			[
				'-NoProfile',
				'-NonInteractive',
				'-Command',
				`Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::OpenRead(${JSON.stringify(zipPath)}).Entries | ForEach-Object { $_.FullName }`,
			],
			{ encoding: 'utf8' }
		)
	} else {
		listing = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' })
	}

	const entries = listing
		.split(/\r?\n/)
		.map((line) => line.trim().replace(/\\/g, '/'))
		.filter(Boolean)

	const hasExe = entries.some(
		(e) =>
			e === `${PRODUCT_NAME}/${PRODUCT_NAME}.exe` ||
			e.endsWith(`/${PRODUCT_NAME}.exe`) ||
			e === `${PRODUCT_NAME}.exe`
	)
	const hasMarker = entries.some(
		(e) =>
			e === `${PRODUCT_NAME}/${PORTABLE_MARKER}` ||
			e.endsWith(`/${PORTABLE_MARKER}`) ||
			e === PORTABLE_MARKER
	)

	if (!hasExe || !hasMarker) {
		throw new Error(
			`Portable ZIP missing required entries (exe=${hasExe}, marker=${hasMarker}). Entries:\n${entries.slice(0, 40).join('\n')}`
		)
	}
}

function uploadAsset(zipPath) {
	const releaseId = process.env.RELEASE_ID
	const repo = process.env.GITHUB_REPOSITORY
	if (!releaseId || !repo) {
		console.log('RELEASE_ID/GITHUB_REPOSITORY not set; skipping upload.')
		return
	}

	const name = path.basename(zipPath)
	const assetId = execFileSync(
		'gh',
		[
			'api',
			`repos/${repo}/releases/${releaseId}/assets`,
			'--jq',
			`.[] | select(.name == "${name}") | .id // empty`,
		],
		{ encoding: 'utf8' }
	).trim()

	if (assetId) {
		execFileSync(
			'gh',
			['api', '--method', 'DELETE', `repos/${repo}/releases/assets/${assetId}`],
			{ stdio: 'pipe' }
		)
	}

	execFileSync(
		'gh',
		[
			'api',
			'--method',
			'POST',
			'-H',
			'Content-Type: application/zip',
			'--input',
			zipPath,
			`https://uploads.github.com/repos/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(name)}`,
		],
		{ stdio: 'inherit' }
	)
	console.log(`Uploaded ${name} to release ${releaseId}`)
}

function main() {
	const rustTarget = process.env.RUST_TARGET?.trim()
	if (!rustTarget) {
		throw new Error('RUST_TARGET is required (e.g. x86_64-pc-windows-msvc)')
	}

	const version = readVersion()
	const arch = archLabel(rustTarget)
	const releaseDir = findReleaseDir(rustTarget)
	console.log(`Packaging portable ZIP from ${releaseDir}`)

	const outDir = path.join(
		repoRoot,
		'src-tauri',
		'target',
		rustTarget,
		'release',
		'bundle',
		'portable'
	)
	fs.mkdirSync(outDir, { recursive: true })

	const zipName = `${PRODUCT_NAME}_${version}_${arch}-portable.zip`
	const zipPath = path.join(outDir, zipName)

	const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dashbeam-portable-'))
	const stagingAppDir = path.join(tmpRoot, PRODUCT_NAME)

	try {
		stagePortablePayload(releaseDir, stagingAppDir)
		createZipArchive(stagingAppDir, zipPath)
		assertZipLooksValid(zipPath)
		console.log(`Created ${zipPath} (${fs.statSync(zipPath).size} bytes)`)
		uploadAsset(zipPath)
	} finally {
		fs.rmSync(tmpRoot, { recursive: true, force: true })
	}
}

try {
	main()
} catch (error) {
	console.error(error instanceof Error ? error.message : error)
	process.exit(1)
}
