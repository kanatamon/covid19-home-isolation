import { type ActionFunction, json } from 'remix'
import { validationError } from 'remix-validated-form'

import { db } from '~/utils/db.server'
import { calculateTreatmentDayCount } from '~/domain/treatment'
import { homeIsolationFormValidator } from '~/components/home-isolation-form-editor'

export const action: ActionFunction = async ({ request }) => {
  const result = await homeIsolationFormValidator.validate(
    await request.formData()
  )
  if (result.error) return validationError(result.error)

  const { data } = result

  await db.homeIsolationForm.create({
    data: {
      lineId: data.lineId,
      lineDisplayName: data.lineDisplayName,
      linePictureUrl: data.linePictureUrl,
      admittedAt: data.admittedAt,
      treatmentDayCount: calculateTreatmentDayCount(data.admittedAt),
      zone: data.zone,
      address: data.address,
      landmarkNote: data.landmarkNote,
      phone: data.phone,
      patients: {
        create: data.patients.map(({ name }) => ({ name })),
      },
    },
  })

  return json({}, 201)
}
