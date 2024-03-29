#!/usr/bin/env node

import { program as Command } from 'commander'
import FileSystem from 'fs-extra'
import Is from '@pwn/is'
import Path from 'path'
import SourceMapSupport from 'source-map-support'

import { Check } from '../library/check.js'
import { Package } from './library/package.js'

SourceMapSupport.install({ 'handleUncaughtExceptions': false })

const Process = process

Command
  .name(Package.name.replace(/^(.*)\/(.*)$/, '$2'))
  .version(Package.version)
  .option('--project-path <path>', 'Path of the project to check', '.') // Process.cwd())
  .option('--configuration-path <path>', 'Path of the configuration file, if it exists', './mablung-check-dependency.json')
  .option('--report-section', 'Report dependencies that are in the wrong section', true)
  .option('--no-report-section', 'Do not report dependencies that are in the wrong section')
  .option('--report-missing', 'Report missing dependencies', true)
  .option('--no-report-missing', 'Do not report missing dependencies')
  .option('--report-unused', 'Report used dependencies', true)
  .option('--no-report-unused', 'Do not report used dependencies')
  .option('--report-used', 'Report used dependencies', false)
  .action(async (option) => {

    Process.exitCode = 0

    try {

      let path = option.projectPath
      let configuration = null

      if (await FileSystem.pathExists(option.configurationPath)) {
        configuration = await FileSystem.readJson(option.configurationPath, { 'encoding': 'utf-8' })
      } else {
        configuration = {}
      }

      let dependency = await Check(path, configuration)

      if (Is.not.emptyObject(dependency.section) &&
          option.reportSection) {

        Process.exitCode = 1

        let section = null
        section = Object.entries(dependency.section)
        section = section.sort(([ leftDependency ], [ rightDependency ]) => leftDependency.localeCompare(rightDependency))

        console.log('- mis-matched section ------------------')

        section.forEach(([ dependency, section ]) => {
          console.log(`    ${dependency} ...`)
          console.log(`      expected ... ${section.expected}`)
          console.log(`      actual ..... ${section.actual}`)
        })

        console.log()

      }
      
      if (Is.not.emptyObject(dependency.missing) &&
          option.reportMissing) {

        Process.exitCode = 1

        let missingDependency = null
        missingDependency = Object.entries(dependency.missing)
        missingDependency = missingDependency.sort(([ leftDependency ], [ rightDependency ]) => leftDependency.localeCompare(rightDependency))

        console.log('- missing dependencies -----------------')

        missingDependency.forEach(([ dependency, path ]) => {
          console.log(`    ${dependency} used in ...`)
          console.log(path.sort().map((path) => `      ${Path.relative('', path)}`).join('\n'))
        })

        console.log()

      }
      
      if (dependency.unused.length > 0 &&
          option.reportUnused) {

        Process.exitCode = 1

        console.log('- unused dependencies ------------------')
        console.log(dependency.unused.sort().map((dependency) => `    ${dependency}`).join('\n'))
        console.log()

      }

      if (Is.not.emptyObject(dependency.used) &&
          option.reportUsed) {

        let usedDependency = null
        usedDependency = Object.entries(dependency.used)
        usedDependency = usedDependency.sort(([ leftDependency ], [ rightDependency ]) => leftDependency.localeCompare(rightDependency))
    
        console.log('- used dependencies --------------------')

        usedDependency.forEach(([ dependency, path ]) => {
          console.log(`    ${dependency} used in ...`)
          console.log(path.sort().map((path) => `      ${Path.relative('', path)}`).join('\n'))
        })

        console.log()

      }

      if (Process.exitCode === 0) {
        console.log('There are no dependency issues')
      }
      
    } catch (error) {
      Process.exitCode = 2
      console.error(error)
    }

  })

Command
  .parse(Process.argv)
