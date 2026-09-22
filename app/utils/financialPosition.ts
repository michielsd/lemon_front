import type {
  FinancialPositionSnapshot,
  FinancialPositionWidgetSpec
} from '~/types/financial-position-widget'
import { toRaw } from 'vue'

export function isFinancialPositionWidgetSpec(value: unknown): value is FinancialPositionWidgetSpec {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as FinancialPositionWidgetSpec
  return candidate.kind === 'financial_position' && Array.isArray(candidate.kengetallen)
}

export function cloneFinancialPositionWidgetSpec(
  spec: FinancialPositionWidgetSpec
): FinancialPositionWidgetSpec {
  return JSON.parse(JSON.stringify(toRaw(spec))) as FinancialPositionWidgetSpec
}

const MOVE_BAND = 0.005

function peerClause(snapshot: FinancialPositionSnapshot): string | null {
  if (!snapshot.tov_gemiddelde || !snapshot.gemiddelde_pct) {
    return null
  }
  const klasse = snapshot.grootteklasse ? ` ${snapshot.grootteklasse}` : ''
  const average = `het gemiddelde van de grootteklasse${klasse} (${snapshot.gemiddelde_pct})`
  if (snapshot.tov_gemiddelde === 'ongeveer gelijk') {
    return `ongeveer gelijk aan ${average}`
  }
  return `${snapshot.tov_gemiddelde} dan ${average}`
}

function ratingTail(snapshot: FinancialPositionSnapshot): string {
  return [snapshot.categorie_label, peerClause(snapshot)]
    .filter((part): part is string => Boolean(part))
    .join(', ')
}

function movement(from: number | null | undefined, to: number | null | undefined) {
  if (typeof from !== 'number' || typeof to !== 'number') {
    return 'uit'
  }
  const delta = to - from
  if (Math.abs(delta) <= MOVE_BAND) {
    return 'blijft'
  }
  return delta > 0 ? 'stijgt' : 'daalt'
}

export function financialPositionDiscussion(
  rekening: FinancialPositionSnapshot | null,
  begroting: FinancialPositionSnapshot | null
): { jaarrekening: string, begroting: string } {
  let jaarrekening = ''
  if (rekening?.waarde_pct) {
    const when = rekening.jaar ? ` (${rekening.jaar})` : ''
    const tail = ratingTail(rekening)
    jaarrekening = `De jaarrekening${when} komt uit op ${rekening.waarde_pct}${tail ? `: ${tail}` : ''}.`
  }

  if (!begroting?.waarde_pct) {
    return { jaarrekening, begroting: '' }
  }

  const when = begroting.begroting ? ` (${begroting.begroting})` : ''
  const tail = ratingTail(begroting)
  const tailText = tail ? `: ${tail}` : ''
  const move = movement(rekening?.waarde, begroting.waarde)
  let followUp = `In de begroting${when} komt dit uit op ${begroting.waarde_pct}${tailText}.`
  if (move === 'stijgt') {
    followUp = `In de begroting${when} stijgt dit naar ${begroting.waarde_pct}${tailText}.`
  } else if (move === 'daalt') {
    followUp = `In de begroting${when} daalt dit naar ${begroting.waarde_pct}${tailText}.`
  } else if (move === 'blijft') {
    followUp = `In de begroting${when} blijft dit ${begroting.waarde_pct}${tailText}.`
  }
  if (begroting.pad_toelichting) {
    const pad = begroting.pad_toelichting
    const sentence = pad.charAt(0).toUpperCase() + pad.slice(1)
    followUp += ` ${sentence.endsWith('.') ? sentence : `${sentence}.`}`
  }
  return { jaarrekening, begroting: followUp }
}
