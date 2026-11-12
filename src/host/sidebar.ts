import * as vscode from 'vscode'
import type { DashboardController } from './controller'
import { getWebviewHtml } from './html'
import { handleWebviewMessage } from './messages'

export class SidebarProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly activityViewType = 'lyNewApi.sidebar'
  static readonly explorerViewType = 'lyNewApi.explorer'

  private view: vscode.WebviewView | undefined
  private readonly disposables: vscode.Disposable[] = []

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly controller: DashboardController,
    private readonly viewType: string = SidebarProvider.activityViewType
  ) {
    this.disposables.push(
      controller.onDidChange(() => this.postState())
    )
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview')],
    }
    view.webview.html = getWebviewHtml(
      view.webview,
      this.extensionUri,
      'sidebar'
    )

    this.disposables.push(
      view.webview.onDidReceiveMessage((message) => {
        void handleWebviewMessage(message, this.controller, (hostMessage) => {
          void view.webview.postMessage(hostMessage)
        })
      }),
      view.onDidChangeVisibility(() => {
        this.controller.setSidebarVisible(this.viewType, view.visible)
        if (view.visible) this.postState()
      }),
      view.onDidDispose(() => {
        this.controller.setSidebarVisible(this.viewType, false)
        this.view = undefined
      })
    )

    this.controller.setSidebarVisible(this.viewType, view.visible)
    this.postState()
  }

  private postState(): void {
    if (!this.view) return
    void this.view.webview.postMessage({
      type: 'state',
      state: this.controller.getViewModel(),
    })
  }

  dispose(): void {
    for (const disposable of this.disposables) disposable.dispose()
    this.disposables.length = 0
  }
}
