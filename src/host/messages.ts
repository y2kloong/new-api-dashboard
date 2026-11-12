import * as vscode from 'vscode'
import { translate } from '../shared/i18n'
import type {
  DashboardFilters,
  DashboardPreferences,
  HostToWebviewMessage,
  ProfileInput,
  WebviewToHostMessage,
} from '../shared/types'
import type { DashboardController } from './controller'

export type PostMessage = (message: HostToWebviewMessage) => void

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

export async function handleWebviewMessage(
  rawMessage: unknown,
  controller: DashboardController,
  post: PostMessage
): Promise<void> {
  const message = asRecord(rawMessage)
  if (!message || typeof message.type !== 'string') return

  switch (message.type as WebviewToHostMessage['type']) {
    case 'ready': {
      post({ type: 'state', state: controller.getViewModel() })
      return
    }
    case 'refresh': {
      await controller.refresh()
      return
    }
    case 'applyFilters': {
      const filters = message.filters as DashboardFilters | undefined
      if (filters) {
        await controller.applyFilters(filters)
      }
      return
    }
    case 'setPreferences': {
      const preferences = message.preferences as
        | Partial<DashboardPreferences>
        | undefined
      if (preferences) {
        await controller.setPreferences(preferences)
      }
      return
    }
    case 'switchProfile': {
      if (typeof message.profileId === 'string') {
        await controller.switchProfile(message.profileId)
      }
      return
    }
    case 'addProfile': {
      const profile = message.profile as ProfileInput | undefined
      if (profile) {
        await controller.addProfile(profile)
      }
      return
    }
    case 'updateProfile': {
      if (typeof message.profileId !== 'string') return
      const profile = message.profile as ProfileInput | undefined
      if (profile) {
        await controller.updateProfile(message.profileId, profile)
      }
      return
    }
    case 'testProfile': {
      if (typeof message.baseUrl !== 'string' || typeof message.token !== 'string') {
        return
      }
      const result = await controller.testProfile(message.baseUrl, message.token)
      post({
        type: 'testResult',
        ok: result.ok,
        message: result.message,
        username: result.username,
        role: result.role,
      })
      return
    }
    case 'deleteProfile': {
      if (typeof message.profileId !== 'string') return
      const locale = controller.getLocale()
      const deleteLabel = translate(locale, 'common.delete')
      const choice = await vscode.window.showWarningMessage(
        translate(locale, 'setup.deleteConfirm'),
        { modal: true },
        deleteLabel
      )
      if (choice === deleteLabel) {
        await controller.deleteProfile(message.profileId)
      }
      return
    }
    case 'openSetup': {
      controller.openSetup()
      await vscode.commands.executeCommand('lyNewApi.openDashboard')
      return
    }
    case 'openDashboard': {
      controller.openDashboard()
      await vscode.commands.executeCommand('lyNewApi.openDashboard')
      return
    }
    case 'openExternal': {
      if (typeof message.url !== 'string') return
      let parsed: vscode.Uri
      try {
        parsed = vscode.Uri.parse(message.url, true)
      } catch {
        return
      }
      if (parsed.scheme !== 'https' && parsed.scheme !== 'http') return
      await vscode.env.openExternal(parsed)
      return
    }
    default:
      return
  }
}
