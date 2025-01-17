import { mkdirSync, copyFileSync, readdirSync, lstatSync, existsSync } from 'fs'
import { dirname, join, sep } from 'path'

const findFilesOnLevel = async (base: string) => {
  const files: string[] = []
  const filesInFolder = readdirSync(base)
  for (const file of filesInFolder) {
    const path = `${base}/${file}`
    const isDirectory = lstatSync(path).isDirectory()
    if (isDirectory) {
      files.push(...(await findFilesOnLevel(path)))
    } else if ((file as any).endsWith('json') || (file as any).endsWith('js')) {
      files.push(path)
      const fileSeparator = sep == '\\' ? '/' : '/'
      dirname(path)
        .split(fileSeparator)
        .reduce((prevPath, folder) => {
          const currentPath = join(prevPath, folder, fileSeparator)
          if (currentPath === 'src/') {
            return 'dist/'
          }
          // const distFolder = 'dist/' + currentPath.substring(4);
          // if (!existsSync(distFolder)) {

          //   mkdirSync(distFolder)
          // }
          if (!existsSync(currentPath)) {
            mkdirSync(currentPath)
          }

          return currentPath
        }, '')

      const outDir = dirname(path.replace('./src', './dist'))
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true })
      }
      console.log('Copying file', path.replace('./src', './dist'))
      copyFileSync(path, path.replace('./src', './dist'))
    }
  }
  return files
}

findFilesOnLevel('./src/dependencies/src')
  .then(() => {})
  .catch(console.error)
findFilesOnLevel('./src/serializer/schemas')
  .then(() => {})
  .catch(console.error)
findFilesOnLevel('./src/serializer-v3/schemas')
  .then(() => {})
  .catch(console.error)

copyFileSync('./package.json', './dist/package.json')
copyFileSync('./readme.md', './dist/readme.md')
