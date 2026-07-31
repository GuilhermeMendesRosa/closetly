import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'

function completeFlow({ days = 2, coldDays = 0, workouts = 1 } = {}) {
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Duração da viagem' }), {
    target: { value: String(days) },
  })
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

  fireEvent.change(screen.getByRole('spinbutton', { name: 'Dias frios' }), {
    target: { value: String(coldDays) },
  })
  fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

  fireEvent.change(screen.getByRole('spinbutton', { name: 'Treinos planejados' }), {
    target: { value: String(workouts) },
  })
  fireEvent.click(screen.getByRole('button', { name: /criar checklist/i }))
}

describe('App', () => {
  it('bloqueia a primeira etapa sem uma duração válida', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Informe pelo menos 1 dia inteiro')
    expect(screen.getByRole('spinbutton', { name: 'Duração da viagem' })).toBeInTheDocument()
  })

  it('navega pelas três etapas e exibe a checklist correta', () => {
    render(<App />)
    completeFlow({ days: 2, coldDays: 0, workouts: 1 })

    expect(screen.getByRole('heading', { name: /hora de fazer as malas/i })).toBeInTheDocument()
    expect(screen.getByText('2 camisetas boas')).toBeInTheDocument()
    expect(screen.getByText('2 bermudas')).toBeInTheDocument()
    expect(screen.getByText('1 conjunto de academia')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /casaco/ })).not.toBeInTheDocument()
  })

  it('marca itens e atualiza o progresso', () => {
    render(<App />)
    completeFlow()

    const firstItem = screen.getByRole('checkbox', { name: /2 camisetas boas/ })
    fireEvent.click(firstItem)

    expect(firstItem).toBeChecked()
    expect(screen.getByText(/1 de 7 tipos de peça/)).toBeInTheDocument()
  })

  it('restaura checklist e progresso válidos do navegador', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        draft: { days: 2, coldDays: 0, workouts: 1 },
        step: 4,
        resultSignature: '2:0:2:1',
        checkedItemIds: ['good-shirts'],
      }),
    )

    render(<App />)

    expect(screen.getByRole('checkbox', { name: /2 camisetas boas/ })).toBeChecked()
    expect(screen.getByText(/1 de 7 tipos de peça/)).toBeInTheDocument()
  })

  it('limpa o progresso ao mudar uma entrada do cálculo', () => {
    render(<App />)
    completeFlow()
    fireEvent.click(screen.getByRole('checkbox', { name: /2 camisetas boas/ }))
    fireEvent.click(screen.getByRole('button', { name: /editar viagem/i }))
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Duração da viagem' }), {
      target: { value: '3' },
    })

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.click(screen.getByRole('button', { name: /criar checklist/i }))

    expect(screen.getByRole('checkbox', { name: /3 camisetas boas/ })).not.toBeChecked()
    expect(screen.getByText(/0 de 7 tipos de peça/)).toBeInTheDocument()
  })

  it('começa de novo e remove o estado persistido', async () => {
    render(<App />)
    completeFlow()
    fireEvent.click(screen.getByRole('button', { name: /começar de novo/i }))

    expect(screen.getByRole('spinbutton', { name: 'Duração da viagem' })).toHaveValue(null)
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
      expect(stored.draft?.days).toBeNull()
    })
  })
})
