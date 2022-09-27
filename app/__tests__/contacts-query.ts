import moment from 'moment'
import { faker } from '@faker-js/faker'

import { HomeIsolationForm, Prisma } from '@prisma/client'

import { db } from '~/utils/db.server'
import { FULL_TREATMENT_DAYS } from '~/domain/treatment'
import { queryContactsWithinActiveTreatmentPeriod } from '~/domain/notify-message.server'
import {
  queryContactsWhoGetRecoveryByToday,
  queryContactsWhoGonnaGetRecoveryByTomorrow,
} from '~/routes/webhooks/notify-end-of-treatment'
import { queryContactsWhoNeverSubmittedLocation } from '~/routes/webhooks/notify-contact-location-submission'

beforeEach(async () => {
  await cleanupDb()
})

afterAll(async () => {
  await cleanupDb()
  await db.$disconnect()
})

describe(`[built-in-utils]`, () => {
  describe(`${genContactsBetweenInclusively.name}`, () => {
    it('should generate contacts between given time correctly', () => {
      const generatedContacts = genContactsBetweenInclusively({ sinceDayAgo: 0, toDayAgo: 9 })
      expect(generatedContacts.length).toBe(10)
    })
  })

  describe(`${orderByAdmittedAt.name}`, () => {
    it('should order by date ascending', () => {
      const latestDateContact = genContact({ admittedDayAgo: 1 })
      const middleDateContact = genContact({ admittedDayAgo: 2 })
      const furthestDateContact = genContact({ admittedDayAgo: 3 })

      // [Declarative Note] Manually suffering contact and then apply ordering
      const orderedContacts = [middleDateContact, furthestDateContact, latestDateContact]
      orderedContacts.sort(orderByAdmittedAt)

      expect(orderedContacts).toEqual([furthestDateContact, middleDateContact, latestDateContact])
    })
  })
})

describe(`${queryContactsWithinActiveTreatmentPeriod.name}`, () => {
  it('should query only contacts, which are admitted within active treatment period, WITHOUT patients', async () => {
    const targetContacts = genContactsWhoAreAdmitted_BetweenExclusively_ActiveTreatmentPeriod()
    await db.homeIsolationForm.createMany({
      data: [...targetContacts, ...genContactsWhichAdmitted_Outside_ActiveTreatmentPeriod()],
    })

    const queriedContacts = await queryContactsWithinActiveTreatmentPeriod()

    const expectedContacts = targetContacts.map((item) => ({
      admittedAt: item.admittedAt,
      lineId: item.lineId,
      lineDisplayName: item.lineDisplayName,
    }))

    // [Declarative Note] We intentionally ignore the order of query, because we do care only
    // about the contact information to generate a message. So, we do NOT provide ordering on
    // any query. But in testing, we would like a consistent ordering to compare an array.
    // So, in testing what we did instead is sorting both expectations and resolved queries.
    expectedContacts.sort(orderByAdmittedAt)
    queriedContacts.sort(orderByAdmittedAt)

    expect(queriedContacts).toEqual(expectedContacts)
  })

  it('should query only contacts, which are admitted within active treatment period, WITH patients', async () => {
    const targetContacts = genContactsWhoAreAdmitted_BetweenExclusively_ActiveTreatmentPeriod()
    await db.homeIsolationForm.createMany({
      data: [...targetContacts, ...genContactsWhichAdmitted_Outside_ActiveTreatmentPeriod()],
    })

    const queriedContacts = await queryContactsWithinActiveTreatmentPeriod({
      includedPatients: true,
    })

    const expectedContacts = targetContacts.map((item) => ({
      admittedAt: item.admittedAt,
      lineId: item.lineId,
      lineDisplayName: item.lineDisplayName,
      // [Declarative Note] We did intentionally to NOT insert patient data into the database
      // because, we did NOT test the shape of `type Patient` but only the existence of it.
      patients: [],
    }))

    // [Declarative Note] We intentionally ignore the order of query, because we do care only
    // about the contact information to generate a message. So, we do NOT provide ordering on
    // any query. But in testing, we would like a consistent ordering to compare an array.
    // So, in testing what we did instead is sorting both expectations and resolved queries.
    expectedContacts.sort(orderByAdmittedAt)
    queriedContacts.sort(orderByAdmittedAt)

    expect(queriedContacts).toEqual(expectedContacts)
  })
})

describe(`${queryContactsWhoGetRecoveryByToday.name}`, () => {
  it('should query only contacts, who got recovery today ', async () => {
    const targetContact = genContact({ admittedDayAgo: FULL_TREATMENT_DAYS })
    await db.homeIsolationForm.createMany({
      data: [
        ...genContactsBetweenInclusively({
          sinceDayAgo: 0,
          toDayAgo: FULL_TREATMENT_DAYS - 1,
        }),

        targetContact,

        // [Declarative Note] Patients who are treated over the `FULL_TREATMENT_DAYS`
        ...genContactsBetweenInclusively({
          sinceDayAgo: FULL_TREATMENT_DAYS + 1,
          toDayAgo: FULL_TREATMENT_DAYS + 10,
        }),
      ],
    })

    const queriedContacts = await queryContactsWhoGetRecoveryByToday()
    const expectedContacts = [
      {
        admittedAt: targetContact.admittedAt,
        lineId: targetContact.lineId,
        lineDisplayName: targetContact.lineDisplayName,
      },
    ]

    expect(queriedContacts).toEqual(expectedContacts)
  })
})

