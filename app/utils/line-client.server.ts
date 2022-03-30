import {
  ClientConfig,
  Client,
  HTTPError,
  SignatureValidationFailed,
  JSONParseError,
  RequestError,
  ReadError,
} from '@line/bot-sdk'
import { json } from 'remix'
import { badRequest } from 'remix-utils'

const channelAccessToken = process.env.CHANEL_ACCESS_TOKEN
const channelSecret = process.env.CHANEL_SECRET

if (
  typeof channelAccessToken !== 'string' ||
  typeof channelSecret !== 'string'
) {
  throw new Error('CHANEL_ACCESS_TOKEN and CHANEL_SECRET must be set!')
}

const config: ClientConfig = {
  channelAccessToken,
  channelSecret,
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

export { lineClient, errorHandler }
