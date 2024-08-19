import { stdout } from 'node:process'
import { join, parse } from 'node:path'
import { existsSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import { exec as exec$ } from 'node:child_process'
import { promisify } from 'node:util'
import arg from 'arg'
import { build } from 'esbuild'
import type { BuildOptions, BuildResult, Plugin, PluginBuild } from 'esbuild'
import glob from 'fast-glob'

const exca = promisify(exec$)

const args = arg({
  '--watch': Boolean,
})

const isWatch = args['--watch'] || false

const entryPoints = await glob.sync('./src/**/*.ts', {
  ignore: ['./src/**/*.test.ts'],
})

/*
  This plugin is inspired by the following.
  https://github.com/evanw/esbuild/issues/622#issuecomment-769462611
*/
function addExtension(extension: string = '.js', fileExtension: string = '.ts'): Plugin {
  return {
    name: 'add-extension',
    setup(build: PluginBuild) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.importer) {
          const p = join(args.resolveDir, args.path)
          let tsPath = `${p}${fileExtension}`

          let importPath = ''
          if (existsSync(tsPath)) {
            importPath = args.path + extension
          }
          else {
            tsPath = join(args.resolveDir, args.path, `index${fileExtension}`)
            if (existsSync(tsPath)) {
              importPath = `${args.path}/index${extension}`
            }
          }
          return { path: importPath, external: true }
        }
      })
    },
  }
}

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
    plugins: [addExtension('.cjs')],

  })
}

function esmBuild(): Promise<BuildResult> {
  return build({
    ...commonOptions,
    bundle: true,
    outbase: './src',
    outdir: './dist',
    format: 'esm',
    plugins: [addExtension('.js')],
  })
}

const results = await Promise.all([esmBuild(), cjsBuild()])

stdout.write('\n')
await exca(`npx tsc ${isWatch ? '-w' : ''} --declaration --emitDeclarationOnly --module esnext --declarationDir ./dist`)
await exca(`npx tsc ${isWatch ? '-w' : ''} --declaration --emitDeclarationOnly --module commonjs --declarationDir ./dist/cjs`)
await exca(`echo '{"type": "commonjs"}' > ./dist/cjs/package.json`)
stdout.write('\n')

if (results[1].metafile) {
  await Promise.all(Object.entries(results[1].metafile.outputs).map(async (item) => {
    const { dir, name } = parse(item[0])
    await rename(join(dir, `${name}.d.ts`), join(dir, `${name}.d.cts`))
    await rename(join(dir, `${name}.js`), join(dir, `${name}.cjs`))
  }))
}

stdout.write('\nBuild completed\n')
