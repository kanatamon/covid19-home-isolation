import { ActionFunction, json } from 'remix'
import { badRequest } from 'remix-utils'
import { TextMessage } from '@line/bot-sdk'

import { db } from '~/utils/db.server'
import { activeTreatmentPeriod, Treatment } from '~/domain/treatment'
import { lineClient } from '~/utils/line-client.server'
import { requireWebhookSignature } from '~/utils/webhook.server'

type Contact = {
  admittedAt: Date
  lineId: string | null
  lineDisplayName: string | null
}
type ContactsFetcher = () => Promise<Contact[]>
type NotifyType = 'END_TREATMENT' | 'PREPARE_TO_END_TREATMENT'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const contactFetcher: ContactsFetcher = selectContactsFetcher(request)
  const toNotifyContacts = await contactFetcher()

  // TODO: Should add retry request?
  const notifyMessageRequests = toNotifyContacts.map(notifyContact)
  await Promise.allSettled(notifyMessageRequests)

  return json({})
}

function selectContactsFetcher(request: Request): ContactsFetcher {
  const searchParams = new URL(request.url).searchParams
  const notifyType = searchParams.get('notifyType')
  if (typeof notifyType !== 'string') {
    throw badRequest({ message: "Missing 'notifyType' in params." })
  }

  switch (notifyType as NotifyType) {
    case 'END_TREATMENT': {
      return endOfTreatmentDateFetcher
    }
    case 'PREPARE_TO_END_TREATMENT': {
      return dayBeforeEndOfTreatmentDateFetcher
    }
    default: {
      throw badRequest({
        message: `Invalid 'notifyType', must be either 'END_TREATMENT' or 'PREPARE_TO_END_TREATMENT'.`,
      })
    }
  }
}

const endOfTreatmentDateFetcher: ContactsFetcher = () => {
  return db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
    },
    where: {
      admittedAt: {
        gte: activeTreatmentPeriod.getFirstDate(),
        lt: activeTreatmentPeriod.getDateSinceFirstDay(1),
      },
      NOT: { lineId: null },
    },
  })
}

const dayBeforeEndOfTreatmentDateFetcher: ContactsFetcher = () => {
  return db.homeIsolationForm.findMany({
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
  certAvailableDay,
  lastServiceDay,
}: {
  displayName: string | null
  admittedDay: string
  recoveryDay: string
  certAvailableDay: string
  lastServiceDay: string
}): TextMessage {
  const displayNameOrNothing = displayName ? ` คุณ${displayName} ` : ''

  return {
    type: 'text',
    text: [
      `❇️ แจ้งคนไข้${displayNameOrNothing}ครบกักตัวระบบดูแลที่บ้าน HI รพค่ายเทพสตรี`,
      `✅ เข้าระบบ วันที่ ${admittedDay}`,
      `✅ ครบกักตัววันที่ ${recoveryDay}`,
      'สามารถใช้ชีวิตตามปกติภายใต้มาตรการ ระบบวิถีชีวิตใหม่  ใส่หน้ากากอนามัย ล้างมือ เว้นระยะห่าง',
      `✳️ คนไข้สามารถมารับ ใบรับแพทย์ พร้อมผลตรวจโควิดในวันที่ ${certAvailableDay} ณ ห้องศูนย์ประสานงานระบบดูแลที่บ้านHI`,
      'รพ ค่ายเทพสตรีศรีสุนทร',
      'เวลา 09.00น-15.00น ',
      `✴️ อาหารผู้ป่วยจะได้รับถึงมื้อเย็นวันที่ ${lastServiceDay}`,
    ].join('\n'),
  }
}
