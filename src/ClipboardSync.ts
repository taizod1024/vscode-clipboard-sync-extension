import * as vscode from "vscode";

/** clipboard-sync-extesnion class */
class ClipboardSync {
  /** application id for vscode */
  public appId = "clipboard-sync";

  /** application name */
  public appName = "Clipboard Sync";

  /** channel on vscode */
  public channel: vscode.OutputChannel;

  /** extension path */
  public extensionPath: string;

  /** constructor */
  constructor() {}

  /** activate extension */
  public activate(context: vscode.ExtensionContext) {
    // init context
    this.channel = vscode.window.createOutputChannel(this.appName, { log: true });
    this.channel.appendLine(`${this.appId} activated`);

    // init vscode
    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.runCmd`, async () => {
        this.extensionPath = context.extensionPath;
        try {
          await this.pushClipboard();
        } catch (reason) {
          this.channel.show();
          clipboardSync.channel.appendLine("**** " + reason + " ****");
        }
      }),
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(`${this.appId}.runCmd`, async () => {
        this.extensionPath = context.extensionPath;
        try {
          await this.pullClipboard();
        } catch (reason) {
          this.channel.show();
          clipboardSync.channel.appendLine("**** " + reason + " ****");
        }
      }),
    );
  }

  /** push clipboard */
  public async pushClipboard() {}

  /** pull clipboard */
  public async pullClipboard() {}
}
export const clipboardSync = new ClipboardSync();
