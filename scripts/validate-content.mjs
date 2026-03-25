import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const romDirectory = path.join(root, 'src', 'content', 'roms')
const siteContentPath = path.join(root, 'src', 'content', 'site', 'site-content.json')
const telegramPattern = /^https:\/\/t\.me\/.+/

const romStringFields = [
  'name',
  'version',
  'status',
  'branch',
  'tagline',
  'buildDate',
  'channelLabel',
  'telegramUrl',
  'maintenanceNote',
  'accent',
  'accentSoft',
  'accentStrong',
]

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateTelegramUrl(value, label) {
  assert(typeof value === 'string', `${label} must be a string`)

  if (value.length === 0) {
    return
  }

  assert(telegramPattern.test(value), `${label} must start with https://t.me/`)
}

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

function validateRom(rom, fileName, seenOrders, seenNames) {
  assert(Number.isInteger(rom.order), `${fileName}: order must be an integer`)
  assert(!seenOrders.has(rom.order), `${fileName}: duplicate order ${rom.order}`)
  seenOrders.add(rom.order)

  for (const key of romStringFields) {
    assert(typeof rom[key] === 'string', `${fileName}: ${key} must be a string`)
  }

  assert(isNonEmptyString(rom.name), `${fileName}: name is required`)
  assert(!seenNames.has(rom.name), `${fileName}: duplicate ROM name "${rom.name}"`)
  seenNames.add(rom.name)

  assert(Array.isArray(rom.devices) && rom.devices.length > 0, `${fileName}: devices must be a non-empty array`)
  assert(
    rom.devices.every(isNonEmptyString),
    `${fileName}: each device must be a non-empty string`,
  )

  assert(
    Array.isArray(rom.highlights) && rom.highlights.length > 0,
    `${fileName}: highlights must be a non-empty array`,
  )
  assert(
    rom.highlights.every(isNonEmptyString),
    `${fileName}: each highlight must be a non-empty string`,
  )

  validateTelegramUrl(rom.telegramUrl, `${fileName}: telegramUrl`)
}

function validateSiteContent(siteContent) {
  const { communityHub, sourceChanges, builderUpdates, supportMatrix, expansionCards } = siteContent

  assert(communityHub && typeof communityHub === 'object', 'site-content.json: communityHub is required')
  assert(isNonEmptyString(communityHub.title), 'site-content.json: communityHub.title is required')
  assert(isNonEmptyString(communityHub.summary), 'site-content.json: communityHub.summary is required')
  assert(isNonEmptyString(communityHub.ctaLabel), 'site-content.json: communityHub.ctaLabel is required')
  assert(
    Array.isArray(communityHub.highlights) && communityHub.highlights.every(isNonEmptyString),
    'site-content.json: communityHub.highlights must be an array of non-empty strings',
  )
  validateTelegramUrl(communityHub.telegramUrl, 'site-content.json: communityHub.telegramUrl')

  assert(Array.isArray(sourceChanges), 'site-content.json: sourceChanges must be an array')
  sourceChanges.forEach((entry, index) => {
    assert(isNonEmptyString(entry.title), `site-content.json: sourceChanges[${index}].title is required`)
    assert(isNonEmptyString(entry.date), `site-content.json: sourceChanges[${index}].date is required`)
    assert(
      isNonEmptyString(entry.summary),
      `site-content.json: sourceChanges[${index}].summary is required`,
    )
    assert(
      Array.isArray(entry.items) && entry.items.every(isNonEmptyString),
      `site-content.json: sourceChanges[${index}].items must be an array of non-empty strings`,
    )
  })

  assert(Array.isArray(builderUpdates), 'site-content.json: builderUpdates must be an array')
  builderUpdates.forEach((entry, index) => {
    assert(isNonEmptyString(entry.type), `site-content.json: builderUpdates[${index}].type is required`)
    assert(isNonEmptyString(entry.date), `site-content.json: builderUpdates[${index}].date is required`)
    assert(isNonEmptyString(entry.title), `site-content.json: builderUpdates[${index}].title is required`)
    assert(
      isNonEmptyString(entry.summary),
      `site-content.json: builderUpdates[${index}].summary is required`,
    )
  })

  assert(Array.isArray(supportMatrix), 'site-content.json: supportMatrix must be an array')
  supportMatrix.forEach((entry, index) => {
    assert(isNonEmptyString(entry.badge), `site-content.json: supportMatrix[${index}].badge is required`)
    assert(isNonEmptyString(entry.name), `site-content.json: supportMatrix[${index}].name is required`)
    assert(
      isNonEmptyString(entry.summary),
      `site-content.json: supportMatrix[${index}].summary is required`,
    )
    assert(isNonEmptyString(entry.focus), `site-content.json: supportMatrix[${index}].focus is required`)
  })

  assert(Array.isArray(expansionCards), 'site-content.json: expansionCards must be an array')
  expansionCards.forEach((entry, index) => {
    assert(isNonEmptyString(entry.title), `site-content.json: expansionCards[${index}].title is required`)
    assert(
      isNonEmptyString(entry.summary),
      `site-content.json: expansionCards[${index}].summary is required`,
    )
  })
}

async function main() {
  const romFiles = (await readdir(romDirectory)).filter((file) => file.endsWith('.json'))
  const seenOrders = new Set()
  const seenNames = new Set()

  for (const fileName of romFiles) {
    const rom = await readJson(path.join(romDirectory, fileName))
    validateRom(rom, fileName, seenOrders, seenNames)
  }

  const siteContent = await readJson(siteContentPath)
  validateSiteContent(siteContent)

  console.log(`Validated ${romFiles.length} ROM files and shared site content.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
