import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const wireframeRoot = path.resolve(scriptDirectory, '..')
const repositoryRoot = path.resolve(wireframeRoot, '..')
const contentRoot = path.join(wireframeRoot, 'docs-site', 'content')
const documentationRoot = path.join(repositoryRoot, 'docs', 'mobile-app')
const knowledgeBaseRoot = path.join(repositoryRoot, 'knowledge-base', 'mobile-app')
const githubSourceBase = 'https://github.com/yarsuleimenov-code/Mobile_app/blob/main/'

const requiredFiles = [
  'docs/mobile-app/README.md',
  'docs/mobile-app/quick-start.md',
  'docs/mobile-app/user-guide.md',
  'docs/mobile-app/business-overview.md',
  'docs/mobile-app/ru/README.md',
  'docs/mobile-app/ru/quick-start.md',
  'docs/mobile-app/ru/user-guide.md',
  'docs/mobile-app/ru/business-overview.md',
  'knowledge-base/mobile-app/getting-started.md',
  'knowledge-base/mobile-app/pickup.md',
  'knowledge-base/mobile-app/dropoff.md',
  'knowledge-base/mobile-app/same-day.md',
  'knowledge-base/mobile-app/scan-and-cargo.md',
  'knowledge-base/mobile-app/interstate-and-bol.md',
  'knowledge-base/mobile-app/ru/getting-started.md',
  'knowledge-base/mobile-app/ru/pickup.md',
  'knowledge-base/mobile-app/ru/dropoff.md',
  'knowledge-base/mobile-app/ru/same-day.md',
  'knowledge-base/mobile-app/ru/scan-and-cargo.md',
  'knowledge-base/mobile-app/ru/interstate-and-bol.md',
]

const normalize = (filePath) => path.resolve(filePath).toLowerCase()
const toPosix = (filePath) => filePath.split(path.sep).join('/')
const entries = []
const destinationBySource = new Map()

function addEntry(source, destination, kind = 'markdown') {
  const entry = {
    source: path.resolve(source),
    destination: toPosix(destination),
    kind,
  }
  entries.push(entry)
  destinationBySource.set(normalize(entry.source), entry.destination)
}

async function addMarkdownDirectory(sourceDirectory, destinationDirectory, options = {}) {
  const directoryEntries = await readdir(sourceDirectory, { withFileTypes: true })

  for (const item of directoryEntries) {
    if (
      !item.isFile() ||
      path.extname(item.name).toLowerCase() !== '.md' ||
      options.excludedFiles?.includes(item.name)
    ) {
      continue
    }

    const destinationName = item.name === 'README.md' ? 'index.md' : item.name

    addEntry(
      path.join(sourceDirectory, item.name),
      path.join(destinationDirectory, destinationName),
    )
  }
}

async function addAssetDirectory(sourceDirectory, destinationDirectory) {
  const directoryEntries = await readdir(sourceDirectory, { withFileTypes: true })

  for (const item of directoryEntries) {
    const source = path.join(sourceDirectory, item.name)
    const destination = path.join(destinationDirectory, item.name)

    if (item.isDirectory()) {
      await addAssetDirectory(source, destination)
    } else if (item.isFile()) {
      addEntry(source, destination, 'asset')
    }
  }
}

function splitTarget(target) {
  const hashIndex = target.indexOf('#')
  if (hashIndex === -1) return { pathname: target, hash: '' }
  return {
    pathname: target.slice(0, hashIndex),
    hash: target.slice(hashIndex),
  }
}

