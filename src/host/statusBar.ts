import * as vscode from 'vscode'
import type { DashboardController } from './controller'

export class StatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem
  private readonly disposables: vscode.Disposable[] = []

  constructor(private readonly controller: DashboardController) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    )
    this.item.name = 'NewAPI Dashboard'
    this.item.command = 'lyNewApi.openDashboard'

    this.disposables.push(
      controller.onDidChange(() => this.update()),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('lyNewApi.statusBar.enabled')) {
          this.update()
        }
      })
    )
    this.update()
  }

  private isEnabled(): boolean {
    return vscode.workspace
      .getConfiguration('lyNewApi')
      .get<boolean>('statusBar.enabled', true)
  }

  update(): void {
    if (!this.isEnabled()) {
      this.item.hide()
      return
    }

    const { text, tooltip } = this.controller.getStatusBarText()
    this.item.text = text
    const markdown = new vscode.MarkdownString(tooltip)
    markdown.supportThemeIcons = true
    this.item.tooltip = markdown
    this.item.show()
  }

  dispose(): void {
    for (const disposable of this.disposables) disposable.dispose()
    this.disposables.length = 0
    this.item.dispose()
  }
}
