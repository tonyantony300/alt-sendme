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

// Read version from source of truth
const tauriPackageJson = JSON.parse(fs.readFileSync(tauriPackageJsonPath, 'utf8'));
const version = tauriPackageJson.version;

if (!version) {
  console.error('Error: No version found in src-tauri/package.json');
  process.exit(1);
}

console.log(`📦 Syncing version ${version} from src-tauri/package.json...`);

// Update web-app/package.json
const webAppPackageJson = JSON.parse(fs.readFileSync(webAppPackageJsonPath, 'utf8'));
webAppPackageJson.version = version;
fs.writeFileSync(webAppPackageJsonPath, JSON.stringify(webAppPackageJson, null, 2) + '\n');
console.log(`✅ Updated web-app/package.json`);

// Update tauri.conf.json
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = version;
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
console.log(`✅ Updated src-tauri/tauri.conf.json`);

// Update Cargo.toml
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = "[\d.]+"/m, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log(`✅ Updated src-tauri/Cargo.toml`);

console.log(`\n✨ Version sync complete! All files now use version ${version}`);
console.log(`\n💡 To update the version, edit src-tauri/package.json and run this script.`);

