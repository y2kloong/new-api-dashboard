import * as vscode from 'vscode'
import { translate } from '../shared/i18n'
import type { DashboardController } from './controller'
import { getWebviewHtml } from './html'
import { handleWebviewMessage } from './messages'

const VIEW_TYPE = 'lyNewApi.dashboard'

export class DashboardPanel {
  private static current: DashboardPanel | undefined

  static createOrShow(
    extensionUri: vscode.Uri,
    controller: DashboardController
  ): DashboardPanel {
    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal(vscode.ViewColumn.One)
      return DashboardPanel.current
    }

    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      translate(controller.getLocale(), 'app.title'),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist', 'webview')],
      }
    )
    DashboardPanel.current = new DashboardPanel(panel, extensionUri, controller)
    return DashboardPanel.current
  }

  private readonly disposables: vscode.Disposable[] = []

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private readonly controller: DashboardController
  ) {
    this.panel.iconPath = vscode.Uri.joinPath(
      extensionUri,
      'media',
      'activity.svg'
    )
    this.panel.webview.html = getWebviewHtml(
      this.panel.webview,
      extensionUri,
      'panel'
    )

    controller.setPanelVisible(this.panel.visible)

    this.disposables.push(
      this.panel.onDidDispose(() => this.cleanup()),
      this.panel.onDidChangeViewState(() => {
        controller.setPanelVisible(this.panel.visible)
      }),
      this.panel.webview.onDidReceiveMessage((message) => {
        void handleWebviewMessage(message, controller, (hostMessage) => {
          void this.panel.webview.postMessage(hostMessage)
        })
      }),
      controller.onDidChange(() => this.postState())
    )

    this.postState()
  }

  private postState(): void {
    void this.panel.webview.postMessage({
      type: 'state',
      state: this.controller.getViewModel(),
    })
  }

  private cleanup(): void {
    this.controller.setPanelVisible(false)
    for (const disposable of this.disposables) disposable.dispose()
    this.disposables.length = 0
    if (DashboardPanel.current === this) {
      DashboardPanel.current = undefined
    }
  }
}
