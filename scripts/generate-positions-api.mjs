import path from 'node:path'
import process from 'node:process'

import * as dotenv from 'dotenv'
import { generateApi } from 'swagger-typescript-api'

dotenv.config({
  path: ['.env', '.env.local'],
})

const POSITIONS_API_URL =
  process.env.POSITIONS_API_URL ||
  process.env.REACT_APP_POSITIONS_API_URL ||
  'https://swap-positions.platform-dev.gateway.fm/api/v1'

const SPECS_URL = `${POSITIONS_API_URL.replace('/api/v1', '')}/swagger.json`

console.log(`Generating Positions API types from: ${SPECS_URL}`)

generateApi({
  fileName: 'PositionsApi.ts',
  url: SPECS_URL,
  output: path.resolve(process.cwd(), './src/api'),
  httpClientType: 'axios',
  generateClient: true,
  generateResponses: true,
  extractRequestParams: true,
  extractRequestBody: true,
  extractEnums: true,
})
  .then(() => {
    console.log('✅ Positions API types generated successfully!')
  })
  .catch((error) => {
    console.error('❌ Failed to generate Positions API types:', error)
    process.exit(1)
  })
