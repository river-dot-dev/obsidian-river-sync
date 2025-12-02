# River Sync for Obsidian

Email yourself quick notes and ideas throughout the day. River captures everything and syncs to Obsidian with AI-enhanced tagging.

## ⚠️ Requirements

This plugin connects to [River](https://river.dev), a paid service for managing your digital inbox.

**Pricing:**

- $5/month or $50/year - unlimited messages
- [Sign up at river.dev](https://river.dev)

The plugin itself is free and open source. You need a River account to use it.

## Features

- 📧 **Email syncing** - Automatically pull emails from your River inbox
- 📱 **SMS/MMS syncing** - Sync text messages and attachments
- 🤖 **AI enhancement** - Messages are processed and formatted by AI
- 🏷️ **Auto-tagging** - Smart topic detection and linking
- 📅 **Event detection** - Automatically detect calendar events, add them to Google Calendar
- 🔄 **Automatic syncing** - Configurable intervals or manual sync
- 🔐 **OAuth authentication** - One-click secure connection

## Installation

### From Community Plugins (Recommended)

1. Open Obsidian Settings
2. Navigate to **Community Plugins** → **Browse**
3. Search for **"River Sync"**
4. Click **Install**, then **Enable**

### Manual Installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/dustinlyons/obsidian-river-sync/releases)
2. Create folder: `YourVault/.obsidian/plugins/river-sync/`
3. Copy both files to that folder
4. Reload Obsidian (Cmd/Ctrl + R)
5. Enable "River Sync" in Settings → Community Plugins

## Setup

1. Open **Settings** → **River Sync**
2. Click **"Connect to River"**
3. Sign in to your River account in the browser
4. Click **"Authorize"**
5. The plugin will automatically configure itself
6. Done! Messages will start syncing

## Configuration

### Sync Settings

- **Sync on startup**: Automatically sync when Obsidian opens
- **Sync interval**: Minutes between automatic syncs (0 = manual only)

### Organization

- **Inbox folder**: Where notes are created (e.g., `Inbox/`)
- **Tag prefix**: Prefix for auto-generated tags (e.g., `river/`)
- **Add frontmatter**: Include YAML metadata in notes
- **Date format**: Customize filename date format

## How It Works

River Sync connects to your River staging ground and pulls pending messages. Each message is:

1. **AI-enhanced** - Content is cleaned and formatted
2. **Tagged** - Topics are automatically detected
3. **Linked** - Related nodes are suggested
4. **Organized** - Saved to your inbox folder

### Example Note

```markdown
---
source: email
from: john@example.com
received: 2025-01-14T10:30:00Z
contentType: task
---

# Email from john@example.com - Jan 14, 10:30 AM

Can you review the Q4 report by Friday?

**Topics:** #river/work #river/reports

**Detected:** Task
**Due:** Friday, Jan 17
```

## Commands

- **Sync notes from River** - Manually trigger sync
- **Test River connection** - Verify connection status

## Troubleshooting

### "Not connected to River"

1. Go to Settings → River Sync
2. Click "Disconnect" if shown
3. Click "Connect to River"
4. Complete OAuth flow in browser

### "Sync failed"

- Check your internet connection
- Verify your River subscription is active
- Try "Test River connection" command
- Check the console (Cmd/Ctrl + Shift + I) for errors

### Messages not appearing

- Ensure messages are in your River staging ground
- Check the "Inbox folder" path is correct
- Verify sync interval is set (or manually sync)
- Check River dashboard for pending messages

## Privacy & Security

- **Authentication**: OAuth 2.0 with secure tokens
- **Data flow**: Plugin → River servers → Your vault
- **No third parties**: No data sent to anyone except River
- **Open source**: Full source code available for audit

## Support

- **Website**: [river.dev](https://river.dev)
- **Documentation**: [river.dev/docs](https://river.dev/docs)
- **Issues**: [GitHub Issues](https://github.com/dustinlyons/obsidian-river-sync/issues)
- **Email**: support@river.dev

## Development

Want to contribute or build locally?

```bash
# Clone the repo
git clone https://github.com/dustinlyons/obsidian-river-sync.git
cd obsidian-river-sync

# Install dependencies
npm install

# Build
npm run build

# The built files (main.js, manifest.json) can be copied to your vault
```

## Roadmap

- [ ] Custom templates for different message types
- [ ] Bulk operations (archive, delete, move)
- [ ] Search and filter in staging ground
- [ ] Attachment preview

## License

MIT License - See [LICENSE](LICENSE) file

---

Made with ❤️ by [Dustin Lyons](https://github.com/dustinlyons)

**River** is a product of River Technologies, Inc.
