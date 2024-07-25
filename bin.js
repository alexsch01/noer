#!/usr/bin/env node

process.argv[1] = process.cwd() + require('path').sep + 'package.json'
process.argv[2] = '--dev'
require('noer')('public/index.html', [8080])
