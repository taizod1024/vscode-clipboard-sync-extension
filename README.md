# Clipboard Sync

Sync clipboard text across signed-in VS Code instances by storing it in a synced VS Code setting.

## Features

- Show a single status bar entry (`clipboard Sync`) and open a Quick Pick for actions.
- Push the current clipboard text into `clipboard-sync.syncedText`.
- Save sender identity in `clipboard-sync.sender` to detect who pushed the update.
- When synced text is updated by another sender, show a confirmation dialog to pull now.
- Pull synced text back into local clipboard on demand.
- Show byte length in operation notifications.

## Commands

- `Clipboard Sync: Push Clipboard`
- `Clipboard Sync: Pull Clipboard`

## Usage

1. Click `clipboard Sync` in the status bar.
2. Select `Push Clipboard` to upload your current clipboard text.
3. On another machine (or window), when an external sender updates the text, choose `Pull` in the confirmation dialog.
4. You can also run `Clipboard Sync: Pull Clipboard` manually from the Command Palette.

## Synced Settings

- `clipboard-sync.syncedText`
- `clipboard-sync.sender`

This setting is stored in user settings, so VS Code Settings Sync can propagate it to your other signed-in machines.
