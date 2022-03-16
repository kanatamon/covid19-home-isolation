import { ClientConfig, Client } from '@line/bot-sdk'

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

export { lineClient }
