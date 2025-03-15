#!/usr/bin/env node

const localPackageJSON = require('path').resolve(process.cwd(), 'package.json')
let useGlobalPackage

try {
  require(localPackageJSON)
  useGlobalPackage = false
} catch(_) {
  useGlobalPackage = true
}

let publicDir

if(useGlobalPackage) {
  process.argv[1] = process.cwd()
  publicDir = './'
} else {
  process.argv[1] = localPackageJSON
  publicDir = 'public/'
}

const port = process.argv[2] ?? 8080

process.argv[2] = '--dev'
require('noer')(publicDir, [port])
