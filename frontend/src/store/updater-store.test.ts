import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createUpdaterStore } from './updater-store.js'

test('starts idle with no version', () => {
	const store = createUpdaterStore()
	assert.equal(store.phase(), 'idle')
	assert.equal(store.version(), null)
	assert.equal(store.bannerVisible(), false)
})

test('updateFound moves to available and records the version', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	assert.equal(store.phase(), 'available')
	assert.equal(store.version(), '1.4.2')
})

test('banner becomes visible once an update is found', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	assert.equal(store.bannerVisible(), true)
})

test('dismiss hides the banner for that version', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.dismiss()
	assert.equal(store.bannerVisible(), false)
	assert.equal(store.dismissedVersion(), '1.4.2')
})

test('a re-check of a dismissed version keeps the banner hidden', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.dismiss()
	store.updateFound('1.4.2')
	assert.equal(store.bannerVisible(), false)
})

test('a newer version shows the banner again after a dismissal', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.dismiss()
	store.updateFound('1.5.0')
	assert.equal(store.bannerVisible(), true)
})

test('a version dismissed in a previous session stays hidden', () => {
	const store = createUpdaterStore({ dismissedVersion: '1.4.2' })
	store.updateFound('1.4.2')
	assert.equal(store.bannerVisible(), false)
})

test('startDownload moves to downloading', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	assert.equal(store.startDownload(), true)
	assert.equal(store.phase(), 'downloading')
})

test('startDownload is refused while a download is already running', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	assert.equal(store.startDownload(), false)
})

test('startDownload is refused when no update is available', () => {
	const store = createUpdaterStore()
	assert.equal(store.startDownload(), false)
	assert.equal(store.phase(), 'idle')
})

test('a dismissed update shows the banner again once downloading starts', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.dismiss()
	store.startDownload()
	assert.equal(store.bannerVisible(), true)
})

test('progress accumulates chunk lengths', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.addProgress(100)
	store.addProgress(50)
	assert.equal(store.downloadedBytes(), 150)
})

test('progressRatio is null until the content length is known', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.addProgress(100)
	assert.equal(store.progressRatio(), null)
})

test('progressRatio reflects downloaded over total', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.setContentLength(400)
	store.addProgress(100)
	assert.equal(store.progressRatio(), 0.25)
})

test('progressRatio never exceeds 1', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.setContentLength(100)
	store.addProgress(180)
	assert.equal(store.progressRatio(), 1)
})

test('downloadFinished moves to installing', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.downloadFinished()
	assert.equal(store.phase(), 'installing')
})

test('installFinished moves to ready', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.downloadFinished()
	store.installFinished()
	assert.equal(store.phase(), 'ready')
})

test('a ready update ignores a dismissal from before the download', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.dismiss()
	store.startDownload()
	store.downloadFinished()
	store.installFinished()
	assert.equal(store.bannerVisible(), true)
})

test('fail returns to available so the user can retry', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.fail()
	assert.equal(store.phase(), 'available')
	assert.equal(store.startDownload(), true)
})

test('fail clears download progress', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.setContentLength(400)
	store.addProgress(100)
	store.fail()
	assert.equal(store.downloadedBytes(), 0)
	assert.equal(store.progressRatio(), null)
})

test('updateFound does not clobber an in-flight download', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.setContentLength(400)
	store.addProgress(100)
	store.updateFound('1.4.2')
	assert.equal(store.phase(), 'downloading')
	assert.equal(store.downloadedBytes(), 100)
})

test('noUpdate resets an available update to idle', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.noUpdate()
	assert.equal(store.phase(), 'idle')
	assert.equal(store.version(), null)
})

test('noUpdate is ignored while a download is running', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.noUpdate()
	assert.equal(store.phase(), 'downloading')
})

test('restarting moves to restarting', () => {
	const store = createUpdaterStore()
	store.updateFound('1.4.2')
	store.startDownload()
	store.downloadFinished()
	store.installFinished()
	store.restarting()
	assert.equal(store.phase(), 'restarting')
})
