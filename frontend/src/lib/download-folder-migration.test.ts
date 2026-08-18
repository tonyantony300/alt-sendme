import assert from 'node:assert/strict'
import { test } from 'node:test'
import { migrateDownloadFolder } from './download-folder-migration.js'

test('clears a stored SAF folder when upgrading from version 1', () => {
	const migrated = migrateDownloadFolder(
		{
			downloadsUri: 'content://com.android.externalstorage.documents/tree/foo',
			downloadsPath: '/storage/emulated/0/Download/Altsendme',
		},
		1
	)

	assert.equal(migrated.downloadsUri, '')
	assert.equal(migrated.downloadsPath, '')
})

test('leaves a folder picked after the migration alone', () => {
	const picked = {
		downloadsUri: 'content://com.android.externalstorage.documents/tree/sdcard',
		downloadsPath: '/storage/1A2B-3C4D/Transfers',
	}

	const migrated = migrateDownloadFolder(picked, 2)

	assert.equal(migrated.downloadsUri, picked.downloadsUri)
	assert.equal(migrated.downloadsPath, picked.downloadsPath)
})

test('carries unrelated settings through the migration', () => {
	const migrated = migrateDownloadFolder(
		{
			downloadsUri: 'content://tree/foo',
			downloadsPath: '/storage/emulated/0/Download/Altsendme',
			discoverability: 'paired-only',
			relayMode: 'custom',
		},
		1
	)

	assert.equal(migrated.discoverability, 'paired-only')
	assert.equal(migrated.relayMode, 'custom')
})

test('tolerates a persisted state that never stored a folder', () => {
	const migrated = migrateDownloadFolder({ minimizeToTray: true }, 1)

	assert.equal(migrated.downloadsUri, '')
	assert.equal(migrated.downloadsPath, '')
	assert.equal(migrated.minimizeToTray, true)
})
