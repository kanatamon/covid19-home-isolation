import moment from 'moment'
import { z } from 'zod'
import { serverError } from 'remix-utils'

import { activeTreatmentPeriod } from '~/domain/treatment'
import { db } from '~/utils/db.server'

moment.locale('th')

export const contactSchema = z.object({
  admittedAt: z.date(),
  lineId: z.string(),
  lineDisplayName: z.string().nullable(),
  patients: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .array()
    .optional(),
})

export type Contact = z.infer<typeof contactSchema>

type ContactsQueryOptions = {
  includedPatients: boolean
}

export type ContactsQueryFn = (options?: ContactsQueryOptions) => Promise<Contact[]>

export function genNowDisplayNotifyTime(isRounded = true) {
  let time = moment()
  isRounded && time.startOf('hour')

  return `${time.format('lll')} น.`
}

export const queryContactsWithinActiveTreatmentPeriod: ContactsQueryFn = async (
  options = {
    includedPatients: false,
  },
) => {
  const contacts = await db.homeIsolationForm.findMany({
    select: {
      lineId: true,
      lineDisplayName: true,
      admittedAt: true,
      patients: options?.includedPatients ?? false,
    },
    where: {
      admittedAt: {
        gte: activeTreatmentPeriod.getDateSinceFirstDay(1),
        lt: activeTreatmentPeriod.getDateBeforeRecoveryDay(1),
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
