import { exec as exec$ } from 'node:child_process'
import { promisify } from 'node:util'

const exca = promisify(exec$)

// await exca(`npx tsc --declaration --emitDeclarationOnly --module esnext --declarationDir ./dist`)
await exca(`npx tsc --declaration --emitDeclarationOnly --module commonjs --declarationDir ./dist/cjs`)
await exca(`echo {"type": "commonjs"} > ./dist/cjs/package.json`)
