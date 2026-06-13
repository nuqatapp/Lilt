# Lilt Daily Tracker - Developer Guide

## Overview

Lilt is a React Native Expo habit tracking app for iOS and Android. Users log daily activities (eating, exercising, sleeping, etc.) and view analytics on their dashboard.

**Current Version:** 0.0.1  
**Last Updated:** June 2024  
**Status:** Pre-submission (App Store/Google Play)

---

## Architecture

### Folder Structure

```
artifacts/daily-tracker/
├── app/                 # Navigation & screens (Expo Router)
│   ├── (tabs)/         # Tab-based navigation
│   ├── _layout.tsx     # Root layout with providers
│   └── index.tsx       # Home screen
├── components/         # Reusable UI components
│   ├── HabitGrid.tsx          # Grid of habits to log
│   ├── DashboardView.tsx      # Analytics dashboard
│   ├── AddCustomHabitModal.tsx # Create new habit
│   ├── BarChartView.tsx       # Bar chart
│   ├── LineChartView.tsx      # Line chart
│   ├── ErrorBoundary.tsx      # Error handling
│   └── ...other components
├── context/            # State management (React Context)
│   ├── HabitsContext.tsx      # Habit definitions & custom habits
│   ├── LogContext.tsx         # Activity logs & analytics
│   ├── SettingsContext.tsx    # Theme, language, user preferences
│   ├── PeopleContext.tsx      # Multi-user support
│   └── ...other contexts
├── hooks/              # Custom React hooks
│   ├── useColors.ts    # Get current theme colors
│   └── ...other hooks
├── constants/          # App-wide constants
│   └── colors.ts       # Color palette (light/dark themes)
├── assets/             # Images, fonts, icons
├── scripts/            # Build & deployment scripts
├── package.json        # Dependencies
├── app.json            # Expo config
└── tsconfig.json       # TypeScript config
```

### Core Data Structures

#### Habit
Represents a trackable activity (Exercise, Sleep, Eating, etc.)

```typescript
interface Habit {
  id: string;                              // Unique identifier
  name: string;                            // Display name
  icon: string;                            // MaterialCommunityIcons icon name
  color: string;                           // Hex color
  group: "Body" | "Productivity" | "Home" | "Lifestyle";
  subHabits: SubHabit[];                   // Optional sub-categories
  isCustom?: boolean;                      // true if user created it
}
```

#### LogEntry
Record of when a user logged an activity.

```typescript
interface LogEntry {
  id: string;                    // Unique identifier
  habitId: string;               // Reference to Habit.id
  habitName: string;             // Cached for readability
  subLabel?: string;             // Optional sub-habit
  notes?: string;                // Optional user notes
  timestamp: string;             // ISO format: "2024-06-13T14:30:00Z"
  personId?: string;             // Multi-user support
}
```

#### SubHabit
Sub-category within a habit (e.g., "Cardio" under "Exercise").

```typescript
interface SubHabit {
  id: string;                    // Unique identifier
  label: string;                 // Display name
  icon: string;                  // MaterialCommunityIcons icon name
  color: string;                 // Hex color
}
```

---

## State Management

### HabitsContext (`context/HabitsContext.tsx`)

**Manages:** Habit definitions, favorites, custom habits

**Features:**
- Loads custom habits from AsyncStorage on app start
- Combines DEFAULT_HABITS (shipped) with custom habits
- Supports per-user favorites (via PeopleContext)
- Loading state prevents dashboard rendering before data loads

**Key Functions:**
```typescript
const { 
  habits,           // All habits (DEFAULT + custom)
  favoriteIds,      // Current user's favorite habit IDs
  addCustomHabit,   // Create new habit
  removeHabit,      // Delete custom habit
  isLoading         // true while loading from storage
} = useHabits();
```

**Storage Key:** `@trace_custom_habits_v1`

**Common Bugs (FIXED in refactored version):**
- ❌ Dashboard rendered empty because loading was async and untracked
- ✅ Fixed by adding `isLoading` state

### LogContext (`context/LogContext.tsx`)

**Manages:** Activity logs, date queries, habit counting

**Features:**
- Loads logs from AsyncStorage on app start
- Provides querying by date, date range, and habit
- Auto-prunes to MAX_LOGS (5000) to prevent unbounded growth
- Per-user filtering for multi-user support

**Key Functions:**
```typescript
const {
  logs,                  // All logs for current user
  addLog,                // Log an activity
  getLogsForDate,        // Get logs for specific date
  getLogsForRange,       // Get logs between start & end dates
  getHabitCount,         // Count habit occurrences in date range
  isLoading              // true while loading from storage
} = useLogs();
```

**Storage Key:** `@trace_logs_v1`  
**Max Entries:** 5000 (auto-prune oldest)

