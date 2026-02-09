#!/bin/bash

# Script to help set up the widget extension files
# This script copies the widget files to the correct location

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIDGET_SOURCE_DIR="$SCRIPT_DIR/BibleVersesWidget"
PROJECT_DIR="$SCRIPT_DIR"

echo "🔧 Widget Setup Script"
echo "======================"
echo ""

# Check if widget extension directory exists in Xcode project
# The widget extension is typically created at: ios/BibleVersesApp/BibleVersesWidget/
WIDGET_TARGET_DIR="$PROJECT_DIR/BibleVersesApp/BibleVersesWidget"

if [ ! -d "$WIDGET_TARGET_DIR" ]; then
    echo "⚠️  Widget extension target directory not found."
    echo "   Expected location: $WIDGET_TARGET_DIR"
    echo ""
    echo "📝 Please follow these steps in Xcode first:"
    echo "   1. Open Xcode: xed $PROJECT_DIR/BibleVersesApp.xcworkspace"
    echo "   2. File → New → Target → Widget Extension"
    echo "   3. Name it 'BibleVersesWidget'"
    echo "   4. Uncheck 'Include Configuration Intent'"
    echo "   5. Click Finish"
    echo ""
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Widget extension target found at: $WIDGET_TARGET_DIR"
echo ""

# Backup existing files if they exist
if [ -f "$WIDGET_TARGET_DIR/BibleVersesWidget.swift" ]; then
    echo "📦 Backing up existing BibleVersesWidget.swift..."
    cp "$WIDGET_TARGET_DIR/BibleVersesWidget.swift" "$WIDGET_TARGET_DIR/BibleVersesWidget.swift.backup"
fi

if [ -f "$WIDGET_TARGET_DIR/Info.plist" ]; then
    echo "📦 Backing up existing Info.plist..."
    cp "$WIDGET_TARGET_DIR/Info.plist" "$WIDGET_TARGET_DIR/Info.plist.backup"
fi

# Copy widget files
echo "📋 Copying widget files..."
cp "$WIDGET_SOURCE_DIR/BibleVersesWidget.swift" "$WIDGET_TARGET_DIR/BibleVersesWidget.swift"
cp "$WIDGET_SOURCE_DIR/Info.plist" "$WIDGET_TARGET_DIR/Info.plist"

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "📝 Next steps in Xcode:"
echo "   1. Open Xcode: xed $PROJECT_DIR/BibleVersesApp.xcworkspace"
echo "   2. In Xcode, verify the files are in the widget extension target:"
echo "      - Select BibleVersesWidget.swift in the project navigator"
echo "      - Check 'Target Membership' in File Inspector"
echo "      - Ensure 'BibleVersesWidget' target is checked"
echo "   3. Configure App Groups (see WIDGET_SETUP.md step 4)"
echo "   4. Build and run!"
echo ""
