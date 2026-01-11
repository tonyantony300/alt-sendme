#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPackageJsonPath = path.join(__dirname, '../package.json');
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
const readmePath = path.join(__dirname, '../README.md');

const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
const sourceVersion = rootPackageJson.version;

if (!sourceVersion) {
  console.error('Error: No version found in src-tauri/package.json');
  process.exit(1);
}

const versions = {
  'package.json': JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8')).version,
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

