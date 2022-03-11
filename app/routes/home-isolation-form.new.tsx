import { Prisma } from '@prisma/client'
import { type ActionFunction, json, redirect } from 'remix'
import { calculateTreatmentDayCount } from '~/domain/treatment'
import { db } from '~/utils/db.server'
import { isStringArray } from '../utils/type-validator'

type ActionData = {
  formError?: string
  fieldErrors?: {
    lineId: string | undefined
    lineDisplayName: string | undefined
    linePictureUrl: string | undefined
    lat: string | undefined
    lng: string | undefined
    admittedAt: string | undefined
    zone: string | undefined
    address: string | undefined
    landmarkNote: string | undefined
    phone: string | undefined
    names: string | undefined
  }
  fields?: {
    lineId: string
    lineDisplayName: string
    linePictureUrl: string
    lat: number
    lng: number
    admittedAt: string
    zone: string
    address: string
    landmarkNote: string
    phone: string
    names: string[]
  }
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData()

  const lineId = form.get('lineId')
  const lineDisplayName = form.get('lineDisplayName')
  const linePictureUrl = form.get('linePictureUrl')
  const lat = Number(form.get('lat'))
  const lng = Number(form.get('lng'))
  const admittedAt = form.get('admittedAt')
  const zone = form.get('zone')
  const address = form.get('address')
  const landmarkNote = form.get('landmarkNote')
  const phone = form.get('phone')
  const names = form.getAll('name')

  if (
    typeof lineId !== 'string' ||
    typeof lineDisplayName !== 'string' ||
    typeof linePictureUrl !== 'string' ||
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    typeof zone !== 'string' ||
    typeof address !== 'string' ||
    typeof landmarkNote !== 'string' ||
    typeof phone !== 'string' ||
    typeof admittedAt !== 'string' ||
    !isStringArray(names)
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    })
  }

  // TODO: validate fields
  const fieldErrors = {
    lineId: undefined,
    lineDisplayName: undefined,
    linePictureUrl: undefined,
    lat: undefined,
    lng: undefined,
    admittedAt: undefined,
    zone: undefined,
    address: undefined,
    landmarkNote: undefined,
    phone: undefined,
    names: undefined,
  }
  const fields = {
    lineId,
    lineDisplayName,
    linePictureUrl,
    lat,
    lng,
    admittedAt,
    zone,
    address,
    landmarkNote,
    phone,
    names,
  }
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  const admittedAtDate = new Date(admittedAt)
  await db.homeIsolationForm.create({
    data: {
      lineId,
      lineDisplayName,
      linePictureUrl,
      lat: new Prisma.Decimal(lat),
      lng: new Prisma.Decimal(lng),
      admittedAt: admittedAtDate,
      treatmentDayCount: calculateTreatmentDayCount(admittedAtDate),
      zone,
      address,
      landmarkNote: !!landmarkNote ? landmarkNote : null,
      phone,
      patients: {
        create: names.map((name) => ({ name })),
      },
    },
  })

  return redirect(`/form-response`)
}

const badRequest = (data: ActionData) => json(data, { status: 400 })
