/**
 * Thin wrapper over the browser's SpeechRecognition (Chrome/Android and
 * most WebKit browsers). Returns null where unsupported — the voice sheet
 * then falls back to typing the same sentence.
 */

export interface Recognizer {
  start: () => void
  stop: () => void
  onResult: (cb: (transcript: string, isFinal: boolean) => void) => void
  onEnd: (cb: () => void) => void
  onError: (cb: (message: string) => void) => void
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

interface NativeRecognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error?: string }) => void) | null
  start: () => void
  stop: () => void
}

export function speechSupported(): boolean {
  const w = window as unknown as Record<string, unknown>
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export function createRecognizer(): Recognizer | null {
  const w = window as unknown as Record<string, unknown>
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => NativeRecognition)
    | undefined
  if (!Ctor) return null

  const rec = new Ctor()
  rec.lang = 'en-US'
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1

  let resultCb: ((t: string, f: boolean) => void) | undefined
  let endCb: (() => void) | undefined
  let errorCb: ((m: string) => void) | undefined

  rec.onresult = (e) => {
    let text = ''
    let isFinal = false
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript
      if (e.results[i].isFinal) isFinal = true
    }
    resultCb?.(text.trim(), isFinal)
  }
  rec.onend = () => endCb?.()
  rec.onerror = (e) => {
    const code = e.error ?? 'unknown'
    const message =
      code === 'not-allowed' || code === 'service-not-allowed'
        ? 'Microphone access was blocked — allow it in your browser settings, or type your entry below.'
        : code === 'no-speech'
          ? 'Didn’t hear anything — tap the mic and try again.'
          : `Speech recognition error (${code}) — you can type the entry below.`
    errorCb?.(message)
  }

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
    onResult: (cb) => (resultCb = cb),
    onEnd: (cb) => (endCb = cb),
    onError: (cb) => (errorCb = cb)
  }
}
