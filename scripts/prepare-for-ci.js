const fs = require('fs')
const path = require('path')

const isCI = process.env.CI === 'true' || process.env.VERCEL === '1'

if (isCI) {
  console.log('Preparing for CI/CD environment...')

  // Create .babelrc to force babel usage instead of SWC
  const babelrcPath = path.join(process.cwd(), '.babelrc')
  const babelConfig = {
    "presets": [
      ["@babel/preset-env", { "targets": "> 0.5%, not dead" }],
      ["@babel/preset-react", { "runtime": "automatic" }],
      "@babel/preset-typescript"
    ],
    "plugins": [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-transform-runtime",
      "macros"
    ]
  }
  
  fs.writeFileSync(babelrcPath, JSON.stringify(babelConfig, null, 2))
  console.log('Created .babelrc for CI/CD - SWC will be disabled')
} else {
  console.log('Local development detected, keeping SWC configuration')
}
