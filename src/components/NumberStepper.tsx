import { useId } from 'react'

interface NumberStepperProps {
  id: string
  label: string
  description: string
  value: number | null
  min: number
  max?: number
  error?: string
  onChange: (value: number | null) => void
}

export function NumberStepper({
  id,
  label,
  description,
  value,
  min,
  max,
  error,
  onChange,
}: NumberStepperProps) {
  const descriptionId = useId()
  const errorId = useId()
  const canDecrease = value !== null && value > min
  const canIncrease = value === null || max === undefined || value < max

  const clamp = (nextValue: number) => {
    const withMinimum = Math.max(min, nextValue)
    return max === undefined ? withMinimum : Math.min(max, withMinimum)
  }

  return (
    <div className={`number-field${error ? ' number-field--error' : ''}`}>
      <div className="number-field__copy">
        <label htmlFor={id}>{label}</label>
        <p id={descriptionId}>{description}</p>
      </div>

      <div className="stepper">
        <button
          type="button"
          aria-label={`Diminuir ${label.toLowerCase()}`}
          disabled={!canDecrease}
          onClick={() => onChange(clamp((value ?? min) - 1))}
        >
          <span aria-hidden="true">−</span>
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step="1"
          value={value ?? ''}
          aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ''}`}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            const rawValue = event.target.value
            onChange(rawValue === '' ? null : Number(rawValue))
          }}
        />
        <button
          type="button"
          aria-label={`Aumentar ${label.toLowerCase()}`}
          disabled={!canIncrease}
          onClick={() => onChange(clamp((value ?? min - 1) + 1))}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      {error && (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
