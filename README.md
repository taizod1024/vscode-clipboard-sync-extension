# Clipboard Sync

Sync clipboard text across signed-in VS Code instances by storing it in a synced VS Code setting.

## Features

- Push the current clipboard text to the cloud by storing it in `clipboard-sync.syncedText`.
- Show a status bar button for clipboard sync actions.
- Notify when the synced setting is updated.
- Pull the cloud clipboard value back into the local clipboard.

## Commands

- `Clipboard Sync: Push Clipboard to the cloud`
- `Clipboard Sync: Pull Clipboard from the cloud`

## Synced Setting

- `clipboard-sync.syncedText`
- `clipboard-sync.sender`

These settings are stored in user settings, so VS Code Settings Sync can propagate them to your other signed-in machines.
