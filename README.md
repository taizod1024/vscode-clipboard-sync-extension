# Clipboard Sync

Sync clipboard text across signed-in VS Code instances by storing it in a synced VS Code setting.

## Features

- Push the current clipboard text into the `clipboard-sync.syncedText` user setting.
- Show a status bar button for pushing clipboard text.
- Notify when the synced setting is updated.
- Pull the synced setting value back into the local clipboard.

## Commands

- `Clipboard Sync: Push Clipboard to the cloud`
- `Clipboard Sync: Pull Clipboard from the cloud`

## Synced Setting

- `clipboard-sync.syncedText`
- `clipboard-sync.sender`

These settings are stored in user settings, so VS Code Settings Sync can propagate them to your other signed-in machines.
