import faker from '@faker-js/faker'
import { buildHomeIsolationForm, buildPatient } from './utils'

const CONSISTENT_SEED_FOR_TESTS = 2405

beforeAll(() => {
  faker.seed(CONSISTENT_SEED_FOR_TESTS)
})

describe(`${buildHomeIsolationForm.name}`, () => {
  it('should build with all props when there is no arguments', () => {
    const built = buildHomeIsolationForm()

    expect(Object.keys(built)).toEqual([
      'id',
      'createdAt',
      'updatedAt',
      'admittedAt',
      'treatmentDayCount',
      'lat',
      'lng',
      'zone',
      'address',
      'landmarkNote',
      'phone',
      'lineId',
      'lineDisplayName',
      'linePictureUrl',
    ])
  })

  it(`should build without any key if 'unselect' is provided`, () => {
    const built = buildHomeIsolationForm({ unselect: { id: true, address: true } })

    expect(Object.keys(built)).toEqual([
      // - 'id',
      'createdAt',
      'updatedAt',
      'admittedAt',
      'treatmentDayCount',
      'lat',
      'lng',
      'zone',
      // - 'address',
      'landmarkNote',
      'phone',
      'lineId',
      'lineDisplayName',
      'linePictureUrl',
    ])
  })

  it(`should build with override values`, () => {
    const myOverride = {
      id: 'MY_OVERRIDE_ID',
      treatmentDayCount: 99,
    }

    const built = buildHomeIsolationForm({
      override: myOverride,
    })

    expect(built.id).toBe(myOverride.id)
    expect(built.treatmentDayCount).toBe(myOverride.treatmentDayCount)
  })

  it(`should build when both option are provided`, () => {
    const myOverride = {
      zone: 'MY_OVERRIDE_ZONE',
    }

    const built = buildHomeIsolationForm({
      override: myOverride,
      unselect: { phone: true, lineId: true },
    })

    expect(Object.keys(built)).toEqual([
      'id',
      'createdAt',
      'updatedAt',
      'admittedAt',
      'treatmentDayCount',
      'lat',
      'lng',
      'zone',
      'address',
      'landmarkNote',
      // - 'phone',
      // - 'lineId',
      'lineDisplayName',
      'linePictureUrl',
    ])
    expect(built.zone).toBe(myOverride.zone)
  })
})

describe(`${buildPatient.name}`, () => {
  it('should build with all props when there is no arguments', () => {
    const built = buildPatient()

    expect(Object.keys(built)).toEqual(['id', 'name'])
  })

  it(`should build without any key if 'unselect' is provided`, () => {
    const built = buildPatient({ unselect: { name: true } })

    expect(Object.keys(built)).toEqual(['id'])
  })

  it(`should build with override values`, () => {
    const myOverride = {
      id: 'MY_OVERRIDE_ID',
    }

    const built = buildPatient({
      override: myOverride,
    })

    expect(built.id).toBe(myOverride.id)
  })

  it(`should build when both option are provided`, () => {
    const myOverride = {
      id: 'MY_OVERRIDE_ID',
    }

    const built = buildPatient({
      override: myOverride,
      unselect: {
        name: true,
      },
    })

    expect(Object.keys(built)).toEqual(['id'])
    expect(built.id).toBe(myOverride.id)
  })
})
