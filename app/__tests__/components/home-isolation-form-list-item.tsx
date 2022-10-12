/**
 * @jest-environment jsdom
 */

import faker from '@faker-js/faker'
import { Decimal } from '@prisma/client/runtime'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

import { HomeIsolationFormListItem } from '~/components/home-isolation-form-list-item'

describe(`${HomeIsolationFormListItem.name}`, () => {
  it('should be able to copy-to-clipboard when copy button is clicked', async () => {
    const user = userEvent.setup()
    const data = generateHomeIsolationForm()
    render(<HomeIsolationFormListItem data={data} />)

    expect(await window.navigator.clipboard.readText()).toBe('')

    const copyBtn = screen.getByRole('button', { name: /copy/i })
    await waitFor(() => expect(copyBtn).not.toBeDisabled())
    await user.click(copyBtn)

    expect(await window.navigator.clipboard.readText()).not.toBe('')
  })

  it(`should invoke a callback when edit button is clicked`, async () => {
    const user = userEvent.setup()
    const aCallback = jest.fn()
    const data = generateHomeIsolationForm()
    render(<HomeIsolationFormListItem data={data} onEditBtnClick={aCallback} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(aCallback).toHaveBeenCalled()
  })

  it(`should invoke a callback when map button is clicked`, async () => {
    const user = userEvent.setup()
    const aCallback = jest.fn()
    const data = generateHomeIsolationForm()
    render(<HomeIsolationFormListItem data={data} onMapBtnClick={aCallback} />)

    await user.click(screen.getByRole('button', { name: /map/i }))

    expect(aCallback).toHaveBeenCalled()
  })
})

// TODO: DRY? this should be in prisma utils
function generateHomeIsolationForm() {
  return {
    id: faker.datatype.uuid(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
    admittedAt: faker.date.recent(),
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
    patients: [
      {
        id: faker.datatype.uuid(),
        name: faker.name.findName(),
      },
    ],
  }
}
