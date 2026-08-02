import * as vscode from "vscode";
import { clipboardSync } from "./ClipboardSync";

// extension entrypoint
export function activate(context: vscode.ExtensionContext) {
  clipboardSync.activate(context);
}
export function deactivate() {}
