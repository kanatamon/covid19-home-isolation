import { Prisma } from '@prisma/client'
import { type ActionFunction, json, redirect } from 'remix'
import { db } from '~/utils/db.server'
import { isStringArray } from '../utils/type-validator'

type ActionData = {
  formError?: string
  fieldErrors?: {
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

  const lat = Number(form.get('lat'))
  const lng = Number(form.get('lng'))
  const admittedAt = form.get('admittedAt')
  const zone = form.get('zone')
  const address = form.get('address')
  const landmarkNote = form.get('landmarkNote')
  const phone = form.get('phone')
  const names = form.getAll('name')

  if (
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

  await db.homeIsolationForm.create({
    data: {
      lat: new Prisma.Decimal(lat),
      lng: new Prisma.Decimal(lng),
      admittedAt: new Date(admittedAt),
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
