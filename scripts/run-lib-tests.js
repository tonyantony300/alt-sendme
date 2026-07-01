import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const outputDir = 'tmp/lib-test-dist'
const testDir = join(outputDir, 'web-app/src/lib')
const tscBin = join('node_modules', 'typescript', 'bin', 'tsc')

function collectTestFiles(directory) {
	return readdirSync(directory, { withFileTypes: true })
		.sort((a, b) => a.name.localeCompare(b.name))
		.flatMap((entry) => {
			const path = join(directory, entry.name)
			if (entry.isDirectory()) {
				return collectTestFiles(path)
			}
			return entry.isFile() && entry.name.endsWith('.test.js') ? [path] : []
		})
}

function run(command, args) {
	const result = spawnSync(command, args, { stdio: 'inherit', shell: false })
	if (result.error) {
		throw result.error
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1)
	}
}

rmSync(outputDir, { recursive: true, force: true })
run(process.execPath, [tscBin, '-p', 'tsconfig.lib-test.json'])

const testFiles = existsSync(testDir) ? collectTestFiles(testDir) : []
if (testFiles.length === 0) {
	console.error(`No lib tests found in ${testDir}`)
	process.exit(1)
}

run(process.execPath, ['--test', ...testFiles])
