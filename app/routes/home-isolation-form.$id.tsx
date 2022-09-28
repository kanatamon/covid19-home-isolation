import type { HomeIsolationForm, Patient } from '@prisma/client'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { badRequest, notFound } from 'remix-utils'
import { validationError } from 'remix-validated-form'

import {
  HomeIsolationFormEditor,
  homeIsolationFormValidator,
  parseToHomeIsolationFormValues,
  useHomeIsolationFormValues,
} from '~/components/home-isolation-form-editor'
import { calculateTreatmentDayCount } from '~/domain/treatment'
import { db } from '~/utils/db.server'
import { requireAdminPermission } from '~/utils/session.server'

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
      throw badRequest(`The _method ${method} is not supported`)
    }
  }
}

type LoaderData = {
  homeIsolationForm: HomeIsolationForm & { patients: Patient[] }
}

export const loader: LoaderFunction = async ({ request, params }) => {
  // TODO: require user's session

  const homeIsolationForm = await db.homeIsolationForm.findUnique({
    where: { id: params.id },
    include: {
      patients: true,
    },
  })
  if (!homeIsolationForm) {
    throw notFound("Can't find what does not exist")
  }

  return json<LoaderData>({ homeIsolationForm })
}

export default function HomeIsolationFormRoute() {
  const data = useLoaderData<LoaderData>()
  const homeIsolationFormValues = parseToHomeIsolationFormValues(data.homeIsolationForm)
  const methods = useHomeIsolationFormValues({
    defaultValues: homeIsolationFormValues,
  })

  return (
    <div style={{ padding: '12px 16px' }}>
      <HomeIsolationFormEditor methods={methods} />
    </div>
  )
}

const deleteHomeIsolationForm = async (formId: string | undefined) => {
  const savedForm = await db.homeIsolationForm.findUnique({
    where: { id: formId },
  })

  if (!savedForm) {
    throw notFound("Can't delete what does not exist")
  }

  await db.homeIsolationForm.delete({ where: { id: formId } })
  return json({}, 200)
}

const updateHomeIsolationForm = async (form: FormData, formId: string | undefined) => {
  const result = await homeIsolationFormValidator.validate(form)
  if (result.error) {
    return validationError(result.error)
  }

  const savedForm = await db.homeIsolationForm.findUnique({
    include: {
      patients: true,
    },
    where: { id: formId },
  })

  if (!savedForm) {
    throw notFound("Can't update what does not exist")
  }

  const { patients: submittingPatients, ...submittingHomeIsolationForm } = result.data

  const submittingPatientIds = submittingPatients.map((patient) => patient.id)
  const toDeletePatients = savedForm.patients.filter(
    (savedPatient) => !submittingPatientIds.includes(savedPatient.id),
  )

  await db.homeIsolationForm.update({
    where: { id: formId },
    data: {
      ...submittingHomeIsolationForm,
      treatmentDayCount: calculateTreatmentDayCount(submittingHomeIsolationForm.admittedAt),
      patients: {
        delete: toDeletePatients.map((item) => ({ id: item.id })),
        upsert: submittingPatients.map((patient) => ({
          where: { id: patient.id },
          update: { name: patient.name },
          create: {
            name: patient.name,
          },
        })),
      },
    },
  })

  return json({}, 200)
}
