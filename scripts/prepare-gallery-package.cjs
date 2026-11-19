const { writeFileSync } = require('node:fs')
const path = require('node:path')

writeFileSync(path.resolve(__dirname, '../.dist/package.json'), '{"type":"module"}\n')
