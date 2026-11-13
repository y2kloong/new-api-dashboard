import { useEffect, useState } from 'react'
import type {
  DashboardViewModel,
  HostToWebviewMessage,
} from '../../src/shared/types'
import { DashboardView } from './components/Dashboard'
import { SetupView } from './components/Setup'
import { SidebarView } from './components/Sidebar'
import { post } from './vscodeApi'

export interface AppProps {
  mode: 'panel' | 'sidebar'
}

interface TestResult {
  ok: boolean
  message: string
}

interface ToastState {
  kind: 'success' | 'error' | 'info'
  message: string
}

export function App({ mode }: AppProps) {
  const [state, setState] = useState<DashboardViewModel | null>(null)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent<HostToWebviewMessage>) => {
      const message = event.data
      if (!message || typeof message !== 'object') return
      if (message.type === 'state') {
        setState(message.state)
        setTestResult(null)
      } else if (message.type === 'testResult') {
        setTestResult({ ok: message.ok, message: message.message })
      } else if (message.type === 'toast') {
        setToast({ kind: message.kind, message: message.message })
      }
    }

    window.addEventListener('message', handleMessage)
    post({ type: 'ready' })
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!state) {
    return (
      <div className='boot'>
        <div className='spinner' />
      </div>
    )
  }

  return (
    <div
      className={`app theme-${state.themeKind} style-${state.themeStyle}`}
      data-mode={mode}
      data-theme-style={state.themeStyle}
    >
      <div className='aurora' aria-hidden='true' />
      <div className='scanlines' aria-hidden='true' />
      <div className='app-inner'>
        {mode === 'sidebar' ? (
          <SidebarView state={state} />
        ) : state.setupMode ? (
          <SetupView state={state} testResult={testResult} />
        ) : (
          <DashboardView state={state} />
        )}
      </div>
      {toast ? <div className={`toast ${toast.kind}`}>{toast.message}</div> : null}
    </div>
  )
}
