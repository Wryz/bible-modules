# iOS Widget Extension Setup Instructions

## Prerequisites
- Xcode installed
- CocoaPods installed (`sudo gem install cocoapods`)

## Steps to Add Widget Extension to Xcode Project

1. **Open the Xcode project:**
   ```bash
   cd ios
   xed BibleVersesApp.xcodeproj
   ```

2. **Add Widget Extension Target:**
   - In Xcode, go to `File` → `New` → `Target`
   - Select `Widget Extension`
   - Click `Next`
   - Product Name: `BibleVersesWidget`
   - Organization Identifier: `com.bibleversesapp` (or your identifier)
   - Language: `Swift`
   - Uncheck "Include Configuration Intent" (we're using static configuration)
   - Click `Finish`
   - When prompted, click `Activate` to activate the scheme

3. **Replace Generated Files:**
   ✅ **DONE** - The widget files have been automatically updated!
   - The `BibleVersesWidget.swift` file has been replaced with the custom implementation
   - The `Info.plist` is already configured correctly
   - The `BibleVersesWidgetBundle.swift` has been updated to only include the main widget
   
   **Note**: Since Xcode uses file system synchronization for the widget extension, files in `ios/BibleVersesWidget/` are automatically included. The custom widget code is now in place!

4. **Configure App Groups:**
   - Select the main app target (`BibleVersesApp`)
   - Go to `Signing & Capabilities` tab
   - Click `+ Capability`
   - Add `App Groups`
   - Create/select group: `group.com.bibleversesapp`
   - Repeat for the widget extension target (`BibleVersesWidget`)
   - Make sure both targets use the same App Group ID

5. **Add WidgetDataManager to Main App:**
   ✅ **DONE** - The WidgetDataManager files are already properly configured!
   - `WidgetDataManager.swift` and `WidgetDataManager.m` are in `ios/BibleVersesApp/`
   - They're already added to the `BibleVersesApp` target (not the widget extension)
   - The files are properly referenced in the Xcode project
   
   **Note**: The files are already set up correctly and will be compiled with the main app target.

6. **Update Deployment Target:**
   - Select the widget extension target
   - Go to `Build Settings`
   - Set `iOS Deployment Target` to `iOS 14.0` or higher (required for WidgetKit)

7. **Install Pods:**
   ```bash
   cd ios
   pod install
   ```

8. **Build and Run:**
   - Select the `BibleVersesApp` scheme
   - Build and run the app
   - After the app runs, you can add the widget from the home screen

## Testing the Widget

1. Run the app on a device or simulator
2. Long press on the home screen
3. Tap the `+` button in the top-left corner
4. Search for "Bible Verses"
5. Select the widget size (Small, Medium, or Large)
6. Tap `Add Widget`

The widget will display the current Bible verse that's loaded in the app.
