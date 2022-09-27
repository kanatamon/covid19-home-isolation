import { ActionFunction, json } from 'remix'
import { badRequest, serverError } from 'remix-utils'
import { TextMessage } from '@line/bot-sdk'

import { db } from '~/utils/db.server'
import { activeTreatmentPeriod, Treatment } from '~/domain/treatment'
import { lineClient } from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'
import { ContactsQueryFn, Contact, contactSchema } from '~/domain/notify-message.server'

type NotifyType = 'END_TREATMENT' | 'PREPARE_TO_END_TREATMENT'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const contactFetcher = selectContactsQueryFn(request)
  const toNotifyContacts = await contactFetcher()

  // TODO: Should add retry request?
  const notifyMessageRequests = toNotifyContacts.map(notifyContact)
  await Promise.allSettled(notifyMessageRequests)

  return json({})
}

function selectContactsQueryFn(request: Request): ContactsQueryFn {
  const searchParams = new URL(request.url).searchParams
  const notifyType = searchParams.get('notifyType')
  if (typeof notifyType !== 'string') {
    throw badRequest({ message: "Missing 'notifyType' in params." })
  }

  switch (notifyType as NotifyType) {
    case 'END_TREATMENT': {
      return queryContactsWhoGetRecoveryByToday
    }
    case 'PREPARE_TO_END_TREATMENT': {
      return queryContactsWhoGonnaGetRecoveryByTomorrow
    }
    default: {
      throw badRequest({
        message: `Invalid 'notifyType', must be either 'END_TREATMENT' or 'PREPARE_TO_END_TREATMENT'.`,
      })
    }
  }
}

export const queryContactsWhoGetRecoveryByToday: ContactsQueryFn = async () => {
  const contacts = await db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
    },
    where: {
      admittedAt: {
        gte: activeTreatmentPeriod.getDateSinceFirstDay(),
        lt: activeTreatmentPeriod.getDateSinceFirstDay(1),
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

export const queryContactsWhoGonnaGetRecoveryByTomorrow: ContactsQueryFn = async () => {
  const contacts = await db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
    },
    where: {
      admittedAt: {
        gte: activeTreatmentPeriod.getDateSinceFirstDay(1),
        lt: activeTreatmentPeriod.getDateSinceFirstDay(2),
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

async function notifyContact(contact: Contact) {
  if (typeof contact.lineId !== 'string') {
    return
  }

  const treatment = new Treatment(contact.admittedAt)

  const notifyMessage = generateNotifyMessage({
    displayName: contact.lineDisplayName,
    admittedDay: formatDisplayDate(contact.admittedAt),
    recoveryDay: formatDisplayDate(treatment.getRecoveryDate()),
    endHomeIsolationDay: formatDisplayDate(treatment.getEndHomeIsolationDate()),
    certAvailableDay: formatDisplayDate(treatment.getCertAvailableDate()),
    lastServiceDay: formatDisplayDate(treatment.getLastServiceDate()),
  })

  return lineClient.pushMessage(contact.lineId, notifyMessage)
}

function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('th', { dateStyle: 'medium' }).format(date)
}

function generateNotifyMessage({
  displayName,
  admittedDay,
  recoveryDay,
  endHomeIsolationDay,
  certAvailableDay,
  lastServiceDay,
}: {
  displayName: string | null
  admittedDay: string
  recoveryDay: string
  endHomeIsolationDay: string
  certAvailableDay: string
  lastServiceDay: string
}): TextMessage {
  const displayNameOrNothing = displayName ? `คุณ${displayName}` : ''

  return {
    type: 'text',
    text: [
      `❇️ แจ้งผู้ป่วย ${displayNameOrNothing} กักตัวระบบ HI รพค่ายเทพสตรีศรีสุนทร`,
      `✅ ท่านได้เข้าระบบการดูแล ในวันที่ ${admittedDay}`,
      `✅ ครบการดูแลติดตามอาการจากรพ. ในวันที่ ${recoveryDay}`,
      `❇️❇️   ครบการกักตัว 10 วัน`,
      `            ในวันที่ ${endHomeIsolationDay} และ`,
      `สามารถใช้ชีวิตตามปกติภายใต้มาตรการ ระบบวิถีชีวิตใหม่  ใส่หน้ากากอนามัย ล้างมือ เว้นระยะห่าง`,
      `- รับ ใบรับรองแพทย์ พร้อมผลตรวจ ตั้งแต่วันที่ ${certAvailableDay} ณ ห้องศูนย์HI ตึกผู้ป่วยใน รพ ค่ายเทพสตรีศรีสุนทร เวลา 09.00น-15.00น`,
      `✴️ อาหารจะได้รับตั้งแต่มื้อเย็นวันที่ ${admittedDay} ถึง มื้อเย็น ${lastServiceDay}`,
      `✅ ขอประวัติการรับวัคซีนโควิด`,
      `เข็มที่ 1 เข็มที่ 2 เข็มที่ 3 ด้วยคะ`,
    ].join('\n'),
  }
}
