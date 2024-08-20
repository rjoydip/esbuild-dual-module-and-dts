import { stdout } from 'node:process'
import { join, parse } from 'node:path'
import { rename } from 'node:fs/promises'
import { exec as exec$ } from 'node:child_process'
import { promisify } from 'node:util'
import arg from 'arg'
import { build } from 'esbuild'
import type { BuildOptions, BuildResult } from 'esbuild'
import glob from 'fast-glob'

const exca = promisify(exec$)

const args = arg({
  '--watch': Boolean,
})

const isWatch = args['--watch'] || false

const entryPoints = await glob.sync('./src/**/*.ts', {
  ignore: ['./src/**/*.test.ts'],
})

const commonOptions: BuildOptions = {
  entryPoints,
  logLevel: 'info',
  platform: 'node',
  metafile: true,
}

function cjsBuild(): Promise<BuildResult> {
  return build({
    ...commonOptions,
    outbase: './src',
    outdir: './dist/cjs',
    format: 'cjs',
    outExtension: {
      '.js': '.cjs',
    },
  })
}

function esmBuild(): Promise<BuildResult> {
  return build({
    ...commonOptions,
    bundle: true,
    outbase: './src',
    outdir: './dist',
    format: 'esm',
    outExtension: {
      '.js': '.mjs',
    },
  })
}

const results = await Promise.all([esmBuild(), cjsBuild()])

await exca(`tsc ${isWatch ? '-w' : ''} --declaration --emitDeclarationOnly --module esnext --declarationDir ./dist`)
await exca(`tsc ${isWatch ? '-w' : ''} --declaration --emitDeclarationOnly --module commonjs --declarationDir ./dist/cjs`)
await exca(`echo {"type": "commonjs"} > ./dist/cjs/package.json`)

if (results[1].metafile) {
  await Promise.all(
    Object.entries(results[1].metafile.outputs).map(async (item) => {
      const { dir, name } = parse(item[0])
      await rename(join(dir, `${name}.d.ts`), join(dir, `${name}.d.cts`))
    }),
  )
}

stdout.write('\nBuild completed\n')
