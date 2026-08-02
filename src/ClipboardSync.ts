import * as vscode from "vscode";

/** clipboard-sync-extesnion class */
class ClipboardSync {
  /** application id for vscode */
  private readonly appId = "clipboard-sync";

  /** setting key for synced clipboard text */
  private readonly syncedTextKey = "syncedText";

  /** setting key for sender id */
  private readonly senderKey = "sender";

  /** application name */
  private readonly appName = "Clipboard Sync";

  /** push clipboard command id */
  private readonly pushClipboardCommand = `${this.appId}.pushClipboard`;

  /** pull clipboard command id */
  private readonly pullClipboardCommand = `${this.appId}.pullClipboard`;

  /** status bar quick pick command id */
  private readonly showClipboardActionsCommand = `${this.appId}.showClipboardActions`;

  /** channel on vscode */
  private channel: vscode.LogOutputChannel;

  /** status bar item */
  private statusBarItem: vscode.StatusBarItem;

  /** extension context */
  private context: vscode.ExtensionContext;

  /** constructor */
  constructor() {}

  /** activate extension */
  public activate(context: vscode.ExtensionContext) {
    this.context = context;

    this.initializeOutputChannel();
    this.registerStatusBarItems();
    this.registerCommands();
    this.registerConfigurationWatcher();
  }

  /** push clipboard */
  private async pushClipboard() {
    const clipboardText = await vscode.env.clipboard.readText();
    const byteLength = this.getByteLength(clipboardText);
    const sender = this.getLocalSender();

    await this.getConfiguration().update(this.senderKey, sender, vscode.ConfigurationTarget.Global);
    await this.getConfiguration().update(this.syncedTextKey, clipboardText, vscode.ConfigurationTarget.Global);

    this.logAndNotify(`pushed clipboard to synced settings`, byteLength);
  }

  /** pull clipboard */
  private async pullClipboard() {
    const syncedText = this.getSyncedText();
    const byteLength = this.getByteLength(syncedText);

    await vscode.env.clipboard.writeText(syncedText);
    this.logAndNotify(`pulled synced settings into clipboard`, byteLength);
  }

  /** get synced text from vscode settings */
  private getSyncedText(): string {
    return this.getConfiguration().get<string>(this.syncedTextKey, "");
  }

  /** handle synced setting updates */
  private async handleSyncedSettingChange() {
    const syncedText = this.getSyncedText();
    const sender = this.getSyncedSender();
    const byteLength = this.getByteLength(syncedText);

    if (this.isLocalUpdate(sender)) {
      this.channel.appendLine("suppressed notification for local clipboard sync update");
      return;
    }

    this.channel.appendLine(`synced clipboard setting updated (${byteLength} bytes)`);

    const pullAction = "Pull";
    const message = syncedText ? `Clipboard Sync: synced clipboard text was updated (${byteLength} bytes). Pull now?` : `Clipboard Sync: synced clipboard text was cleared (${byteLength} bytes). Pull now?`;
    const selection = await vscode.window.showInformationMessage(
      message,
      {
        detail: this.formatPreviewDetail(syncedText),
      },
      pullAction,
    );

    if (selection === pullAction) {
      await this.pullClipboard();
    }
  }

  /** determine whether the setting change was initiated locally */
  private isLocalUpdate(sender: string): boolean {
    if (!sender) {
      return false;
    }

    return sender === this.getLocalSender();
  }

  /** get utf-8 byte length for display */
  private getByteLength(text: string): number {
    return Buffer.byteLength(text, "utf8");
  }

  /** get the extension configuration */
  private getConfiguration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.appId);
  }

  /** get sender value from synced settings */
  private getSyncedSender(): string {
    return this.getConfiguration().get<string>(this.senderKey, "");
  }

  /** get sender id for this local VS Code instance */
  private getLocalSender(): string {
    return vscode.env.machineId;
  }

  /** create and log to the extension output channel */
  private initializeOutputChannel() {
    this.channel = vscode.window.createOutputChannel(this.appName, { log: true });
    this.channel.appendLine(`${this.appId} activated`);
  }

  /** register status bar items */
  private registerStatusBarItems() {
    this.statusBarItem = this.createStatusBarItem(100, "Clipboard Sync", "Clipboard Sync actions", this.showClipboardActionsCommand);

    this.context.subscriptions.push(this.statusBarItem);
  }

  /** register commands */
  private registerCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(this.showClipboardActionsCommand, async () => this.executeCommand(() => this.showClipboardActions())),
      vscode.commands.registerCommand(this.pushClipboardCommand, async () => this.executeCommand(() => this.pushClipboard())),
      vscode.commands.registerCommand(this.pullClipboardCommand, async () => this.executeCommand(() => this.pullClipboard())),
    );
  }

  /** show clipboard actions in a quick pick */
  private async showClipboardActions() {
    const clipboardText = await vscode.env.clipboard.readText();
    const syncedText = this.getSyncedText();

    type ClipboardActionItem = vscode.QuickPickItem & {
      action?: () => Promise<void>;
    };

    const items: ClipboardActionItem[] = [
      {
        label: "$(arrow-up) Push Clipboard to the cloud",
        detail: this.formatPreviewDetail('"' + clipboardText + '"'),
        action: () => this.pushClipboard(),
      },
      {
        label: "$(arrow-down) Pull Clipboard from the cloud",
        detail: this.formatPreviewDetail('"' + syncedText + '"'),
        action: () => this.pullClipboard(),
      },
      {
        label: "",
        kind: vscode.QuickPickItemKind.Separator,
      },
      {
        label: "$(gear) Settings",
        action: async () => {
          await vscode.commands.executeCommand("workbench.action.openSettings", "clipboardsync.");
        },
      },
    ];

    const selection = await vscode.window.showQuickPick(items, {
      title: "Clipboard Sync",
      placeHolder: "Select a clipboard sync action",
    });

    if (!selection?.action) {
      return;
    }

    await selection.action();
  }

  /** watch synced setting changes */
  private registerConfigurationWatcher() {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(event => {
        if (!event.affectsConfiguration(`${this.appId}.${this.syncedTextKey}`)) {
          return;
        }

        void this.handleSyncedSettingChange();
      }),
    );
  }

  /** create a status bar item for an extension command */
  private createStatusBarItem(priority: number, text: string, tooltip: string, command: string): vscode.StatusBarItem {
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, priority);
    item.name = this.appName;
    item.text = text;
    item.tooltip = tooltip;
    item.command = command;
    item.show();
    return item;
  }

  /** run a command and route any error to the output channel */
  private async executeCommand(callback: () => Promise<void>) {
    try {
      await callback();
    } catch (reason) {
      this.channel.show();
      this.channel.appendLine(`**** ${String(reason)} ****`);
    }
  }

  /** show a consistent operation log and notification */
  private logAndNotify(message: string, byteLength: number) {
    this.channel.appendLine(`clipboard ${message} (${byteLength} bytes)`);
    void vscode.window.showInformationMessage(`Clipboard Sync: ${message} (${byteLength} bytes).`);
  }

  /** get first line from text for compact previews */
  private getFirstLine(text: string): string {
    const [firstLine = ""] = text.trim().split(/\r?\n/, 1);
    return firstLine;
  }

  /** format quick pick and notification detail with first-line preview */
  private formatPreviewDetail(text: string): string {
    const firstLine = this.getFirstLine(text);
    return firstLine || "(empty)";
  }
}
export const clipboardSync = new ClipboardSync();
