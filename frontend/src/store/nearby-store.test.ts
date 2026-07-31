import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createNearbyStore } from './nearby-store.js'

const device = (id: string, identified = false) => ({
	endpointId: id,
	fingerprint: 'AAAA-AAAA-AAAA',
	displayName: identified ? 'Bob' : null,
	deviceType: identified ? 'laptop' : null,
	os: identified ? 'macos' : null,
	identified,
})

test('upsert adds a device', () => {
	const store = createNearbyStore()
	store.upsert(device('aa'))
	assert.equal(store.devices().length, 1)
})

test('upsert replaces rather than duplicating', () => {
	const store = createNearbyStore()
	store.upsert(device('aa'))
	store.upsert(device('aa', true))
	assert.equal(store.devices().length, 1)
	assert.equal(store.devices()[0].identified, true)
})

test('remove drops a device', () => {
	const store = createNearbyStore()
	store.upsert(device('aa'))
	store.remove('aa')
	assert.equal(store.devices().length, 0)
})

test('remove of an unknown device is a no-op', () => {
	const store = createNearbyStore()
	store.remove('missing')
	assert.equal(store.devices().length, 0)
})

test('devices are ordered identified-first, then by name', () => {
	const store = createNearbyStore()
	store.upsert({ ...device('cc', true), displayName: 'Zoe' })
	store.upsert(device('aa'))
	store.upsert({ ...device('bb', true), displayName: 'Adam' })
	const names = store.devices().map((d) => d.displayName)
	assert.deepEqual(names, ['Adam', 'Zoe', null])
})

test('setUnavailable records a reason', () => {
	const store = createNearbyStore()
	assert.equal(store.unavailableReason(), null)
	store.setUnavailable('mDNS unavailable')
	assert.equal(store.unavailableReason(), 'mDNS unavailable')
})

test('setUnavailable can be cleared back to null', () => {
	const store = createNearbyStore()
	store.setUnavailable('mDNS unavailable')
	store.setUnavailable(null)
	assert.equal(store.unavailableReason(), null)
})
