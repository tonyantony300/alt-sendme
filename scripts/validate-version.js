#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const tauriPackageJsonPath = path.join(__dirname, '../src-tauri/package.json');
const webAppPackageJsonPath = path.join(__dirname, '../web-app/package.json');
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
const readmePath = path.join(__dirname, '../README.md');

const tauriPackageJson = JSON.parse(fs.readFileSync(tauriPackageJsonPath, 'utf8'));
const sourceVersion = tauriPackageJson.version;

if (!sourceVersion) {
  console.error('Error: No version found in src-tauri/package.json');
  process.exit(1);
}

const versions = {
  'src-tauri/package.json': sourceVersion,
  'web-app/package.json': JSON.parse(fs.readFileSync(webAppPackageJsonPath, 'utf8')).version,
  'src-tauri/tauri.conf.json': JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8')).version,
  'src-tauri/Cargo.toml': (() => {
    const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
    const match = cargoToml.match(/^version = "([\d.]+)"/m);
    return match ? match[1] : null;
  })(),
  'README.md badge': (() => {
    const readme = fs.readFileSync(readmePath, 'utf8');
    const match = readme.match(/\[badge-version\]:\s*https:\/\/img\.shields\.io\/badge\/version-([\d.]+)-blue/);
    return match ? match[1] : null;
  })(),
};

let allMatch = true;
const mismatches = [];

for (const [file, version] of Object.entries(versions)) {
  if (version !== sourceVersion) {
    allMatch = false;
    mismatches.push({ file, found: version, expected: sourceVersion });
  }
}

if (!allMatch) {
  console.error('Version mismatch detected!');
  mismatches.forEach(({ file, found, expected }) => {
    console.error(`  - ${file}: found "${found}", expected "${expected}"`);
  });
  process.exit(1);
}

process.exit(0);