describe(`${queryContactsWhoGonnaGetRecoveryByTomorrow.name}`, () => {
  it('should query only contacts, who gonna get recovery tomorrow ', async () => {
    const targetContact = genContact({ admittedDayAgo: FULL_TREATMENT_DAYS - 1 })
    await db.homeIsolationForm.createMany({
      data: [
        ...genContactsBetweenInclusively({
          sinceDayAgo: 0,
          toDayAgo: FULL_TREATMENT_DAYS - 2,
        }),

        targetContact,

        // [Declarative Note] Patients who are treated over the `FULL_TREATMENT_DAYS`
        ...genContactsBetweenInclusively({
          sinceDayAgo: FULL_TREATMENT_DAYS + 1,
          toDayAgo: FULL_TREATMENT_DAYS + 10,
        }),
      ],
    })

    const queriedContacts = await queryContactsWhoGonnaGetRecoveryByTomorrow()
    const expectedContacts = [
      {
        admittedAt: targetContact.admittedAt,
        lineId: targetContact.lineId,
        lineDisplayName: targetContact.lineDisplayName,
      },
    ]

    expect(queriedContacts).toEqual(expectedContacts)
  })
})

describe(`${queryContactsWhoNeverSubmittedLocation.name}`, () => {
  it('should query only contacts, who never submitted location', async () => {
    const targetContacts = [
      { ...genContact({ admittedDayAgo: 0 }), lat: null, lng: null },
      { ...genContact({ admittedDayAgo: 1 }), lat: null, lng: null },
    ]
    await db.homeIsolationForm.createMany({
      data: [
        ...targetContacts,
        ...genContactsBetweenInclusively({
          sinceDayAgo: 0,
          toDayAgo: 10,
        }),
      ],
    })

    const queriedContacts = await queryContactsWhoNeverSubmittedLocation()
    const expectedContacts = targetContacts.map((item) => ({
      admittedAt: item.admittedAt,
      lineId: item.lineId,
      lineDisplayName: item.lineDisplayName,
    }))

    expect(queriedContacts).toEqual(expectedContacts)
  })
})

async function cleanupDb() {
  // [Declarative Note] This is NOT reliable solution, expected behavior is deleting successfully on
  // every executing, but sometime they're NOT without any thrown errors. But there is the fact that,
  // we're already in risk of inconsistent connection to the runtime database server. By technical
  // perspective, it's IMPOSSIBLE to make the consistent connection in the real world anyway.
  // But any failure while clean-up is extremely rare and hard to reproduce, we would accept the risk.
  // So, the inconsistent connection behavior will be ACCEPTABLE!
  return db.$transaction([db.homeIsolationForm.deleteMany(), db.patient.deleteMany()])
}

function genContactsWhichAdmitted_Outside_ActiveTreatmentPeriod() {
  return [
    // [Declarative Note] Patient whom admitted today should never get notified
    genContact({ admittedDayAgo: 0 }),

    // [Declarative Note] Patients whom recovery today
    genContact({ admittedDayAgo: FULL_TREATMENT_DAYS }),

    // [Declarative Note] Patients whom be treated over the 'FULL_TREATMENT_DAYS'
    genContact({ admittedDayAgo: FULL_TREATMENT_DAYS + 1 }),
    genContact({ admittedDayAgo: FULL_TREATMENT_DAYS + 2 }),
    genContact({ admittedDayAgo: FULL_TREATMENT_DAYS + 3 }),
  ]
}

/**
 * [NOTE] `exclusively` in this context means NOT to include the boundary
 * eg.
 * let `FULL_TREATMENT_DAYS` is 10
 * and `active treatment period` will be a period between today to 10 days before today
 * then `exclusively active treatment period` will be day 2nd, 3rd, 4th, ...to, day 9th
 * without the boundary which day 1st and 10th
 */
function genContactsWhoAreAdmitted_BetweenExclusively_ActiveTreatmentPeriod() {
  // [Declarative Note]
  // eg. The policy defined 10 days as the 'FULL_TREATMENT_DAYS'
  // then, any patient since day 1st to day 9th should get notifying
  return genContactsBetweenInclusively({ sinceDayAgo: 1, toDayAgo: FULL_TREATMENT_DAYS - 1 })
}

/**
 * [NOTE] `inclusively` in this context means include the boundary
 * eg. { sinceDayAgo: 1, toDayAgo: 10 } would generate [1, 2, 3, ..., 10] by 1 and 10 is the boundary
 */
function genContactsBetweenInclusively({
  sinceDayAgo,
  toDayAgo,
}: {
  sinceDayAgo: number
  toDayAgo: number
}) {
  const total = toDayAgo - sinceDayAgo + 1
  return Array(total)
    .fill(null)
    .map((_value, idx) => genContact({ admittedDayAgo: idx + sinceDayAgo }))
}

function genContact({ admittedDayAgo }: { admittedDayAgo: number }): Omit<HomeIsolationForm, 'id'> {
  const admittedDay = moment().subtract(admittedDayAgo, 'day').startOf('day').set({ hour: 6 })

  return {
    createdAt: admittedDay.toDate(),
    updatedAt: admittedDay.toDate(),
    admittedAt: admittedDay.toDate(),
    treatmentDayCount: admittedDayAgo,
    lat: new Prisma.Decimal(0),
    lng: new Prisma.Decimal(0),
    zone: faker.address.city(),
    address: faker.address.streetAddress(true),
    landmarkNote: faker.lorem.text(),
    phone: faker.phone.phoneNumberFormat(),
    lineId: faker.random.alphaNumeric(20),
    lineDisplayName: faker.name.findName(),
    linePictureUrl: faker.internet.avatar(),
  }
}

function orderByAdmittedAt(a: { admittedAt: Date }, b: { admittedAt: Date }): number {
  return a.admittedAt.getTime() - b.admittedAt.getTime()
}
