// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from './App'

afterEach(cleanup)

describe('App', () => {
  it('shows sandbox and factory events after creating a sandbox', () => {
    render(<App />)

    expect(screen.getByText('No events yet. Start with Create Sandbox.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Create Sandbox' }))

    expect(screen.getByText(/^Created isolated sandbox sbx-/)).toBeTruthy()
    expect(screen.getByText(/^Factory registered pipeline on sbx-/)).toBeTruthy()
  })

  it('shows why a factory task cannot run before sandbox creation', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Run Factory Job' }))

    expect(screen.getByText('Skipped task run: create sandbox first')).toBeTruthy()
  })
})
