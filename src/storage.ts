import type { PackingItemId, TripInput } from './domain/packing'

export const STORAGE_KEY = 'closetly:v1'

export interface TripDraft {
  days: number | null
  coldDays: number
  workouts: number
}

export interface PersistedAppState {
  version: 1
  draft: TripDraft
  step: 1 | 2 | 3 | 4
  resultSignature: string | null
  checkedItemIds: PackingItemId[]
}

export const initialPersistedState: PersistedAppState = {
  version: 1,
  draft: {
    days: null,
    coldDays: 0,
    workouts: 0,
  },
  step: 1,
  resultSignature: null,
  checkedItemIds: [],
}

const validItemIds = new Set<PackingItemId>([
  'good-shirts',
  'home-shirts',
  'coats',
  'pants',
  'shorts',
  'workout-sets',
  'training-shoes',
  'underwear',
  'socks',
])

const isIntegerAtLeast = (value: unknown, minimum: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= minimum

export function parsePersistedState(value: string | null): PersistedAppState {
  if (!value) return initialPersistedState

  try {
    const candidate: unknown = JSON.parse(value)

    if (!candidate || typeof candidate !== 'object') return initialPersistedState

    const state = candidate as Partial<PersistedAppState>
    const draft = state.draft as Partial<TripDraft> | undefined

    if (
      state.version !== 1 ||
      !draft ||
      !(
        draft.days === null ||
        isIntegerAtLeast(draft.days, 1)
      ) ||
      !isIntegerAtLeast(draft.coldDays, 0) ||
      !isIntegerAtLeast(draft.workouts, 0) ||
      (draft.days !== null && draft.coldDays > draft.days) ||
      ![1, 2, 3, 4].includes(state.step ?? 0) ||
      !(state.resultSignature === null || typeof state.resultSignature === 'string') ||
      !Array.isArray(state.checkedItemIds) ||
      !state.checkedItemIds.every(
        (item) => typeof item === 'string' && validItemIds.has(item as PackingItemId),
      )
    ) {
      return initialPersistedState
    }

    const requestedStep = state.step as PersistedAppState['step']
    const safeStep = draft.days === null && requestedStep > 1 ? 1 : requestedStep

    return {
      version: 1,
      draft: {
        days: draft.days,
        coldDays: draft.coldDays,
        workouts: draft.workouts,
      },
      step: safeStep,
      resultSignature: state.resultSignature ?? null,
      checkedItemIds: Array.from(new Set(state.checkedItemIds as PackingItemId[])),
    }
  } catch {
    return initialPersistedState
  }
}

export function loadAppState(): PersistedAppState {
  return parsePersistedState(window.localStorage.getItem(STORAGE_KEY))
}

export function saveAppState(state: PersistedAppState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearAppState(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function draftToTripInput(draft: TripDraft): TripInput | null {
  if (draft.days === null) return null

  return {
    days: draft.days,
    coldDays: draft.coldDays,
    hotDays: draft.days - draft.coldDays,
    workouts: draft.workouts,
  }
}
