import { ActionFunction, json } from 'remix'
import { TextMessage } from '@line/bot-sdk'

import { lineClient } from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'
import {
  genNowDisplayNotifyTime,
  type Contact,
  queryContactsWithinActiveTreatmentPeriod,
} from '~/domain/notify-message.server'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const toNotifyContacts: Contact[] = await queryContactsWithinActiveTreatmentPeriod()

  const notifyMessageRequests = toNotifyContacts.map(async (contact) => {
    const displayNotifyTime = genNowDisplayNotifyTime()
    const message: TextMessage = {
      type: 'text',
      text: `${displayNotifyTime} ขอให้ ผู้รักษาตัว คุณ${contact.lineDisplayName} ส่งรูป วัดอุณหภูมิ และค่าออกซิเจน มาด้วยค่ะ`,
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
