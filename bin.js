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
  processs.argv[1] = process.cwd()
  indexHTML = 'index.html'
} else {
  processs.argv[1] = localPackageJSON
  indexHTML = 'public/index.html'
}

process.argv[2] = '--dev'
require('noer')(indexHTML, [8080])
