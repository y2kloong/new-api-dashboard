import type {
  HostToWebviewMessage,
  WebviewToHostMessage,
} from '../../src/shared/types'

interface VsCodeApi {
  postMessage(message: unknown): void
  getState(): unknown
  setState(state: unknown): void
}

declare function acquireVsCodeApi(): VsCodeApi

const api = acquireVsCodeApi()

export function post(message: WebviewToHostMessage): void {
  api.postMessage(message)
}

export type { HostToWebviewMessage }
