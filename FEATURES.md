# Bible Verses App - Features Documentation

## Overview

A comprehensive React Native app for displaying Bible verses with iOS widget support, featuring search, collections, chat interface, and customizable scheduling.

## Core Features

### 1. Home Screen
- **Current Verse Display**: Shows the verse currently displayed in the widget
- **Verse History**: Displays the last 10 verses that have been shown
- **Scheduled Verses**: Shows upcoming verses scheduled for the widget
- **Auto-refresh**: Automatically updates when scheduled verses become due

### 2. Search Functionality
- **Verse Reference Search**: Enter references like "John 3:16" or "Genesis 1:1"
- **Text Search**: Search through Bible text by keywords or phrases
- **Quick Actions**: Schedule verses or add to collections directly from search results

### 3. Chat Interface
- **Natural Language Queries**: Ask questions about verses, collections, or scheduling
- **Verse Discovery**: Chat can find and display verses based on your questions
- **Smart Responses**: Provides contextual help for using app features
- **Verse Cards**: Displays found verses with action buttons

### 4. Collections
- **Create Collections**: Organize verses into custom collections
- **Manage Verses**: Add verses to collections from search or chat
- **View Collections**: Browse and view all verses in a collection
- **Delete Collections**: Long-press to delete collections

### 5. Verse Scheduling
- **Schedule Verses**: Choose specific dates/times for verses to appear in widget
- **Automatic Updates**: Widget automatically displays scheduled verses at the right time
- **Queue Management**: View and manage your scheduled verse queue

### 6. Widget Settings
- **Refresh Frequency**: Choose how often the widget updates:
  - **Hourly**: New verse every hour
  - **Daily**: New verse every day
  - **Custom**: Set custom hours between updates
- **Auto-scheduling**: Automatically schedules next verses based on your preference

## Data Storage

### Offline Bible Data
- Bible text stored locally in JSON format
- Located in `src/data/bible-sample.json`
- **Note**: Replace with complete Bible text for production use

### Persistent Storage
- Uses `@react-native-async-storage/async-storage` for local data
- Stores:
  - Displayed verse history
  - Scheduled verses
  - Collections
  - Widget settings
  - Current verse

### App Groups (iOS)
- Shares data between main app and widget extension
- Group ID: `group.com.bibleversesapp`
- Enables widget to access scheduled verses

## Architecture

### Services
- **BibleService**: Handles Bible data access and searching
- **StorageService**: Manages all persistent storage operations
- **ChatService**: Processes chat messages and finds verses
- **SchedulingService**: Manages verse scheduling and widget updates

### Components
- **VerseCard**: Reusable component for displaying verses
- **Navigation**: Bottom tab navigation with 5 main screens

### Hooks
- **useVerseScheduling**: Hook for managing scheduled verses
- **useBibleVerse**: Hook for fetching Bible verses (legacy, can be updated)

## iOS Widget

### Widget Extension
- Displays current scheduled verse
- Updates based on user's refresh frequency setting
- Supports Small, Medium, and Large widget sizes
- Automatically refreshes when new verse is scheduled

### Widget Setup
See `ios/WIDGET_SETUP.md` for detailed setup instructions.

## Adding Complete Bible Text

To add the complete Bible:

1. Obtain Bible text in JSON format matching the structure in `src/data/bible-sample.json`
2. Replace `BIBLE_DATA` in `src/services/bibleService.ts` with your complete data
3. Or load from JSON file:
   ```typescript
   import bibleData from '../data/bible.json';
   BibleService.bibleData = bibleData.books;
   ```

## Future Enhancements

- AI-powered chat using GPT or similar
- Multiple Bible translations
- Verse of the day from external APIs
- Sharing verses with others
- Reading plans
- Notes and highlights
- Cross-device sync
