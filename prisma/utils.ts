import type { HomeIsolationForm, Patient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime'
import faker from '@faker-js/faker'

type Unselect<T extends {}> = {
  [K in keyof T]?: true
}

type BuildFn<T extends {}> = <U extends Unselect<T> = {}>(options?: {
  override?: Partial<T>
  unselect?: U
}) => Omit<T, keyof U>

type PatientOnly = Omit<Patient, 'formOwnerId'>

const WITHIN_15_DAYS = 15

export const buildHomeIsolationForm: BuildFn<HomeIsolationForm> = (options) => {
  const aDate = faker.date.recent(WITHIN_15_DAYS)
  const data = {
    id: faker.datatype.uuid(),
    createdAt: aDate,
    updatedAt: aDate,
    admittedAt: aDate,
    treatmentDayCount: 10,
    lat: new Decimal(faker.address.latitude()),
    lng: new Decimal(faker.address.longitude()),
    zone: faker.address.cityName(),
    address: faker.address.streetAddress(true),
    landmarkNote: faker.lorem.sentence(),
    phone: faker.phone.phoneNumber(),
    lineId: faker.random.alphaNumeric(20),
    lineDisplayName: faker.name.findName(),
    linePictureUrl: faker.internet.avatar(),
    ...(options?.override ?? {}),
  }

  // TODO: find better TS support
  return Object.entries(data).reduce((selection, [key, value]) => {
    // @ts-ignore
    if (options?.unselect?.[key] === true) {
      return selection
    }
    return {
      ...selection,
      [key]: value,
    }
  }, {}) as any
}

export const buildPatient: BuildFn<PatientOnly> = (options) => {
  const data = {
    id: faker.datatype.uuid(),
    name: faker.name.findName(),
    ...(options?.override ?? {}),
  }

  // TODO: find better TS support
  return Object.entries(data).reduce((selection, [key, value]) => {
    // @ts-ignore
    if (options?.unselect?.[key] === true) {
      return selection
    }
    return {
      ...selection,
      [key]: value,
    }
  }, {}) as any
}

export function buildHomeIsolationFormWithPatients(): Omit<HomeIsolationForm, 'patients'> & {
  patients: PatientOnly[]
} {
  return {
    ...buildHomeIsolationForm(),
    patients: Array(Math.ceil(Math.random() * 2))
      .fill(null)
      .map(() => buildPatient()),
  }
}
