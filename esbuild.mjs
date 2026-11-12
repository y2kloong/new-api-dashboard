import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const rootDirectory = path.dirname(fileURLToPath(import.meta.url))
const isWatchMode = process.argv.includes('--watch')
const isProductionBuild = !isWatchMode

const sharedOptions = {
  bundle: true,
  logLevel: 'info',
  sourcemap: !isProductionBuild,
  minify: isProductionBuild,
}

const extensionBuildOptions = {
  ...sharedOptions,
  entryPoints: [path.join(rootDirectory, 'src', 'extension.ts')],
  outfile: path.join(rootDirectory, 'dist', 'extension.js'),
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vscode'],
}

const webviewBuildOptions = {
  ...sharedOptions,
  entryPoints: [path.join(rootDirectory, 'webview', 'src', 'main.tsx')],
  outdir: path.join(rootDirectory, 'dist', 'webview'),
  platform: 'browser',
  format: 'iife',
  target: 'chrome100',
  jsx: 'automatic',
  jsxImportSource: 'react',
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      isProductionBuild ? 'production' : 'development'
    ),
  },
}

if (isWatchMode) {
  const extensionContext = await esbuild.context(extensionBuildOptions)
  const webviewContext = await esbuild.context(webviewBuildOptions)
  await Promise.all([extensionContext.watch(), webviewContext.watch()])
  console.log('[new-api-dashboard] watching extension and webview sources')
} else {
  await Promise.all([
    esbuild.build(extensionBuildOptions),
    esbuild.build(webviewBuildOptions),
  ])
  console.log('[new-api-dashboard] build complete')
}
