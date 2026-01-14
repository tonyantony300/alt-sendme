#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootPackageJsonPath = path.join(__dirname, '../package.json')
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json')
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml')
const readmePath = path.join(__dirname, '../README.md')

const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'))
const version = rootPackageJson.version

if (!version) {
	console.error('Error: No version found in package.json')
	process.exit(1)
}

const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'))
tauriConfig.version = version
fs.writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`)

let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8')
cargoToml = cargoToml.replace(/^version = "[\d.]+"/m, `version = "${version}"`)
fs.writeFileSync(cargoTomlPath, cargoToml)

let readme = fs.readFileSync(readmePath, 'utf8')
readme = readme.replace(/\/download\/v[\d.]+/g, `/download/v${version}`)
readme = readme.replace(/AltSendme_[\d.]+_/g, `AltSendme_${version}_`)
readme = readme.replace(
	/\[badge-version\]:\s*https:\/\/img\.shields\.io\/badge\/version-[\d.]+-blue/g,
	`[badge-version]: https://img.shields.io/badge/version-${version}-blue`
)

fs.writeFileSync(readmePath, readme)
