import { PrismaClient } from '@prisma/client'
import { createContact } from '../utils'

export const db = new PrismaClient()

async function seed() {
  for (let i = 0; i < 1200; i++) {
    await createContact()
  }
}

seed()
