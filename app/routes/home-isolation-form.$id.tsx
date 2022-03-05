import { Prisma } from '@prisma/client'
import { ActionFunction, json } from 'remix'
import { db } from '~/utils/db.server'
import { requireAdminPermission } from '~/utils/session.server'
import { isStringArray } from '~/utils/type-validator'

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
    patientIds: string | undefined
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
    patientIds: string[]
  }
}

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdminPermission(request)

  const form = await request.formData()
  const method = form.get('_method')

  switch (method) {
    case 'update': {
      return updateHomeIsolationForm(form, params.id)
    }

    case 'delete': {
      return deleteHomeIsolationForm(params.id)
    }

    default: {
      throw new Response(`The _method ${method} is not supported`, {
        status: 400,
      })
    }
  }
}

const deleteHomeIsolationForm = async (formId: string | undefined) => {
  const savedForm = await db.homeIsolationForm.findUnique({
    where: { id: formId },
  })

  if (!savedForm) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    })
  }

  await db.homeIsolationForm.delete({ where: { id: formId } })

  return json({ message: `Successfully delete ${formId}` })
}

const updateHomeIsolationForm = async (
  form: FormData,
  formId: string | undefined
) => {
  const lat = Number(form.get('lat'))
  const lng = Number(form.get('lng'))
  const admittedAt = form.get('admittedAt')
  const zone = form.get('zone')
  const address = form.get('address')
  const landmarkNote = form.get('landmarkNote')
  const phone = form.get('phone')
  const names = form.getAll('name')
  const patientIds = form.getAll('patientId')

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    typeof zone !== 'string' ||
    typeof address !== 'string' ||
    typeof landmarkNote !== 'string' ||
    typeof phone !== 'string' ||
    typeof admittedAt !== 'string' ||
    !isStringArray(names) ||
    !isStringArray(patientIds) ||
    names.length !== patientIds.length
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
    patientIds: undefined,
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
    patientIds,
  }
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields })
  }

  const savedForm = await db.homeIsolationForm.findUnique({
    include: {
      patients: true,
    },
    where: { id: formId },
  })

  if (!savedForm) {
    throw new Response("Can't update what does not exist", {
      status: 404,
    })
  }

  const submittedPatients = Array.from({ length: names.length }).map(
    (_, idx) => ({
      id: patientIds[idx],
      name: names[idx],
    })
  )

  const toDeletePatients = savedForm.patients.filter(
    (savedPatient) => !patientIds.includes(savedPatient.id)
  )

  await db.homeIsolationForm.update({
    where: {
      id: formId,
    },
    data: {
      lat: new Prisma.Decimal(lat),
      lng: new Prisma.Decimal(lng),
      admittedAt: new Date(admittedAt),
      zone,
      address,
      landmarkNote,
      phone,
      patients: {
        delete: toDeletePatients.map((item) => ({ id: item.id })),
        upsert: submittedPatients.map((patient) => ({
          where: { id: patient.id },
          update: { name: patient.name },
          create: {
            name: patient.name,
          },
        })),
      },
    },
  })

  return json({ message: `Successfully updated ${formId}.` })
}

const badRequest = (data: ActionData) => json(data, { status: 400 })
