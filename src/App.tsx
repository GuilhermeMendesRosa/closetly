import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculatePackingList,
  createTripSignature,
  formatPackingItem,
  type PackingItemId,
} from './domain/packing'
import { NumberStepper } from './components/NumberStepper'
import {
  clearAppState,
  draftToTripInput,
  initialPersistedState,
  loadAppState,
  saveAppState,
  type PersistedAppState,
  type TripDraft,
} from './storage'

const stepMeta = [
  { number: 1, short: 'Duração', eyebrow: 'Primeiro, o essencial' },
  { number: 2, short: 'Clima', eyebrow: 'Agora, a previsão' },
  { number: 3, short: 'Treinos', eyebrow: 'Por fim, o movimento' },
] as const

function validResultState(state: PersistedAppState): PersistedAppState {
  const input = draftToTripInput(state.draft)

  if (state.step !== 4 || !input) return state

  const signature = createTripSignature(input)
  if (state.resultSignature === signature) return state

  return { ...state, step: 1, resultSignature: null, checkedItemIds: [] }
}

function App() {
  const [appState, setAppState] = useState<PersistedAppState>(() =>
    validResultState(loadAppState()),
  )
  const [error, setError] = useState<string | null>(null)
  const plannerHeadingRef = useRef<HTMLHeadingElement>(null)
  const plannerRef = useRef<HTMLElement>(null)
  const { draft, step, checkedItemIds, resultSignature } = appState
  const tripInput = draftToTripInput(draft)
  const packingList = useMemo(
    () => (step === 4 && tripInput ? calculatePackingList(tripInput) : []),
    [step, tripInput],
  )
  const completedCount = packingList.filter((item) =>
    checkedItemIds.includes(item.id),
  ).length

  useEffect(() => {
    saveAppState(appState)
  }, [appState])

  useEffect(() => {
    if (step > 1) {
      plannerHeadingRef.current?.focus()
    }
  }, [step])

  const scrollToPlanner = () => {
    plannerRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => plannerHeadingRef.current?.focus(), 450)
  }

  const updateDraft = (patch: Partial<TripDraft>) => {
    setError(null)
    setAppState((current) => {
      const nextDraft = { ...current.draft, ...patch }

      if (
        patch.days !== undefined &&
        patch.days !== null &&
        Number.isFinite(patch.days) &&
        nextDraft.coldDays > patch.days
      ) {
        nextDraft.coldDays = Math.max(0, Math.floor(patch.days))
      }

      const nextInput = draftToTripInput(nextDraft)
      const hasChangedResult = Boolean(
        current.resultSignature &&
          (!nextInput || createTripSignature(nextInput) !== current.resultSignature),
      )

      return {
        ...current,
        draft: nextDraft,
        resultSignature: hasChangedResult ? null : current.resultSignature,
        checkedItemIds: hasChangedResult ? [] : current.checkedItemIds,
      }
    })
  }

  const goBack = () => {
    setError(null)
    setAppState((current) => ({
      ...current,
      step: Math.max(1, current.step - 1) as PersistedAppState['step'],
    }))
  }

  const continueFlow = () => {
    if (step === 1) {
      if (draft.days === null || !Number.isInteger(draft.days) || draft.days < 1) {
        setError('Informe pelo menos 1 dia inteiro para continuar.')
        return
      }

      setError(null)
      setAppState((current) => ({ ...current, step: 2 }))
      return
    }

    if (step === 2) {
      if (
        draft.days === null ||
        !Number.isInteger(draft.coldDays) ||
        draft.coldDays < 0 ||
        draft.coldDays > draft.days
      ) {
        setError(`Escolha um número inteiro entre 0 e ${draft.days ?? 0}.`)
        return
      }

      setError(null)
      setAppState((current) => ({ ...current, step: 3 }))
      return
    }

    if (step === 3) {
      if (!Number.isInteger(draft.workouts) || draft.workouts < 0) {
        setError('Informe um número inteiro de treinos, começando em zero.')
        return
      }

      const input = draftToTripInput(draft)
      if (!input) return

      const signature = createTripSignature(input)
      setError(null)
      setAppState((current) => ({
        ...current,
        step: 4,
        resultSignature: signature,
        checkedItemIds:
          current.resultSignature === signature ? current.checkedItemIds : [],
      }))
    }
  }

  const togglePackingItem = (id: PackingItemId) => {
    setAppState((current) => ({
      ...current,
      checkedItemIds: current.checkedItemIds.includes(id)
        ? current.checkedItemIds.filter((itemId) => itemId !== id)
        : [...current.checkedItemIds, id],
    }))
  }

  const editTrip = () => {
    setError(null)
    setAppState((current) => ({ ...current, step: 1 }))
  }

  const restart = () => {
    clearAppState()
    setError(null)
    setAppState(initialPersistedState)
    window.setTimeout(scrollToPlanner, 0)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    continueFlow()
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Closetly, início">
          <img className="brand__mark" src="/logo-mark.svg" alt="" width="36" height="36" />
          <span>Closetly</span>
        </a>
        <a className="header-link" href="#planejador">Montar mochila</a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <picture className="hero__media" aria-hidden="true">
            <source media="(max-width: 639px)" srcSet="/images/hero-mobile.webp" />
            <img
              src="/images/hero-desktop.webp"
              alt=""
              width="1672"
              height="941"
              fetchPriority="high"
            />
          </picture>
          <div className="hero__scrim" />
          <div className="hero__content">
            <p className="hero__eyebrow">Menos dúvida. Mais viagem.</p>
            <h1 id="hero-title" aria-label="Viaje leve. Leve certo.">Viaje leve.<br />Leve certo.</h1>
            <p className="hero__intro">
              Uma checklist sob medida para os dias, o clima e o ritmo da sua viagem.
            </p>
            <button className="button button--on-image" type="button" onClick={scrollToPlanner}>
              Montar minha mochila
              <span aria-hidden="true">↘</span>
            </button>
          </div>
          <p className="hero__caption">01 — Seu roteiro vira uma lista objetiva</p>
        </section>

        <section className="planner" id="planejador" ref={plannerRef} aria-labelledby="planner-title">
          <div className="planner__aside">
            <p className="section-kicker">Planejador de viagem</p>
            <ol className="step-list" aria-label="Etapas do planejamento">
              {stepMeta.map((item) => {
                const isCurrent = step === item.number
                const isComplete = step > item.number
                return (
                  <li
                    key={item.number}
                    className={`${isCurrent ? 'is-current' : ''}${isComplete ? ' is-complete' : ''}`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    <span>{isComplete ? '✓' : `0${item.number}`}</span>
                    {item.short}
                  </li>
                )
              })}
              <li className={step === 4 ? 'is-current' : ''} aria-current={step === 4 ? 'step' : undefined}>
                <span>{step === 4 ? '04' : '04'}</span>
                Checklist
              </li>
            </ol>
          </div>

          <div className="planner__main">
            {step < 4 ? (
              <form onSubmit={handleSubmit} noValidate>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="Progresso do formulário"
                  aria-valuemin={1}
                  aria-valuemax={3}
                  aria-valuenow={step}
                >
                  <span style={{ width: `${(step / 3) * 100}%` }} />
                </div>
                <p className="form-eyebrow">{stepMeta[step - 1].eyebrow}</p>

                {step === 1 && (
                  <div className="step-panel">
                    <h2 id="planner-title" ref={plannerHeadingRef} tabIndex={-1} aria-label="Quantos dias você vai ficar?">
                      Quantos dias<br />você vai ficar?
                    </h2>
                    <p className="step-panel__intro">
                      Conte cada dia em que você vai precisar de uma troca normal de roupa.
                    </p>
                    <NumberStepper
                      id="days"
                      label="Duração da viagem"
                      description="Use dias inteiros, começando em 1."
                      value={draft.days}
                      min={1}
                      error={error ?? undefined}
                      onChange={(days) => updateDraft({ days })}
                    />
                  </div>
                )}

                {step === 2 && draft.days !== null && (
                  <div className="step-panel">
                    <h2 id="planner-title" ref={plannerHeadingRef} tabIndex={-1} aria-label="E o clima desses dias?">
                      E o clima<br />desses dias?
                    </h2>
                    <p className="step-panel__intro">
                      Diga quantos serão frios. O restante entra automaticamente como quente.
                    </p>
                    <NumberStepper
                      id="cold-days"
                      label="Dias frios"
                      description={`De 0 a ${draft.days} dias.`}
                      value={draft.coldDays}
                      min={0}
                      max={draft.days}
                      error={error ?? undefined}
                      onChange={(coldDays) => updateDraft({ coldDays: coldDays ?? 0 })}
                    />
                    <div className="climate-summary" aria-live="polite">
                      <div>
                        <span className="climate-summary__icon" aria-hidden="true">✦</span>
                        <span>Dias frios</span>
                        <strong>{draft.coldDays}</strong>
                      </div>
                      <div>
                        <span className="climate-summary__icon climate-summary__icon--sun" aria-hidden="true">☀</span>
                        <span>Dias quentes</span>
                        <strong>{Math.max(0, draft.days - draft.coldDays)}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="step-panel">
                    <h2 id="planner-title" ref={plannerHeadingRef} tabIndex={-1} aria-label="Quantos treinos estão no plano?">
                      Quantos treinos<br />estão no plano?
                    </h2>
                    <p className="step-panel__intro">
                      Pode haver mais de um treino por dia. Cada um ganha um conjunto próprio.
                    </p>
                    <NumberStepper
                      id="workouts"
                      label="Treinos planejados"
                      description="Se não pretende treinar, mantenha em zero."
                      value={draft.workouts}
                      min={0}
                      error={error ?? undefined}
                      onChange={(workouts) => updateDraft({ workouts: workouts ?? 0 })}
                    />
                  </div>
                )}

                <div className="form-actions">
                  {step > 1 ? (
                    <button className="button button--secondary" type="button" onClick={goBack}>
                      <span aria-hidden="true">←</span> Voltar
                    </button>
                  ) : (
                    <span />
                  )}
                  <button className="button button--primary" type="submit">
                    {step === 3 ? 'Criar checklist' : 'Continuar'}
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="results" aria-live="polite">
                <p className="form-eyebrow">Sua mala, na medida</p>
                <div className="results__heading">
                  <div>
                    <h2 id="planner-title" ref={plannerHeadingRef} tabIndex={-1} aria-label="Hora de fazer as malas.">
                      Hora de<br />fazer as malas.
                    </h2>
                    {tripInput && (
                      <p>
                        {tripInput.days} {tripInput.days === 1 ? 'dia' : 'dias'} · {tripInput.coldDays}{' '}
                        {tripInput.coldDays === 1 ? 'frio' : 'frios'} · {tripInput.hotDays}{' '}
                        {tripInput.hotDays === 1 ? 'quente' : 'quentes'} · {tripInput.workouts}{' '}
                        {tripInput.workouts === 1 ? 'treino' : 'treinos'}
                      </p>
                    )}
                  </div>
                  <div className="completion" aria-label={`${completedCount} de ${packingList.length} itens concluídos`}>
                    <strong>{packingList.length === 0 ? 0 : Math.round((completedCount / packingList.length) * 100)}%</strong>
                    <span>na mochila</span>
                  </div>
                </div>

                <div className="checklist-progress" aria-hidden="true">
                  <span
                    style={{
                      width: `${packingList.length === 0 ? 0 : (completedCount / packingList.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="completion-copy">
                  {completedCount === packingList.length
                    ? 'Tudo pronto. Boa viagem!'
                    : `${completedCount} de ${packingList.length} tipos de peça já separados.`}
                </p>

                <ul className="checklist">
                  {packingList.map((item, index) => {
                    const checked = checkedItemIds.includes(item.id)
                    return (
                      <li key={item.id} className={checked ? 'is-checked' : ''}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePackingItem(item.id)}
                          />
                          <span className="custom-check" aria-hidden="true">{checked ? '✓' : ''}</span>
                          <span className="checklist__number">{String(index + 1).padStart(2, '0')}</span>
                          <span className="checklist__label">{formatPackingItem(item)}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>

                <div className="result-actions">
                  <button className="button button--primary" type="button" onClick={editTrip}>
                    Editar viagem <span aria-hidden="true">↗</span>
                  </button>
                  <button className="text-button" type="button" onClick={restart}>
                    Começar de novo
                  </button>
                </div>
                <span className="sr-only">Resultado {resultSignature ? 'salvo' : 'atualizado'} neste navegador.</span>
              </div>
            )}
          </div>
        </section>

        <section className="principles" aria-labelledby="principles-title">
          <p className="section-kicker">Como calculamos</p>
          <div className="principles__grid">
            <h2 id="principles-title" aria-label="Uma regra simples. Nenhuma peça à toa.">Uma regra simples.<br />Nenhuma peça à toa.</h2>
            <div className="principles__items">
              <article>
                <span>01</span>
                <h3>Todo dia conta</h3>
                <p>Uma troca principal e uma camiseta confortável para cada dia da viagem.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Clima sob controle</h3>
                <p>Frio pede casaco e calças; calor pede bermudas, sempre com mínimo útil.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Treino sem improviso</h3>
                <p>Cada atividade adiciona um conjunto e as trocas extras de que você precisa.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand brand--footer" href="#top">
          <img className="brand__mark" src="/logo-mark.svg" alt="" width="36" height="36" />
          <span>Closetly</span>
        </a>
        <p>Planeje melhor. Carregue menos.</p>
        <p className="footer-note">Feito para viagens, não para excessos.</p>
      </footer>
    </div>
  )
}

export default App
