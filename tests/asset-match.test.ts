import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import sharp from 'sharp'
import { matchBuiltImages } from '../src/grade/asset-match.ts'
import { scenarioAssetsDir } from '../src/scenario.ts'

// Real key art: synthetic images lack the structure that tells two pictures apart.
const assets = scenarioAssetsDir('ocarina-remake')
const kokiri = path.join(assets, 'thumb-1920-1414762.png')
const epona = path.join(assets, 'link-on-epona-with-death-mountain-in-the-distance-in-zelda-ocarina-of-time-remake.avif')

test('matches a resized, re-encoded crop to its asset, and not a different picture', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'doomsday-assets-'))
  try {
    const { width = 0, height = 0 } = await sharp(kokiri).metadata()
    // A portrait crop for phones, the hardest case: about a third of the width.
    const crop = path.join(dir, 'kokiri-portrait-800.webp')
    await sharp(kokiri).extract({ left: Math.round(width * 0.3), top: 0, width: Math.round(height * 0.5625), height }).resize({ width: 800 }).webp({ quality: 70 }).toFile(crop)
    const other = path.join(dir, 'epona-1280.avif')
    await sharp(epona).resize({ width: 1280 }).avif().toFile(other)

    const matches = await matchBuiltImages([crop, other], [kokiri])
    assert.deepEqual(matches.map((m) => path.basename(m.built)), ['kokiri-portrait-800.webp'])
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
