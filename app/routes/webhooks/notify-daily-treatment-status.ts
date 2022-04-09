import { ActionFunction, json } from 'remix'
import { serverError } from 'remix-utils'
import { FlexBox, FlexComponent, FlexMessage } from '@line/bot-sdk'
import { Patient } from '@prisma/client'
import { z } from 'zod'

import { db } from '~/utils/db.server'
import { lineClient } from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'
import {
  FULL_TREATMENT_DAYS,
  Treatment,
  activeTreatmentPeriod,
  calculateTreatmentDayCount,
} from '~/domain/treatment'
import {
  contactSchema,
  genNowDisplayNotifyTime,
} from '~/domain/notify-message.server'
import moment from 'moment'

const nestedContactSchema = contactSchema.extend({
  patients: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .array(),
})
type NestedContact = z.infer<typeof nestedContactSchema>

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const toNotifyContacts: NestedContact[] = await contactFetcher()

  const notifyMessageRequests = toNotifyContacts.map(async (contact) => {
    const treatment = new Treatment(contact.admittedAt)

    const message: FlexMessage = genNotifyMessage({
      treatmentDayCount: calculateTreatmentDayCount(contact.admittedAt),
      admittedDay: formatDisplayDate(contact.admittedAt),
      recoveryDay: formatDisplayDate(treatment.getRecoveryDate()),
      patients: contact.patients,
    })

    return lineClient.pushMessage(contact.lineId, message)
  })

  await Promise.allSettled(notifyMessageRequests)

  return json({})
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('th', { dateStyle: 'medium' }).format(date)
}

async function contactFetcher(): Promise<NestedContact[]> {
  const contacts = await db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
      patients: true,
    },
    where: {
      admittedAt: {
        gte: activeTreatmentPeriod.getDateSinceFirstDay(1),
        lt: activeTreatmentPeriod.getDateBeforeRecoveryDay(1),
      },
      NOT: { lineId: null },
    },
  })

  const parseResult = nestedContactSchema.array().safeParse(contacts)
  if (!parseResult.success) {
    throw serverError({
      message: 'Oops! contacts fetching is received unexpected',
      error: parseResult.error,
    })
  }

  return parseResult.data
}

const ICON_FILLED_URL =
  'https://res.cloudinary.com/domumsbbo/image/upload/v1648637724/sun__filled_rm7pys.png'
const ICON_OUTLINE_URL =
  'https://res.cloudinary.com/domumsbbo/image/upload/v1648637724/sun__shape_onsuok.png'

function genNotifyMessage({
  treatmentDayCount,
  admittedDay,
  recoveryDay,
  patients,
}: {
  treatmentDayCount: number
  admittedDay: string
  recoveryDay: string
  patients: Omit<Patient, 'formOwnerId'>[]
}): FlexMessage {
  const displayNotifyTime = genNowDisplayNotifyTime(false)

  const patientBoxes: FlexBox[] = patients.map((patient, idx) => {
    return {
      type: 'box',
      layout: 'baseline',
      contents: [
        {
          type: 'text',
          text: `${idx + 1}.`,
          size: 'sm',
          color: '#AAAAAA',
          flex: 1,
          align: 'end',
          contents: [],
        },
        {
          type: 'text',
          text: patient.name,
          size: 'sm',
          color: '#666666',
          flex: 15,
          align: 'start',
          offsetStart: '8px',
          contents: [],
        },
      ],
    }
  })

  const viz: FlexComponent[] = Array.from({ length: FULL_TREATMENT_DAYS }).map(
    (_, idx) => {
      return {
        type: 'icon',
        size: 'md',
        url: treatmentDayCount > idx ? ICON_FILLED_URL : ICON_OUTLINE_URL,
      }
    }
  )

  return {
    type: 'flex',
    altText: 'แจ้งข้อมูลการรักษาประจำ',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://res.cloudinary.com/cloudinary-marketing/image/upload/v1645810923/demo_image_2x.jpg',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
        action: {
          type: 'uri',
          label: 'Line',
          uri: 'https://linecorp.com/',
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
                text: 'แจ้งข้อมูลการรักษาประจำ',
                weight: 'bold',
                size: 'md',
                wrap: true,
                contents: [],
              },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'sm',
            margin: 'md',
            contents: [
              {
                type: 'text',
                size: 'sm',
                text: `วันที่ ${displayNotifyTime} คุณกำลังอยู่ในกระบวนการรักษาที่บ้าน`,
                wrap: true,
                contents: [],
              },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              ...viz,
              {
                type: 'text',
                text: `รักษามาแล้ว ${treatmentDayCount} วัน`,
                weight: 'regular',
                size: 'sm',
                color: '#999999',
                flex: 0,
                align: 'start',
                gravity: 'center',
                margin: 'md',
                style: 'normal',
                contents: [],
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'เข้าระบบ',
                    size: 'sm',
                    color: '#AAAAAA',
                    flex: 2,
                    contents: [],
                  },
                  {
                    type: 'text',
                    text: `วันที่ ${admittedDay}`,
                    size: 'sm',
                    color: '#666666',
                    flex: 5,
                    wrap: true,
                    contents: [],
                  },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'ครบกักตัว',
                    size: 'sm',
                    color: '#AAAAAA',
                    flex: 2,
                    contents: [],
                  },
                  {
                    type: 'text',
                    text: `วันที่ ${recoveryDay}`,
                    size: 'sm',
                    color: '#666666',
                    flex: 5,
                    wrap: true,
                    contents: [],
                  },
                ],
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: 'รายชื่อผู้ป่วย',
                color: '#666666',
                align: 'start',
                decoration: 'underline',
                contents: [],
              },
              ...patientBoxes,
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        flex: 0,
        spacing: 'sm',
        contents: [
          {
            type: 'spacer',
            size: 'sm',
          },
        ],
      },
    },
  }
}
