import * as vscode from 'vscode'
import { translate } from './shared/i18n'
import { DashboardController } from './host/controller'
import { DashboardPanel } from './host/panel'
import { SidebarProvider } from './host/sidebar'
import { StatusBar } from './host/statusBar'

let autoRefreshTimer: NodeJS.Timeout | undefined

function scheduleAutoRefresh(controller: DashboardController): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = undefined
  }
  const minutes = vscode.workspace
    .getConfiguration('lyNewApi')
    .get<number>('autoRefreshMinutes', 5)
  if (!Number.isFinite(minutes) || minutes <= 0) return
  autoRefreshTimer = setInterval(() => {
    if (controller.hasVisibleConsumer()) {
      void controller.refresh({ silent: true })
    }
  }, minutes * 60_000)
}

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('NewAPI Dashboard')
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
    vscode.commands.registerCommand('lyNewApi.openDashboard', () => {
      DashboardPanel.createOrShow(context.extensionUri, controller)
    }),
    vscode.commands.registerCommand('lyNewApi.refresh', async () => {
      await controller.refresh()
      vscode.window.setStatusBarMessage(
        `NewAPI Dashboard: ${translate(controller.getLocale(), 'toast.refreshed')}`,
        2000
      )
    }),
    vscode.commands.registerCommand('lyNewApi.manageProfiles', () => {
      controller.openSetup()
      DashboardPanel.createOrShow(context.extensionUri, controller)
    }),
    vscode.commands.registerCommand('lyNewApi.showLogs', () => {
      output.show(true)
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('lyNewApi.autoRefreshMinutes')) {
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
