import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , scriptPath, ...scriptArgs] = process.argv

if (!scriptPath) {
  console.error('Usage: node scripts/run-python-script.mjs <script.py> [...args]')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const absoluteScriptPath = path.resolve(root, scriptPath)

const candidates = [
  ...(process.env.PYTHON ? [[process.env.PYTHON]] : []),
  ['python3'],
  ['python'],
  ['py', '-3'],
]

let lastFailure

for (const candidate of candidates) {
  const [command, ...commandArgs] = candidate
  const result = spawnSync(command, [...commandArgs, absoluteScriptPath, ...scriptArgs], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })

  if (result.error?.code === 'ENOENT') {
    lastFailure = result.error
    continue
  }

  if (result.error) {
    console.error(`Failed to run ${command}: ${result.error.message}`)
    process.exit(1)
  }

  process.exit(result.status ?? 0)
}

console.error(
  [
    'Could not find a Python 3 executable.',
    'Tried PYTHON, python3, python, and py -3.',
    'Install Python 3 or set PYTHON to the full path of your Python executable.',
    lastFailure ? `Last error: ${lastFailure.message}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
)
process.exit(1)
