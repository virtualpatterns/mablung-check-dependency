import Path from 'path'
import Test from 'ava'
import URL from 'url'

import { Check, FileParseError } from '../../index.js'

const FilePath = URL.fileURLToPath(import.meta.url)
const FolderPath = Path.dirname(FilePath)
const Process = process

// the resources in source are used because 
// babel doesn't copy dot files (e.g. .babelrc.json)
const ResourcePath = Path.normalize(`${FolderPath}/../../../source/test/library/resource`)

Test('Check(\'ignore-match\', { ignoreMatch: [ ... ] })', async (test) => {
  test.deepEqual(await Check(`${ResourcePath}/ignore-match`, { 'ignoreMatch': [ '@virtualpatterns/mablung-dependency' ] }), { 
    'missing': {}, 
    'unused': [],
    'used': {}
  })
})

Test('Check(\'ignore-pattern\', { ignorePattern: [ ... ] })', async (test) => {
  test.deepEqual(await Check(`${ResourcePath}/ignore-pattern`, { 'ignorePattern': [ 'ignore-pattern.js' ] }), { 
    'missing': {}, 
    'unused': [
      '@virtualpatterns/mablung-dependency'
    ],
    'used': {}
  })
})

Test('Check(\'error\') throws FileParseError', async (test) => {
  await test.throwsAsync(Check(`${ResourcePath}/error`), { 'instanceOf': FileParseError })
})

Test('Check(\'./release/test/library/resource/ignore-match\')', async (test) => {
  test.is(Process.cwd(), Path.normalize(`${FolderPath}/../../..`))
  await test.notThrowsAsync(Check('./release/test/library/resource/ignore-match'))
})
