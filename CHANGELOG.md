# Changelog

All notable changes to the River Sync plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-14

### Added

- Initial release of River Sync for Obsidian
- OAuth 2.0 authentication flow with one-click "Connect to River" setup
- Email syncing from River staging ground
- SMS/MMS syncing with media support
- AI-enhanced content processing
- Automatic topic detection and tagging
- Content type detection (note/event/task/mixed)
- Configurable sync intervals with automatic background syncing
- Manual sync command via ribbon icon or command palette
- Connection testing command
- Customizable inbox folder for note organization
- Tag prefix configuration for auto-generated tags
- YAML frontmatter support
- Customizable date formatting for note filenames
- Sync on startup option

### Features

- One-click OAuth flow with automatic polling for authorization
- Clean, minimal settings UI with connection status indicators
- Graceful error handling with user-friendly notifications
- Offline detection and connection management
- Real-time sync service integration
- Separate API endpoints for email and SMS services
- Persistent settings storage

### Technical

- Built with TypeScript
- Uses Obsidian Plugin API
- Secure token storage in plugin settings
- Production API endpoints configured by default
- esbuild for fast compilation
- Modular architecture with separate client, sync, and note creation services
