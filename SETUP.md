# Bible Verses App - Setup Guide

## Project Overview

This is a React Native TypeScript app that displays Bible verses using iOS widgets.

## Prerequisites

- Node.js >= 20
- Xcode (for iOS development)
- CocoaPods (`sudo gem install cocoapods`)
- React Native CLI

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install iOS dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Set up iOS Widget Extension:**
   Follow the instructions in `ios/WIDGET_SETUP.md` to add the widget extension to your Xcode project.

## Running the App

### iOS
```bash
npm run ios
```

Or open in Xcode:
```bash
cd ios
xed BibleVersesApp.xcworkspace
```

### Android
```bash
npm run android
```

## Project Structure

```
├── src/
│   ├── hooks/
│   │   └── useBibleVerse.ts      # Hook for fetching Bible verses
│   ├── native/
│   │   └── WidgetDataManager.ts  # Native module interface for widget updates
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── ios/
│   ├── BibleVersesApp/           # Main iOS app
│   │   ├── WidgetDataManager.swift  # Native module for sharing data
│   │   └── WidgetDataManager.m
│   ├── BibleVersesWidget/        # Widget extension files
│   │   ├── BibleVersesWidget.swift
│   │   └── Info.plist
│   └── WIDGET_SETUP.md           # Widget setup instructions
└── App.tsx                        # Main app component
```

## Features

- Display Bible verses in the app
- iOS widget support for home screen display
- Automatic widget updates when verse changes
- TypeScript for type safety

## Next Steps

1. Complete the iOS widget setup (see `ios/WIDGET_SETUP.md`)
2. Add complete Bible text to `src/services/bibleService.ts` or load from JSON file
3. Test all features: search, chat, collections, and scheduling
4. Customize widget appearance if desired

## Features

- **Home Screen**: View current verse, history, and scheduled verses
- **Search**: Find verses by reference or text search
- **Chat**: Natural language interface for verse discovery
- **Collections**: Organize verses into custom collections
- **Scheduling**: Schedule verses for widget display
- **Settings**: Customize widget refresh frequency

See [FEATURES.md](./FEATURES.md) for detailed feature documentation.
