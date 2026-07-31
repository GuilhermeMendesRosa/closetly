import { describe, expect, it } from 'vitest'
import {
  calculatePackingList,
  formatPackingItem,
  validateTripInput,
  type TripInput,
} from './packing'

const quantities = (input: TripInput) =>
  Object.fromEntries(calculatePackingList(input).map((item) => [item.id, item.quantity]))

describe('calculatePackingList', () => {
  it('calcula dois dias frios sem treino', () => {
    expect(quantities({ days: 2, coldDays: 2, hotDays: 0, workouts: 0 })).toEqual({
      'good-shirts': 2,
      'home-shirts': 2,
      coats: 1,
      pants: 2,
      underwear: 3,
      socks: 3,
    })
  })

  it('calcula dois dias quentes e um treino', () => {
    expect(quantities({ days: 2, coldDays: 0, hotDays: 2, workouts: 1 })).toEqual({
      'good-shirts': 2,
      'home-shirts': 2,
      shorts: 2,
      'workout-sets': 1,
      'training-shoes': 1,
      underwear: 4,
      socks: 4,
    })
  })

  it('calcula três dias mistos e dois treinos', () => {
    expect(quantities({ days: 3, coldDays: 1, hotDays: 2, workouts: 2 })).toEqual({
      'good-shirts': 3,
      'home-shirts': 3,
      coats: 1,
      pants: 2,
      shorts: 2,
      'workout-sets': 2,
      'training-shoes': 1,
      underwear: 6,
      socks: 6,
    })
  })

  it('aceita mais de um treino por dia', () => {
    const result = quantities({ days: 2, coldDays: 0, hotDays: 2, workouts: 3 })
    expect(result['workout-sets']).toBe(3)
    expect(result.underwear).toBe(6)
  })

  it('omite todos os itens cuja quantidade é zero', () => {
    const result = calculatePackingList({ days: 1, coldDays: 0, hotDays: 1, workouts: 0 })
    expect(result.every((item) => item.quantity > 0)).toBe(true)
    expect(result.find((item) => item.id === 'coats')).toBeUndefined()
    expect(result.find((item) => item.id === 'workout-sets')).toBeUndefined()
  })

  it('usa singular e plural corretamente', () => {
    const items = calculatePackingList({ days: 1, coldDays: 1, hotDays: 0, workouts: 1 })
    expect(formatPackingItem(items.find((item) => item.id === 'coats')!)).toBe('1 casaco')
    expect(formatPackingItem(items.find((item) => item.id === 'pants')!)).toBe('2 calças')
  })
})

describe('validateTripInput', () => {
  it.each([
    [{ days: 0, coldDays: 0, hotDays: 0, workouts: 0 }, 'days'],
    [{ days: 2, coldDays: 2, hotDays: 0, workouts: -1 }, 'workouts'],
    [{ days: 3, coldDays: 1, hotDays: 1, workouts: 0 }, 'climate'],
    [{ days: 2, coldDays: 2, hotDays: 1, workouts: 0 }, 'climate'],
    [{ days: 2, coldDays: 1.5, hotDays: 0.5, workouts: 0 }, 'coldDays'],
  ] as const)('rejeita a entrada inválida %#', (input, expectedField) => {
    expect(validateTripInput(input).some((error) => error.field === expectedField)).toBe(true)
  })

  it('impede o cálculo de entradas inválidas', () => {
    expect(() =>
      calculatePackingList({ days: 0, coldDays: 0, hotDays: 0, workouts: 0 }),
    ).toThrow(RangeError)
  })
})
