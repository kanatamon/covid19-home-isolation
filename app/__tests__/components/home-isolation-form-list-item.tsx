/**
 * @jest-environment jsdom
 */

import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

import { buildHomeIsolationFormWithPatients } from '@/prisma/utils'
import { HomeIsolationFormListItem } from '~/components/home-isolation-form-list-item'

describe(`${HomeIsolationFormListItem.name}`, () => {
  it('should be able to copy-to-clipboard when copy button is clicked', async () => {
    const user = userEvent.setup()
    const data = buildHomeIsolationFormWithPatients()
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
    const data = buildHomeIsolationFormWithPatients()
    render(<HomeIsolationFormListItem data={data} onEditBtnClick={aCallback} />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    expect(aCallback).toHaveBeenCalled()
  })

  it(`should invoke a callback when map button is clicked`, async () => {
    const user = userEvent.setup()
    const aCallback = jest.fn()
    const data = buildHomeIsolationFormWithPatients()
    render(<HomeIsolationFormListItem data={data} onMapBtnClick={aCallback} />)

    await user.click(screen.getByRole('button', { name: /map/i }))

    expect(aCallback).toHaveBeenCalled()
  })
})
