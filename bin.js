#!/usr/bin/env node

const localPackageJSON = process.cwd() + require('path').sep + 'package.json'
let useGlobalPackage

try {
  require(localPackageJSON)
  useGlobalPackage = false
} catch(_) {
  useGlobalPackage = true
}

let indexHTML

if(useGlobalPackage) {
  process.argv[1] = process.cwd()
  indexHTML = 'index.html'
} else {
  process.argv[1] = localPackageJSON
  indexHTML = 'public/index.html'
}

const port = process.argv[2] ?? 8080

process.argv[2] = '--dev'
require('noer')(indexHTML, [8080])
