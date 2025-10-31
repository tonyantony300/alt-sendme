#!/usr/bin/env node

/**
 * Sync version from src-tauri/package.json to all other places
 * Single source of truth: src-tauri/package.json
 */

const fs = require('fs');
const path = require('path');

const tauriPackageJsonPath = path.join(__dirname, '../src-tauri/package.json');
const webAppPackageJsonPath = path.join(__dirname, '../web-app/package.json');
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
const readmePath = path.join(__dirname, '../README.md');

// Read version from source of truth
const tauriPackageJson = JSON.parse(fs.readFileSync(tauriPackageJsonPath, 'utf8'));
const version = tauriPackageJson.version;

if (!version) {
  console.error('Error: No version found in src-tauri/package.json');
  process.exit(1);
}

console.log(` Syncing version ${version} from src-tauri/package.json...`);

// Update web-app/package.json
const webAppPackageJson = JSON.parse(fs.readFileSync(webAppPackageJsonPath, 'utf8'));
webAppPackageJson.version = version;
fs.writeFileSync(webAppPackageJsonPath, JSON.stringify(webAppPackageJson, null, 2) + '\n');


// Update tauri.conf.json
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = version;
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');


// Update Cargo.toml
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = "[\d.]+"/m, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);


// Update README.md - replace version in download URLs and filenames
let readme = fs.readFileSync(readmePath, 'utf8');
// For URLs: replace v0.1.1 with v{version}
readme = readme.replace(/\/download\/v[\d.]+/g, `/download/v${version}`);
// For filenames: replace AltSendme_0.1.1_ with AltSendme_{version}_
readme = readme.replace(/AltSendme_[\d.]+_/g, `AltSendme_${version}_`);

fs.writeFileSync(readmePath, readme);


