import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const distRoot = path.resolve(scriptDirectory, '..', 'dist')
const requiredFiles = [
  'index.html',
  'help/index.html',
  'help/ru/index.html',
  'help/en/index.html',
]
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.txt', '.xml'])
const privateMarkers = [/open-questions/i, /open questions/i, /открытые вопросы/i]

async function collectFiles(directory) {
  const files = []
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const itemPath = path.join(directory, item.name)
    if (item.isDirectory()) files.push(...(await collectFiles(itemPath)))
    if (item.isFile()) files.push(itemPath)
  }
  return files
}

for (const relativeFile of requiredFiles) {
  const file = path.join(distRoot, relativeFile)
  const fileStat = await stat(file)
  if (!fileStat.isFile()) throw new Error('Missing Pages artifact file: ' + relativeFile)
}

const files = await collectFiles(distRoot)
const violations = []

for (const file of files) {
  const relativeFile = path.relative(distRoot, file).split(path.sep).join('/')
  if (privateMarkers.some((marker) => marker.test(relativeFile))) {
    violations.push(relativeFile + ': private path marker')
  }
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue
  const content = await readFile(file, 'utf8')
  if (privateMarkers.some((marker) => marker.test(content))) {
    violations.push(relativeFile + ': private content marker')
  }
}

if (violations.length > 0) {
  throw new Error('Private documentation leaked into Pages artifact:\n' + violations.join('\n'))
}

console.log('Verified ' + files.length + ' Pages artifact files; private Open Questions are absent.')
