import { ActionFunction, json } from "@remix-run/node";
import { TextMessage } from '@line/bot-sdk'

import { lineClient } from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'
import {
  Contact,
  genNowDisplayNotifyTime,
  queryContactsWithinActiveTreatmentPeriod,
} from '~/domain/notify-message.server'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const toNotifyContacts: Contact[] = await queryContactsWithinActiveTreatmentPeriod()

  const notifyMessageRequests = toNotifyContacts.map(async (contact) => {
    const displayNotifyTime = genNowDisplayNotifyTime()
    const message: TextMessage = {
      type: 'text',
      text: `${displayNotifyTime} ขอให้ ผู้รักษาตัว คุณ${contact.lineDisplayName} ส่งรูป อาหารกลางวัน มาด้วยนะคะ`,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'cameraRoll',
              label: 'ส่งรูป',
            },
          },
        ],
      },
    }

    return lineClient.pushMessage(contact.lineId, message)
  })

  await Promise.allSettled(notifyMessageRequests)

  return json({})
}
