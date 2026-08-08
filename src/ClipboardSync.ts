import * as vscode from "vscode";

/** clipboard-sync-extension class */
class ClipboardSync {
  /** application id for vscode */
  private readonly appId = "clipboard-sync";

  /** setting key for clipboard text */
  private readonly textKey = "text";

  /** setting key for sender id */
  private readonly senderKey = "sender";

  /** application name */
  private readonly appName = "Clipboard Sync";

  /** status bar sync command id */
  private readonly syncClipboardCommand = `${this.appId}.syncClipboard`;

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
    this.watchConfigurationChanges();
  }

  /** push clipboard */
  private async pushClipboard() {
    const clipboardText = await vscode.env.clipboard.readText();
    const byteLength = this.getByteLength(clipboardText);
    const sender = this.getLocalSender();

    const configuration = this.getConfiguration();

    await configuration.update(this.senderKey, sender, vscode.ConfigurationTarget.Global);
    await configuration.update(this.textKey, clipboardText, vscode.ConfigurationTarget.Global);

    this.logAndNotify(`pushed to the cloud`, byteLength, clipboardText);
  }

  /** get synced text from vscode settings */
  private getSyncedText(): string {
    const configuration = this.getConfiguration();
    return configuration.get<string>(this.textKey, "");
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
    this.statusBarItem = this.createStatusBarItem(100, "$(clippy) Clipboard Sync", "Click to sync clipboard", this.syncClipboardCommand);

    this.context.subscriptions.push(this.statusBarItem);
  }

  /** register commands */
  private registerCommands() {
    this.context.subscriptions.push(vscode.commands.registerCommand(this.syncClipboardCommand, async () => await this.executeCommand(() => this.handleStatusBarClick())));
  }

  /** track whether we're currently handling a config change to avoid race conditions */
  private isHandlingConfigChange = false;

  /** watch configuration changes and trigger sync dialog if from remote */
  private watchConfigurationChanges() {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(async event => {
        if (!event.affectsConfiguration(this.appId) || this.isHandlingConfigChange) {
          return;
        }

        const syncedText = this.getSyncedText();
        const sender = this.getSyncedSender();
        const localSender = this.getLocalSender();

        // Only trigger if text exists and is from remote
        if (syncedText && sender && sender !== localSender) {
          this.isHandlingConfigChange = true;
          try {
            await this.showSyncDialog();
          } finally {
            this.isHandlingConfigChange = false;
          }
        }
      }),
    );
  }

  /** handle status bar click with the new sync flow */
  private async handleStatusBarClick() {
    this.isHandlingConfigChange = true;
    try {
      await this.runSettingsSync();
      await this.showSyncDialog();
    } finally {
      this.isHandlingConfigChange = false;
    }
  }

  /** show sync dialog and handle user choice */
  private async showSyncDialog() {
    const syncedText = this.getSyncedText();
    const sender = this.getSyncedSender();
    const localSender = this.getLocalSender();

    if (!syncedText || !sender || sender === localSender) {
      await this.pushClipboard();
      await this.runSettingsSync();
      return;
    }

    const preview = this.formatPreviewDetail(syncedText);
    const message = `Clipboard Sync: synced text available - ${preview}`;
    const selection = await vscode.window.showInformationMessage(message, "Pull", "Push", "Cancel");

    if (selection === "Pull") {
      await this.pullSyncedText(syncedText);
      await this.runSettingsSync();
    } else if (selection === "Push") {
      await this.pushClipboard();
      await this.runSettingsSync();
    }
  }

  /** import the synced clipboard text into the local clipboard */
  private async pullSyncedText(syncedText: string) {
    await vscode.env.clipboard.writeText(syncedText);

    const configuration = this.getConfiguration();
    await configuration.update(this.senderKey, this.getLocalSender(), vscode.ConfigurationTarget.Global);

    const byteLength = this.getByteLength(syncedText);
    this.logAndNotify(`pulled from the cloud`, byteLength, syncedText);
  }

  /** trigger VS Code settings sync before applying local/remote clipboard logic */
  private async runSettingsSync() {
    const candidates = ["workbench.action.sync", "workbench.userDataSync.actions.syncNow", "workbench.userDataSync.actions.turnOn"];

    for (const commandId of candidates) {
      try {
        await vscode.commands.executeCommand(commandId);
        // wait for settings sync to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      } catch {
        // ignore unsupported command ids and continue to the next candidate
      }
    }
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
  private logAndNotify(message: string, byteLength: number, text?: string) {
    const preview = this.formatPreviewDetail(text ?? "");
    this.channel.appendLine(`clipboard ${message} (${byteLength} bytes): ${preview}`);
    void vscode.window.showInformationMessage(`Clipboard Sync: ${message} - ${preview}`);
  }

  /** get first line from text for compact previews */
  private getFirstLine(text: string): string {
    const normalized = text.replace(/\r\n/g, "\n");
    const [firstLine = ""] = normalized.split(/\n/, 1);
    return firstLine.trim();
  }

  /** format notification detail with a readable preview */
  private formatPreviewDetail(text: string): string {
    if (!text) {
      return "(empty)";
    }

    const firstLine = this.getFirstLine(text);
    if (!firstLine) {
      return "(empty)";
    }

    if (firstLine.length <= 120) {
      return firstLine;
    }

    return `${firstLine.slice(0, 117)}...`;
  }
}
export const clipboardSync = new ClipboardSync();
