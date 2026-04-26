#!/usr/bin/env node
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { load } from 'js-yaml'
import Ajv from 'ajv'

const __dirname = dirname(fileURLToPath(import.meta.url))

const filePath = process.argv[2] ?? 'project.yml'
const schemaPath = resolve(__dirname, '..', 'assets', 'schema-v1.0.0.json')

let doc
try {
  doc = load(readFileSync(filePath, 'utf8'))
} catch {
  console.error(`error: cannot read ${filePath}`)
  process.exit(1)
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv({ strict: false })
const valid = ajv.validate(schema, doc)

if (valid) {
  console.log(`✓  ${filePath} is valid`)
} else {
  console.error(`✗  ${filePath} is invalid`)
  for (const err of ajv.errors) {
    console.error(`   at ${err.instancePath || '(root)'}: ${err.message}`)
  }
  process.exit(1)
}
