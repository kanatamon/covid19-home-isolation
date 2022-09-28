import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import type { ReplyableEvent, ImageEventMessage, TextMessage } from '@line/bot-sdk'

import { errorHandler, lineClient } from '~/utils/line-client.server'
import { badRequest } from 'remix-utils'
import { genNowDisplayNotifyTime } from '~/domain/notify-message.server'

type InterestedEvent = ReplyableEvent & {
  message?: ImageEventMessage & { imageSet?: { index: number; total: number } }
}

/**
 * @deprecated Due to cost-limitation, auto reply for health checking is needed
 * a vision service, such as Google Cloud Vision, to label any given image.
 */
export const action: ActionFunction = async ({ request }) => {
  const payload = await request.json()
  const events: InterestedEvent[] = payload?.events ?? []
  const event = events.length > 0 ? events[events.length - 1] : undefined

  if (!event || event?.message?.type !== 'image' || typeof event.replyToken !== 'string') {
    return badRequest({ message: 'Unexpected payload' })
  }

  const isImageSet = typeof event.message?.imageSet !== 'undefined'
  const imageIndex = event.message?.imageSet?.index
  const imageSetTotal = event.message?.imageSet?.total ?? Number.POSITIVE_INFINITY

  if (isImageSet && imageIndex !== imageSetTotal - 1) {
    return json({})
  }

  const displayTime = genNowDisplayNotifyTime(false)
  const replyMessage: TextMessage = {
    type: 'text',
    text: `${displayTime} ท่านได้ส่งข้อมูล วัดอุณหภูมิ และ ค่าออกซิเจน เรียบร้อยแล้วค่ะ`,
  }
  await lineClient.replyMessage(event.replyToken, replyMessage).catch(errorHandler)

  return json({})
}
