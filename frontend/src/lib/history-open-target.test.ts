import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	canOpenTransfer,
	resolveAndroidOpenTarget,
} from './history-open-target.js'

test('a recorded tree is reopened exactly, not the folder settings holds now', () => {
	assert.deepEqual(
		resolveAndroidOpenTarget({
			saveUri: 'content://tree/work',
			savePath: 'Download/Work',
		}),
		{ kind: 'folder', treeUri: 'content://tree/work' }
	)
})

test('a MediaStore receive opens the folder its path names', () => {
	assert.deepEqual(
		resolveAndroidOpenTarget({ savePath: '/Download/DashBeam/' }),
		{ kind: 'downloads', relativePath: 'Download/DashBeam' }
	)
})

test('a row with no destination has nothing to open', () => {
	assert.equal(resolveAndroidOpenTarget({}), null)
	assert.equal(resolveAndroidOpenTarget({ savePath: '   ' }), null)
	assert.equal(canOpenTransfer({ savePath: '   ' }), false)
	assert.equal(canOpenTransfer({ savePath: '/Download' }), true)
})
