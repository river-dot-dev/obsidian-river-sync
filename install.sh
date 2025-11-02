#!/usr/bin/env bash

# Install River Obsidian Plugin
# Copies plugin files to the Obsidian vault

set -e

PLUGIN_DIR="/home/dustin/vault/Vault/.obsidian/plugins/river-sync"
SOURCE_DIR="$(dirname "$0")"

echo "📦 Installing River Obsidian Plugin..."

# Create plugin directory if it doesn't exist
mkdir -p "$PLUGIN_DIR"

# Copy files
cp "$SOURCE_DIR/main.js" "$PLUGIN_DIR/main.js"
cp "$SOURCE_DIR/manifest.json" "$PLUGIN_DIR/manifest.json"

echo "✅ Plugin installed to: $PLUGIN_DIR"
echo ""
echo "Files copied:"
echo "  - main.js"
echo "  - manifest.json"
echo ""
echo "📝 Next steps:"
echo "  1. Reload Obsidian or restart the app"
echo "  2. Enable the River Sync plugin in Settings → Community plugins"
echo "  3. Click 'Connect to River' in the plugin settings"
