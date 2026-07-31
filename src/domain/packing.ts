export interface TripInput {
  days: number
  coldDays: number
  hotDays: number
  workouts: number
}

export type PackingItemId =
  | 'good-shirts'
  | 'home-shirts'
  | 'coats'
  | 'pants'
  | 'shorts'
  | 'workout-sets'
  | 'training-shoes'
  | 'underwear'
  | 'socks'

export interface PackingItem {
  id: PackingItemId
  singular: string
  plural: string
  quantity: number
}

export interface ValidationError {
  field: keyof TripInput | 'climate'
  message: string
}

const isHalfDayIncrement = (value: number) =>
  Number.isFinite(value) && Number.isInteger(value * 2)

const isNonNegativeHalfDay = (value: number) =>
  isHalfDayIncrement(value) && value >= 0

const isNonNegativeInteger = (value: number) => Number.isInteger(value) && value >= 0

const calculateColdOuterwear = (coldDays: number) => {
  const packingDays = Math.ceil(coldDays)
  return packingDays >= 2
    ? Math.max(Math.ceil(packingDays / 2), 2)
    : packingDays
}

export function validateTripInput(input: TripInput): ValidationError[] {
  const errors: ValidationError[] = []

  if (!isHalfDayIncrement(input.days) || input.days < 1) {
    errors.push({
      field: 'days',
      message: 'A viagem precisa ter pelo menos 1 dia, em intervalos de meio dia.',
    })
  }

  const climateFields: Array<[keyof TripInput, number, string]> = [
    ['coldDays', input.coldDays, 'Os dias frios'],
    ['hotDays', input.hotDays, 'Os dias quentes'],
  ]

  climateFields.forEach(([field, value, label]) => {
    if (!isNonNegativeHalfDay(value)) {
      errors.push({
        field,
        message: `${label} devem ser informados em intervalos de meio dia, a partir de zero.`,
      })
    }
  })

  if (!isNonNegativeInteger(input.workouts)) {
    errors.push({
      field: 'workouts',
      message: 'Os treinos devem ser informados com um número inteiro maior ou igual a zero.',
    })
  }

  if (
    isHalfDayIncrement(input.days) &&
    isHalfDayIncrement(input.coldDays) &&
    isHalfDayIncrement(input.hotDays) &&
    input.coldDays + input.hotDays !== input.days
  ) {
    errors.push({
      field: 'climate',
      message: 'A soma dos dias frios e quentes deve ser igual à duração da viagem.',
    })
  }

  return errors
}

export function calculatePackingList(input: TripInput): PackingItem[] {
  const errors = validateTripInput(input)

  if (errors.length > 0) {
    throw new RangeError(errors.map((error) => error.message).join(' '))
  }

  const { days, coldDays, hotDays, workouts } = input
  const packingDays = Math.ceil(days)
  const items: PackingItem[] = [
    {
      id: 'good-shirts',
      singular: 'camiseta boa',
      plural: 'camisetas boas',
      quantity: packingDays,
    },
    {
      id: 'home-shirts',
      singular: 'camiseta para ficar em casa',
      plural: 'camisetas para ficar em casa',
      quantity: packingDays,
    },
    {
      id: 'coats',
      singular: 'casaco',
      plural: 'casacos',
      quantity: calculateColdOuterwear(coldDays),
    },
    {
      id: 'pants',
      singular: 'calça',
      plural: 'calças',
      quantity: calculateColdOuterwear(coldDays),
    },
    {
      id: 'shorts',
      singular: 'bermuda',
      plural: 'bermudas',
      quantity: hotDays > 0 ? Math.max(Math.ceil(hotDays), 2) : 0,
    },
    {
      id: 'workout-sets',
      singular: 'conjunto de academia',
      plural: 'conjuntos de academia',
      quantity: workouts,
    },
    {
      id: 'training-shoes',
      singular: 'par de tênis para atividade física',
      plural: 'pares de tênis para atividade física',
      quantity: workouts > 0 ? 1 : 0,
    },
    {
      id: 'underwear',
      singular: 'cueca',
      plural: 'cuecas',
      quantity: packingDays + workouts + 1,
    },
    {
      id: 'socks',
      singular: 'par de meias',
      plural: 'pares de meias',
      quantity: packingDays + workouts + 1,
    },
  ]

  return items.filter((item) => item.quantity > 0)
}

export function formatPackingItem(item: PackingItem): string {
  const label = item.quantity === 1 ? item.singular : item.plural
  return `${item.quantity} ${label}`
}

export function createTripSignature(input: TripInput): string {
  return [input.days, input.coldDays, input.hotDays, input.workouts].join(':')
}
