// @ts-nocheck
const packageJson = require('../package.json')
const child_process = require('child_process')
const fs = require('fs')
const path = require('path')
const { createLogger } = require('./logger')

const logger = createLogger('Dist.')
const outputDir = './dist/vsix'
const filename = packageJson.name + '-' + packageJson.version + '.vsix'
const filePath = path.join(outputDir, filename)

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    logger.log('Output folder created successfully!')
}

const package = () => {
    logger.log("Start packaging.")
    child_process.execSync(`vsce package -o ${filePath}`)
    logger.log("Packaging complete!")
}

const install = () => {
    package()
    logger.log("Start Installation.")
    child_process.execSync(`code --install-extension ${filePath}`)
    logger.log('Installation successfully!')
}

const uninstall = () => {
    logger.log('Start uninstalling extension.')
    ext_id = `${packageJson.publisher}.${packageJson.name}`
    child_process.execSync(`code --uninstall-extension ${ext_id}`)
    logger.log('Extension uninstalled!')
}

module.exports = Object.freeze({ package, install, uninstall })

