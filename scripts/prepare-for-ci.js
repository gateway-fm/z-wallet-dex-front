const fs = require('fs')
const path = require('path')

const isCI = process.env.CI === 'true' || process.env.VERCEL === '1'

if (isCI) {
  console.log('Preparing for CI/CD environment...')

  const swcrcPath = path.join(process.cwd(), '.swcrc')
  const backupPath = path.join(process.cwd(), '.swcrc.backup')

  // Backup original .swcrc
  if (fs.existsSync(swcrcPath)) {
    fs.copyFileSync(swcrcPath, backupPath)
    console.log('Original .swcrc backed up as .swcrc.backup')
  }

  // Remove .swcrc completely to force craco to use babel instead
  if (fs.existsSync(swcrcPath)) {
    fs.unlinkSync(swcrcPath)
    console.log('Removed .swcrc - will use babel for CI/CD')
  }
} else {
  console.log('Local development detected, keeping original .swcrc')
}
