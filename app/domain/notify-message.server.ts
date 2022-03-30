import moment from 'moment'
import { z } from 'zod'

moment.locale('th')

export const contactSchema = z.object({
  admittedAt: z.date(),
  lineId: z.string(),
  lineDisplayName: z.string().nullable(),
})

export type Contact = z.infer<typeof contactSchema>
export type ContactsFetcher = () => Promise<Contact[]>

export function genNowDisplayNotifyTime(isRounded = true) {
  let time = moment()
  isRounded && time.startOf('hour')

  return `${time.format('lll')} น.`
}
