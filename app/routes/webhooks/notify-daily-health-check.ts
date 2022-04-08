import { ActionFunction, json } from 'remix'
import { serverError } from 'remix-utils'
import { TextMessage } from '@line/bot-sdk'

import { db } from '~/utils/db.server'
import { activeTreatmentPeriod } from '~/domain/treatment'
import { lineClient } from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'
import {
  contactSchema,
  Contact,
  ContactsFetcher,
  genNowDisplayNotifyTime,
} from '~/domain/notify-message.server'
import moment from 'moment'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const toNotifyContacts: Contact[] = await contactFetcher()

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

const contactFetcher: ContactsFetcher = async () => {
  const contacts = await db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
    },
    where: {
      admittedAt: {
        gte: activeTreatmentPeriod.getDateSinceFirstDay(2),
        lt: moment().startOf('day').toDate(),
      },
      NOT: { lineId: null },
    },
  })

  const parseResult = contactSchema.array().safeParse(contacts)
  if (!parseResult.success) {
    throw serverError({
      message: 'Oops! contacts fetching is received unexpected',
      error: parseResult.error,
    })
  }

  return parseResult.data
}
