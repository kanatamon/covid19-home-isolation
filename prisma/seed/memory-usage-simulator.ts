import { PrismaClient } from '@prisma/client'
import { buildHomeIsolationForm, buildPatient } from '../utils'

const db = new PrismaClient()

async function seed() {
  for (let i = 0; i < 1200; i++) {
    await createHomeIsolationFormWithPatients()
  }
}

export function createHomeIsolationFormWithPatients() {
  return db.homeIsolationForm.create({
    data: {
      ...buildHomeIsolationForm({
        unselect: {
          id: true,
          admittedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      patients: {
        create: Array(Math.ceil(Math.random() * 2))
          .fill(null)
          .map(() => buildPatient({ unselect: { id: true } })),
      },
    },
  })
}

seed()