function repositoryUrl(filePath, hash) {
  const relativePath = toPosix(path.relative(repositoryRoot, filePath))
  const encodedPath = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${githubSourceBase}${encodedPath}${hash}`
}

function rewriteMarkdownLinks(markdown, sourceFile, destinationFile, errors) {
  const destinationDirectory = path.dirname(path.join(contentRoot, destinationFile))
  const linkPattern = /(!?\[[^\]]*\]\()([^)]+)(\))/g

  return markdown.replace(linkPattern, (fullMatch, prefix, rawTarget, suffix) => {
    const target = rawTarget.trim()

    if (
      !target ||
      target.startsWith('#') ||
      /^(?:https?:|mailto:|tel:|data:)/i.test(target)
    ) {
      return fullMatch
    }

    const { pathname, hash } = splitTarget(target)
    if (!pathname) return fullMatch

    const resolvedSource = path.resolve(path.dirname(sourceFile), decodeURI(pathname))
    const mappedDestination = destinationBySource.get(normalize(resolvedSource))

    if (mappedDestination) {
      const mappedPath = path.join(contentRoot, mappedDestination)
      let relativePath = toPosix(path.relative(destinationDirectory, mappedPath))
      if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`
      return `${prefix}${relativePath}${hash}${suffix}`
    }

    if (existsSync(resolvedSource)) {
      return `${prefix}${repositoryUrl(resolvedSource, hash)}${suffix}`
    }

    errors.push(
      `${toPosix(path.relative(repositoryRoot, sourceFile))}: unresolved link ${target}`,
    )
    return fullMatch
  })
}

async function ensureRequiredSources() {
  const missing = []

  for (const relativeFile of requiredFiles) {
    const absoluteFile = path.join(repositoryRoot, relativeFile)
    if (!existsSync(absoluteFile)) missing.push(relativeFile)
  }

  if (missing.length > 0) {
    throw new Error(`Required documentation is missing:\n${missing.join('\n')}`)
  }
}

async function prepareEntries() {
  await addMarkdownDirectory(documentationRoot, 'en', {
    excludedFiles: ['open-questions.md'],
  })
  await addMarkdownDirectory(path.join(documentationRoot, 'ru'), 'ru', {
    excludedFiles: ['open-questions.md'],
  })
  await addMarkdownDirectory(knowledgeBaseRoot, path.join('en', 'knowledge-base'))
  await addMarkdownDirectory(
    path.join(knowledgeBaseRoot, 'ru'),
    path.join('ru', 'knowledge-base'),
  )
  await addAssetDirectory(path.join(documentationRoot, 'images'), 'images')
}

async function writeLandingPage() {
  const landingPage = `---
layout: home
title: Zaberman Mobile App Help

hero:
  name: Zaberman Mobile App
  text: User Guide and Knowledge Base
  tagline: Choose your language to open the mobile-friendly documentation.
  actions:
    - theme: brand
      text: Русская инструкция
      link: /ru/
    - theme: alt
      text: English documentation
      link: /en/

features:
  - title: Быстрый старт
    details: Основные действия для первого рабочего сценария.
  - title: Операционные инструкции
    details: Pickup, Dropoff, Same Day, Scan, Cargo и Interstate.
  - title: Единая публикация
    details: Документация поставляется вместе с бизнес-прототипом.
---
`

  await writeFile(path.join(contentRoot, 'index.md'), landingPage, 'utf8')
}

async function copyEntries() {
  const errors = []

  for (const entry of entries) {
    const destination = path.join(contentRoot, entry.destination)
    await mkdir(path.dirname(destination), { recursive: true })

    if (entry.kind === 'asset') {
      await copyFile(entry.source, destination)
      continue
    }

    const sourceContent = await readFile(entry.source, 'utf8')
    const transformed = rewriteMarkdownLinks(
      sourceContent,
      entry.source,
      entry.destination,
      errors,
    )
    await writeFile(destination, transformed, 'utf8')
  }

  if (errors.length > 0) {
    throw new Error(`Documentation link preparation failed:\n${errors.join('\n')}`)
  }
}

async function verifyOutput() {
  for (const requiredOutput of [
    'index.md',
    'ru/index.md',
    'ru/quick-start.md',
    'ru/user-guide.md',
    'en/index.md',
    'en/quick-start.md',
    'en/user-guide.md',
    'images/home.png',
  ]) {
    const outputPath = path.join(contentRoot, requiredOutput)
    const outputStat = await stat(outputPath)
    if (!outputStat.isFile()) {
      throw new Error(`Expected output is not a file: ${requiredOutput}`)
    }
  }
}

await ensureRequiredSources()
await rm(contentRoot, { recursive: true, force: true })
await mkdir(contentRoot, { recursive: true })
await prepareEntries()
await writeLandingPage()
await copyEntries()
await verifyOutput()

console.log(`Prepared ${entries.length} documentation files in ${contentRoot}`)
