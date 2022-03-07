import type { ActionFunction } from 'remix'
import { json } from 'remix'

import { db } from '~/utils/db.server'
import {
  calculateTreatmentDayCount,
  getFirstDayOfActiveTreatmentPeriod,
} from '~/domain/treatment'
import { requireWebhookSignature } from '~/utils/webhook.server'

export const action: ActionFunction = async ({ request }) => {
  await requireWebhookSignature(request)

  const interestedForms = await db.homeIsolationForm.findMany({
    select: {
      id: true,
      admittedAt: true,
      treatmentDayCount: true,
    },
    where: {
      admittedAt: {
        gte: getFirstDayOfActiveTreatmentPeriod(),
      },
    },
  })

  const toUpdateForms = interestedForms
    .map((form) => {
      const newTreatmentDayCount = calculateTreatmentDayCount(form.admittedAt)
      const willUpdate = newTreatmentDayCount !== form.treatmentDayCount

      return willUpdate ? { id: form.id, newTreatmentDayCount } : undefined
    })
    .filter(Boolean)

  // TODO: handle on failure
  for await (const toUpdateForm of toUpdateForms) {
    if (!toUpdateForm) {
      throw new Error(`toUpdateForm should NOT be undefined.`)
    }

    await db.homeIsolationForm.update({
      data: {
        treatmentDayCount: toUpdateForm.newTreatmentDayCount,
      },
      where: {
        id: toUpdateForm.id,
      },
    })
  }

  return json({ success: true }, 200)
}
