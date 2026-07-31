import { describe, expect, it } from 'vitest'
import { initialPersistedState, parsePersistedState } from './storage'

describe('parsePersistedState', () => {
  it('descarta JSON corrompido', () => {
    expect(parsePersistedState('{não-json')).toEqual(initialPersistedState)
  })

  it('descarta estruturas inválidas', () => {
    expect(
      parsePersistedState(
        JSON.stringify({
          version: 1,
          draft: { days: 2, coldDays: 4, workouts: 0 },
          step: 4,
          resultSignature: '2:4:-2:0',
          checkedItemIds: [],
        }),
      ),
    ).toEqual(initialPersistedState)
  })

  it('restaura e remove marcações duplicadas de um estado válido', () => {
    const parsed = parsePersistedState(
      JSON.stringify({
        version: 1,
        draft: { days: 2, coldDays: 0, workouts: 1 },
        step: 4,
        resultSignature: '2:0:2:1',
        checkedItemIds: ['good-shirts', 'good-shirts'],
      }),
    )

    expect(parsed.checkedItemIds).toEqual(['good-shirts'])
    expect(parsed.step).toBe(4)
  })
})
