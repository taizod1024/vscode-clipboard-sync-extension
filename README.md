# Clipboard Sync

Sync clipboard text across signed-in VS Code instances by storing it in a synced VS Code setting.

## Features

- Show a single status bar entry (`Clipboard Sync`) for quick sync actions.
- Push the current clipboard text into `clipboard-sync.text`.
- Save sender identity in `clipboard-sync.sender` to track which machine pushed the update.
- **Automatic detection**: When synced text is updated by another machine, automatically show a confirmation dialog with `Pull` and `Cancel` options.
- **Manual sync**: Click the status bar button to manually decide between `Pull`, `Push`, or `Cancel` (includes local vs remote logic).
- Pull synced text back into local clipboard on demand.
- Show byte length in operation notifications.
- Ensure VS Code Settings Sync completes before applying clipboard logic (1-second wait).

## Commands

- `Clipboard Sync: Push Clipboard to the cloud`
- `Clipboard Sync: Pull Clipboard from the cloud`

## Usage

### Automatic Sync (Background)

When another machine updates the synced clipboard text, you'll automatically see a confirmation dialog:

- Select `Pull` to import the synced text into your local clipboard.
- Select `Cancel` to dismiss the dialog and keep your current clipboard.

### Manual Sync (Status Bar Click)

1. Click `Clipboard Sync` in the status bar.
2. Choose one of the following:
   - **Push**: Upload your current clipboard text to sync across machines.
   - **Pull**: Download and import synced text from another machine.
   - **Cancel**: Dismiss the dialog.
3. After any action, Settings Sync is triggered to ensure your changes propagate immediately.

### Alternative: Command Palette

You can also trigger actions from the Command Palette (Ctrl+Shift+P / Cmd+Shift+P).

## Synced Settings

- `clipboard-sync.text` - The synchronized clipboard text across machines.
- `clipboard-sync.sender` - Machine ID of the sender (used to track ownership).

These settings are stored in user settings and propagated across your signed-in VS Code instances via Settings Sync.
