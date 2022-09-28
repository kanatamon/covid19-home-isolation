import type { ClientConfig } from '@line/bot-sdk'
import {
  Client,
  HTTPError,
  SignatureValidationFailed,
  JSONParseError,
  RequestError,
  ReadError,
} from '@line/bot-sdk'
import { json } from '@remix-run/node'
import { badRequest } from 'remix-utils'

const CHANNEL_ACCESS_TOKEN = process.env.CHANEL_ACCESS_TOKEN
const CHANNEL_SECRET = process.env.CHANEL_SECRET
const LIFF_ID = process.env.LIFF_ID

if (
  typeof CHANNEL_ACCESS_TOKEN !== 'string' ||
  typeof CHANNEL_SECRET !== 'string' ||
  typeof LIFF_ID !== 'string'
) {
  throw new Error('LIFF_ID, CHANEL_ACCESS_TOKEN, and CHANEL_SECRET must be set!')
}

const config: ClientConfig = {
  channelAccessToken: CHANNEL_ACCESS_TOKEN,
  channelSecret: CHANNEL_SECRET,
}

const lineClient = new Client(config)

function errorHandler(error: unknown) {
  // TODO: Store variant error on logging system instead
  if (error instanceof HTTPError) {
    const { statusCode, originalError } = error
    throw json(originalError.response.data, statusCode)
  }

  if (error instanceof SignatureValidationFailed) {
    // TODO: implementation
  }

  if (error instanceof JSONParseError) {
    // TODO: implementation
  }

  if (error instanceof RequestError) {
    // TODO: implementation
  }

  if (error instanceof ReadError) {
    // TODO: implementation
  }

  throw badRequest({ message: 'Messaging API Error' })
}

const LIFF_URL = `https://liff.line.me/${LIFF_ID}`
const VISIT_CONTACT_LOCATION_LIFF_URL = `${LIFF_URL}?visitTo=%2Fcontact%2Flocation`

export { lineClient, errorHandler, VISIT_CONTACT_LOCATION_LIFF_URL }
