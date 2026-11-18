import * as vscode from 'vscode'
import { translate } from './shared/i18n'
import {
  COMMAND_IDS,
  SETTINGS_SECTION,
  SETTING_IDS,
  SETTING_NAMES,
} from './shared/identifiers'
import { DashboardController } from './host/controller'
import { DashboardPanel } from './host/panel'
import { SidebarProvider } from './host/sidebar'
import { StatusBar } from './host/statusBar'
import { migrateLegacySettings } from './host/settingsMigration'

let autoRefreshTimer: NodeJS.Timeout | undefined

function scheduleAutoRefresh(controller: DashboardController): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = undefined
  }
  const minutes = vscode.workspace
    .getConfiguration(SETTINGS_SECTION)
    .get<number>(SETTING_NAMES.autoRefreshMinutes, 5)
  if (!Number.isFinite(minutes) || minutes <= 0) return
  autoRefreshTimer = setInterval(() => {
    if (controller.hasVisibleConsumer()) {
      void controller.refresh({ silent: true })
    }
  }, minutes * 60_000)
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('NewAPI Dashboard')

  try {
    await migrateLegacySettings()
  } catch (error) {
    output.appendLine(`Settings migration failed: ${String(error)}`)
  }

  const controller = new DashboardController(context, output)
  const statusBar = new StatusBar(controller)
  const sidebar = new SidebarProvider(
    context.extensionUri,
    controller,
    SidebarProvider.activityViewType
  )
  const explorerView = new SidebarProvider(
    context.extensionUri,
    controller,
    SidebarProvider.explorerViewType
  )

  context.subscriptions.push(
    output,
    controller,
    statusBar,
    sidebar,
    explorerView,
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.activityViewType,
      sidebar,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.explorerViewType,
      explorerView,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.commands.registerCommand(COMMAND_IDS.openDashboard, () => {
      DashboardPanel.createOrShow(context.extensionUri, controller)
    }),
    vscode.commands.registerCommand(COMMAND_IDS.refresh, async () => {
      await controller.refresh()
      vscode.window.setStatusBarMessage(
        `NewAPI Dashboard: ${translate(controller.getLocale(), 'toast.refreshed')}`,
        2000
      )
    }),
    vscode.commands.registerCommand(COMMAND_IDS.manageProfiles, () => {
      controller.openSetup()
      DashboardPanel.createOrShow(context.extensionUri, controller)
    }),
    vscode.commands.registerCommand(COMMAND_IDS.showLogs, () => {
      output.show(true)
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(SETTING_IDS.autoRefreshMinutes)) {
        scheduleAutoRefresh(controller)
      }
    }),
    new vscode.Disposable(() => {
      if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer)
        autoRefreshTimer = undefined
      }
    })
  )

  scheduleAutoRefresh(controller)

  if (controller.getProfiles().length > 0) {
    void controller.refresh({ silent: true })
  }
}

export function deactivate(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = undefined
  }
}