**Common Bugs (FIXED in refactored version):**
- ❌ Dashboard displayed empty/wrong data while loading
- ❌ Every new log saved entire array (expensive)
- ✅ Fixed by adding `isLoading` and optimizing save logic

---

## Setup & Development

### Prerequisites

- Node.js 18+
- pnpm (not npm or yarn)
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for simulator) or physical device
- Android: Android Studio or physical device

### Installation

```bash
# Clone the repo
git clone https://github.com/nuqatapp/Lilt.git
cd Lilt

# Install dependencies
pnpm install

# Navigate to app
cd artifacts/daily-tracker
```

### Running Locally

```bash
# Start development server
pnpm run dev

# In Expo Go app (iOS/Android), scan QR code
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

### Building for Testing

```bash
# Build for EAS (Expo Application Services)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Download and install on device via TestFlight (iOS) or Google Play Internal Testing (Android)
```

---

## Testing Checklist (Before App Store Submission)

### Critical Functionality

- [ ] **App Launch**
  - [ ] App starts without crashing
  - [ ] Splash screen displays correctly
  - [ ] No console errors in Xcode/Android Studio

- [ ] **Habit Logging**
  - [ ] Can tap a habit and log it
  - [ ] Logged activity appears in "Logged" banner
  - [ ] Haptic feedback triggers on successful log
  - [ ] Can log same habit multiple times

- [ ] **Custom Habits**
  - [ ] Can open "Add Custom Habit" modal
  - [ ] Can select icon from grid
  - [ ] Can select color from swatches
  - [ ] Can add new habit with custom name/icon/color
  - [ ] Custom habit appears in habit grid immediately
  - [ ] Can delete custom habit (swipe or delete button)

- [ ] **Dashboard**
  - [ ] Dashboard loads with habit counts
  - [ ] Charts display correctly (bar chart, line chart)
  - [ ] Switching between "Log" and "Dashboard" tabs works
  - [ ] Data persists after closing and reopening app

- [ ] **Data Persistence**
  - [ ] Log a habit, close app completely, reopen → habit still logged
  - [ ] Add custom habit, close app, reopen → custom habit still exists
  - [ ] Mark habit as favorite, close app, reopen → still favorite
  - [ ] Add 100+ logs, close app, reopen → all logs still present

- [ ] **Date Navigation**
  - [ ] Can view logs for different dates
  - [ ] Dashboard shows correct data for selected date range
  - [ ] Switching dates updates chart data

### Error Handling

- [ ] **Crash Recovery**
  - [ ] If app crashes, ErrorBoundary shows error screen
  - [ ] "Try Again" button restarts app without force quit
  - [ ] In dev mode, error details visible

- [ ] **Storage Errors** (simulate by disconnecting from storage)
  - [ ] App doesn't crash if AsyncStorage fails
  - [ ] User can still log (data lost on app close, but no crash)
  - [ ] Error logged to console

- [ ] **Memory Limits**
  - [ ] Add 5000+ logs (approach MAX_LOGS limit)
  - [ ] App doesn't crash
  - [ ] Performance remains acceptable

### UI/UX

- [ ] **Theming**
  - [ ] Light theme displays correctly
  - [ ] Dark theme displays correctly
  - [ ] Colors are readable (sufficient contrast)
  - [ ] Text is not cut off on small screens

- [ ] **Responsiveness**
  - [ ] Portrait and landscape modes work
  - [ ] iPad layout is acceptable
  - [ ] Safe area insets respected (notch, home indicator)

- [ ] **Keyboard**
  - [ ] Adding custom habit, keyboard appears
  - [ ] Keyboard dismisses when tapping outside input
  - [ ] No "jank" when keyboard appears/disappears

- [ ] **Accessibility**
  - [ ] All buttons are tappable (>44x44 pt)
  - [ ] Text is readable size (minimum 14pt)
  - [ ] Color is not only way to convey information
  - [ ] Screen reader works (VoiceOver/TalkBack)

### Performance

- [ ] **App Launch Time**
  - [ ] From tap on home screen to fully interactive: <3 seconds

- [ ] **Scrolling**
  - [ ] Habit grid scrolls smoothly
  - [ ] Charts render without jank
  - [ ] Logs list scrolls smoothly

- [ ] **Memory**
  - [ ] Monitor memory in Xcode/Android Studio
  - [ ] No memory leaks after repeated actions (log, delete, navigate)

### Privacy & Security

- [ ] **Data Privacy**
  - [ ] No sensitive data in console logs
  - [ ] No crash logs sent to external services without permission
  - [ ] Clear data button works (Settings -> Clear All Data)

- [ ] **Permissions**
  - [ ] App doesn't ask for unnecessary permissions
  - [ ] Camera, location, contacts NOT requested (not needed)

---

## Debugging Guide

### Common Issues & Solutions

#### **Dashboard Shows Empty Data**

**Symptoms:** 
- Dashboard loads but shows no habit counts or charts
- Data appears after 2-3 seconds

**Root Cause:** 
- AsyncStorage loading is async but UI rendered before data loaded

**Solution:** 
- Check `isLoading` state in HabitsContext and LogContext
- Wrap dashboard with loading check:
  ```typescript
  const { isLoading } = useHabits();
  if (isLoading) return <LoadingScreen />;
  ```

#### **Data Doesn't Persist After App Close**

**Symptoms:** 
- Log a habit, close app, reopen → habit not logged anymore
- Custom habit disappears after restart

**Root Cause:** 
- AsyncStorage save failed silently
- App closed before save completed

**Debug Steps:**
1. Check console for "Storage error" messages
2. Verify AsyncStorage write permissions:
   ```bash
   adb logcat | grep AsyncStorage  # Android
   ```
3. Check device storage is not full
4. Ensure not running in restricted sandbox mode

**Solutions:**
- Add error toast when save fails:
  ```typescript
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    Toast.show("Failed to save data");
  }
  ```

#### **App Crashes When Logging**

**Symptoms:** 
- App force-closes after tapping a habit
- Xcode shows error in console

**Debug Steps:**
1. Check console error message
2. Look for errors in LogContext.addLog():
   - JSON serialization failure?
   - habitId mismatch?
   - timestamp format invalid?
3. Check HabitGrid for null/undefined habit references

#### **Custom Habits Not Appearing**

**Symptoms:** 
- Add custom habit, modal closes, habit not in grid
- No error message

**Debug Steps:**
1. Check HabitsContext.addLog() is called
2. Verify AsyncStorage save completed
3. Check if habit.isCustom = true
4. Verify habit is in customHabits array:
   ```typescript
   const { habits } = useHabits();
   console.log("All habits:", habits);
   console.log("Custom only:", habits.filter(h => h.isCustom));
   ```

#### **Charts Show Wrong Data**

**Symptoms:** 
- Bar chart shows wrong counts
- Line chart doesn't match logs

**Debug Steps:**
1. Check date range calculation in LogContext.getLogsForRange()
2. Verify logs have correct timestamp format (ISO string)
3. Check habitId matches between LogEntry and Habit
4. Log the filtered data:
   ```typescript
   const logs = getLogsForRange(start, end);
   console.log("Logs in range:", logs);
   console.log("Count:", logs.length);
   ```

---

## App Store Submission

### Checklist

**Before Submitting:**

- [ ] Version number bumped (app.json)
- [ ] All critical test cases pass
- [ ] No console errors or warnings in release build
- [ ] Privacy policy written and accessible
- [ ] Permissions justified (check app.json)
- [ ] App icon and splash screen present
- [ ] Screenshots prepared (5-8 per platform)
- [ ] Description, keywords, release notes written

**iOS Specific:**

- [ ] Build signed with distribution certificate
- [ ] Provisioning profile configured
- [ ] No hardcoded API keys or secrets
- [ ] Privacy manifest completed (new requirement)
- [ ] Push notifications enabled (if using)

**Android Specific:**

- [ ] APK/AAB built in release mode
- [ ] Signed with upload key
- [ ] versionCode incremented
- [ ] targetSdkVersion is current (Android 14+)

### Known Limitations

- Multi-user support is basic (only per-person favorites differentiate)
- No cloud sync (data stays on device)
- No notifications yet
- Cannot add sub-habits (only pre-defined ones)
- No habit reminders

---

## Performance Metrics

### Target Specifications

| Metric | Target | Current |
|--------|--------|---------|
| App Launch | <3s | ? |
| First Interactive | <5s | ? |
| Habit Log Response | <200ms | ? |
| Memory (idle) | <50MB | ? |
| Storage (app) | <20MB | ? |

### Optimization Tips

1. **Lazy load charts** - only render visible charts
2. **Memo components** - prevent unnecessary re-renders
3. **Batch logs saves** - don't save on every log, batch by 10
4. **Prune old logs** - keep only 1 year of data
5. **Use FlatList** - for long lists instead of ScrollView

---

## Future Improvements

- [ ] Cloud sync (Google Drive, iCloud)
- [ ] Habit reminders/notifications
- [ ] Habit streaks
- [ ] Monthly/yearly reports
- [ ] Export data as CSV
- [ ] Dark mode toggle (currently automatic)
- [ ] Add sub-habits dynamically
- [ ] Habit categories/filtering
- [ ] Social sharing

---

## Support & Contact

For bugs, feature requests, or questions:
- GitHub Issues: https://github.com/nuqatapp/Lilt/issues
- Email: developer@nuqat.app

---

## Changelog

### v0.0.1 (Current)
- Initial release
- Habit logging
- Dashboard with charts
- Custom habits
- Theme support
- Multi-user favorites

---

**Last Updated:** June 13, 2024  
**Maintainer:** Areej (nuqatapp)
