import path from 'node:path'
import process from 'node:process'

import * as dotenv from 'dotenv'
import { generateApi } from 'swagger-typescript-api'

dotenv.config({
  path: ['.env', '.env.local'],
})

const API_URL = process.env.API_URL || process.env.REACT_APP_API_URL

if (!API_URL) {
  throw new Error('API URL must be specified')
}

const SPECS_URL = `${API_URL}/swagger.json`

generateApi({
  fileName: 'Api.ts',
  url: SPECS_URL,
  output: path.resolve(process.cwd(), './src/api'),
  httpClientType: 'axios',
  generateClient: true,
  generateResponses: true,
})
