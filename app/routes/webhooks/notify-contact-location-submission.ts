import type { FlexMessage } from '@line/bot-sdk'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { serverError } from 'remix-utils'
import type { ContactsQueryFn } from '~/domain/notify-message.server'
import { contactSchema } from '~/domain/notify-message.server'

import { db } from '~/utils/db.server'
import {
  errorHandler,
  lineClient,
  VISIT_CONTACT_LOCATION_LIFF_URL,
} from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const toNotifyContacts = await queryContactsWhoNeverSubmittedLocation()
  const to = toNotifyContacts.map((contact) => contact.lineId as string)
  if (to.length > 0) {
    await lineClient.multicast(to, [notifyMessage]).catch(errorHandler)
  }

  return json({})
}

export const queryContactsWhoNeverSubmittedLocation: ContactsQueryFn = async () => {
  const contacts = await db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
    },
    where: {
      lat: null,
      lng: null,
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

const notifyMessage: FlexMessage = {
  type: 'flex',
  altText: 'ขอความร่วมมือลงทะเบียนตำแหน่งที่พักอาศัย',
  contents: {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'horizontal',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'icon',
              size: '3xl',
              url: 'https://via.placeholder.com/500',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          flex: 5,
          contents: [
            {
              type: 'text',
              text: 'โรงพยาบาลค่ายเทพสตรีฯ ขอความร่วมมือลงทะเบียนตำแหน่งที่พักอาศัย',
              weight: 'bold',
              color: '#aaaaaa',
              size: 'md',
              gravity: 'top',
              wrap: true,
            },
          ],
        },
      ],
    },
    hero: {
      type: 'image',
      url: 'https://res.cloudinary.com/domumsbbo/image/upload/v1648638420/henry-perks-BJXAxQ1L7dI-unsplash_oscsk8.jpg',
      size: 'full',
      aspectRatio: '16:9',
      aspectMode: 'cover',
      action: {
        label: 'ลงทะเบียนตำแหน่งที่พักอาศัย',
        type: 'uri',
        uri: VISIT_CONTACT_LOCATION_LIFF_URL,
      },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
              flex: 6,
              wrap: true,
              size: 'sm',
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'link',
          color: '#FFFFFF',
          height: 'sm',
          action: {
            type: 'uri',
            label: 'ลงทะเบียนตำแหน่งที่พักอาศัย',
            uri: VISIT_CONTACT_LOCATION_LIFF_URL,
          },
        },
      ],
    },
    action: {
      type: 'uri',
      label: 'action',
      uri: VISIT_CONTACT_LOCATION_LIFF_URL,
    },
    styles: {
      footer: {
        backgroundColor: '#7D9575',
      },
    },
  },
}
