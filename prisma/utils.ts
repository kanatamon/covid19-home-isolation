import faker from '@faker-js/faker'
import { Decimal } from '@prisma/client/runtime'
import { db } from './seed/memory-usage-simulator'

// TODO: Re-use in tests ?
export function createContact() {
  return db.homeIsolationForm.create({
    data: {
      lat: new Decimal(faker.address.latitude()),
      lng: new Decimal(faker.address.longitude()),
      zone: faker.address.cityName(),
      address: faker.address.streetAddress(true),
      landmarkNote: faker.lorem.sentence(),
      phone: faker.phone.phoneNumber(),
      lineId: faker.random.alphaNumeric(20),
      lineDisplayName: faker.name.findName(),
      linePictureUrl: faker.internet.avatar(),
      patients: {
        create: [
          {
            name: faker.name.findName(),
          },
        ],
      },
    },
  })
}
