# Lilt Testing & Deployment Guide

This guide walks you through:
1. Downloading the refactored files
2. Updating your GitHub repo
3. Testing locally in Replit
4. Preparing for App Store submission

---

## STEP 1: Download Refactored Files

You have three refactored files ready to download:

1. **HabitsContext.tsx** - Fixed async loading, error handling
2. **LogContext.tsx** - Fixed dashboard data issues, optimized saves
3. **README.md** - Comprehensive documentation

These files are in `/mnt/user-data/outputs/` folder.

**Download them to your computer now.**

---

## STEP 2: Update Your GitHub Repo

### Option A: Using GitHub Web Interface (Easiest)

1. Go to https://github.com/nuqatapp/Lilt
2. Navigate to `artifacts/daily-tracker/context/`
3. Click on `HabitsContext.tsx`
4. Click the pencil icon (Edit)
5. Delete all content and paste new content from `HabitsContext.tsx`
6. Scroll down, add commit message: `refactor: improve async loading and error handling`
7. Click "Commit changes"

8. Repeat for `LogContext.tsx`

### Option B: Using Git Command Line (Advanced)

```bash
# Navigate to your local repo
cd ~/Lilt

# Pull latest changes from GitHub
git pull origin main

# Copy refactored files to correct locations
cp ~/Downloads/HabitsContext.tsx artifacts/daily-tracker/context/
cp ~/Downloads/LogContext.tsx artifacts/daily-tracker/context/

# Check what changed
git status

# Stage changes
git add artifacts/daily-tracker/context/

# Commit with clear message
git commit -m "refactor: improve async loading and error handling in context providers"

# Push to GitHub
git push origin main
```

---

## STEP 3: Pull Changes into Replit

Once files are in GitHub, pull them into your Replit environment:

1. **Open Replit** → your Lilt project
2. **Open Terminal** (bottom panel)
3. Run:
   ```bash
   git pull origin main
   ```
4. Confirm changes downloaded:
   ```bash
   git log --oneline | head -1
   ```
   Should show your new commit message

---

## STEP 4: Test Locally in Replit

### 4.1 Start Dev Server

```bash
cd artifacts/daily-tracker
pnpm run dev
```

Wait for Expo to start. You should see:
```
› Expo Go requires Expo SDK 54. You are using 54.0.27
› Ready on http://localhost:8081
```

### 4.2 Test on Device

**iOS:**
- Open Expo Go app
- Scan QR code shown in terminal
- App should load and run

**Android:**
- Open Expo Go app
- Scan QR code shown in terminal
- App should load and run

---

## STEP 5: Detailed Testing Checklist

Work through each section. Mark off as you go.

### ✅ APP STARTUP TEST

- [ ] App launches without crashing
- [ ] Splash screen shows correctly
- [ ] Home screen loads
- [ ] No red error screens
- [ ] No yellow warning banners

**If fails:** Check `adb logcat` (Android) or Xcode console (iOS) for errors

---

### ✅ LOADING STATE TEST

**What we fixed:** Dashboard now waits for data to load before rendering

- [ ] Open app
- [ ] Watch dashboard for 2-3 seconds
- [ ] Dashboard shows habit counts (not blank)
- [ ] Charts appear after loading (not loading spinner forever)

**Expected behavior:**
1. App starts
2. Brief loading indicator (if very first launch)
3. Dashboard renders with data

**If fails:**
- Check that `isLoading` state is working
- Verify AsyncStorage can read data
- Check console for storage errors

---

### ✅ HABIT LOGGING TEST

- [ ] Tap a habit (e.g., "Exercise")
- [ ] Activity logs successfully
- [ ] Green "Logged" banner appears
- [ ] Haptic feedback (vibration) triggers
- [ ] Banner disappears after 3 seconds
- [ ] Can log same habit again immediately

**Log 5 activities total (any habits):**
- [ ] Habit 1: ___________________
- [ ] Habit 2: ___________________
- [ ] Habit 3: ___________________
- [ ] Habit 4: ___________________
- [ ] Habit 5: ___________________

**If fails:**
- Check LogContext.addLog() is called
- Verify AsyncStorage write permissions
- Check console for errors

---

### ✅ CUSTOM HABIT TEST

**Create a new custom habit:**

1. [ ] Scroll to bottom of habit grid
2. [ ] Tap "+ Add Custom Habit" button
3. [ ] Modal opens (bottom sheet)
4. [ ] Text input for habit name is focused (keyboard visible)

**In the modal:**
5. [ ] Type habit name: "**Reading**"
6. [ ] Tap icon selector (shows grid of icons)
7. [ ] Scroll through icons
8. [ ] Select an icon (e.g., "book" icon)
9. [ ] Selected icon highlighted in blue
10. [ ] Tap color selector (shows colored swatches)
11. [ ] Select a color (e.g., blue)
12. [ ] Selected color has border/highlight
13. [ ] Preview shows your habit with chosen icon and color
14. [ ] Tap "Add Habit" button
15. [ ] Modal closes

**After closing modal:**
16. [ ] New "Reading" habit appears in habit grid
17. [ ] Icon matches what you selected
18. [ ] Color matches what you selected
19. [ ] Habit grid scrolled to show new habit

**Delete the custom habit:**
20. [ ] Long press or swipe on "Reading" habit
21. [ ] Delete option appears
22. [ ] Tap delete
23. [ ] Habit removed from grid

**If fails:**
- Check AddCustomHabitModal opens
- Verify habit saves to AsyncStorage
- Check HabitsContext.addCustomHabit() is called

---

### ✅ DATA PERSISTENCE TEST

**This is critical** - data must survive app restart

1. [ ] Log 3 habits right now
2. [ ] Go to home screen (don't close app)
3. [ ] Verify habits are in dashboard
4. [ ] **Completely close the app** (swipe up in app switcher)
5. [ ] Wait 5 seconds
6. [ ] Tap app icon to reopen
7. [ ] App launches
8. [ ] **Dashboard shows the 3 activities you logged**
9. [ ] Counts match (if you logged "Exercise" 3 times, count shows 3)

**Advanced persistence test:**
10. [ ] Force quit app (kill process in Settings)
11. [ ] Reopen
12. [ ] Data still there

**If fails:**
- Check AsyncStorage is saving correctly
- Verify LOGS_KEY matches between save and load
- Check console for "Storage error" messages

---

### ✅ DASHBOARD TEST

**Charts and analytics:**

- [ ] Dashboard tab shows habit counts
- [ ] Bar chart displays (shows colored bars)
- [ ] Line chart displays (shows lines and dots)
- [ ] Charts have labels and legends
- [ ] Numbers on charts match actual log count

**Switching tabs:**
- [ ] Tap "Log Activity" tab → Log view shows
- [ ] Tap "Dashboard" tab → Dashboard shows
- [ ] Switching is smooth (no delays)

**Date navigation (if available):**
- [ ] Can view different dates
- [ ] Charts update for selected date
- [ ] Logs shown match selected date

**If fails:**
- Check LogContext.getHabitCount() returns correct numbers
- Verify LogContext.getLogsForRange() works
- Check chart components (BarChartView, LineChartView)

---

### ✅ ERROR RECOVERY TEST

**Test that app handles errors gracefully** (doesn't crash)

**Simulate storage error (advanced):**
1. Add a bad JSON to AsyncStorage (corrupt data)
2. Restart app
3. App should still load (with default data)
4. No crash screen

**If app crashes:**
- Check ErrorBoundary is wrapped around app
- Verify JSON parsing is in try/catch

---

### ✅ UI/UX TEST

- [ ] Text is readable (not too small)
- [ ] Buttons are tappable (>44x44 points)
- [ ] Colors have good contrast
- [ ] Text not cut off on small screens
- [ ] Layout looks good in both portrait and landscape
- [ ] Safe area respected (notch, home indicator)

**On different phone sizes:**
- [ ] iPhone SE (small screen)
- [ ] iPhone 15 (regular)
- [ ] iPad (large screen) - if testing

---

### ✅ PERFORMANCE TEST

**App responsiveness:**

1. [ ] Tap habit → logs instantly (< 200ms)
2. [ ] Switch tabs → smooth (no jank/stutter)
3. [ ] Scroll habit grid → smooth
4. [ ] Dashboard charts load quickly

**Memory check:**
1. Log 100 habits
2. Check device memory (Settings)
3. App uses reasonable memory (< 100MB)

**If slow:**
- Check for console errors
- Monitor CPU in Xcode
- Look for infinite re-renders

---

## STEP 6: Before App Store Submission

### Final Checklist

- [ ] All tests above pass ✓
- [ ] No console errors or warnings
- [ ] App doesn't crash on any test
- [ ] Data persists correctly
- [ ] Performance is acceptable

### Build for Testing

```bash
cd artifacts/daily-tracker

# Build for iOS TestFlight
eas build --platform ios --profile preview

# Build for Android internal testing
eas build --platform android --profile preview
```

### Submit to App Stores

**iOS App Store:**
1. Go to https://appstoreconnect.apple.com/
2. Create new app entry
3. Upload build via Xcode
4. Fill in app details, screenshots, description
5. Submit for review

**Google Play Store:**
1. Go to https://play.google.com/console/
2. Create new app
3. Upload AAB file
4. Fill in app details, screenshots, description
5. Submit for review

---

## TROUBLESHOOTING

### Q: "Storage error" message in console

**A:** AsyncStorage save failed. Check:
- Device storage not full
- App permissions not restricted
- AsyncStorage library compatible with React Native version

### Q: Dashboard shows empty but app doesn't crash

**A:** `isLoading` not being checked. Verify:
- HabitsProvider returns `isLoading: true` while loading
- Components check `isLoading` before rendering data

### Q: Custom habit doesn't appear after adding

**A:** Save failed silently. Check:
- AsyncStorage write permissions
- JSON serialization succeeded
- habitId is unique

### Q: Data lost after force quit

**A:** AsyncStorage save didn't complete. Fix by:
- Awaiting AsyncStorage.setItem()
- Adding error handling with retry logic

---

## Quick Reference

### Key Files Modified

```
artifacts/daily-tracker/context/
├── HabitsContext.tsx  ← MODIFIED
├── LogContext.tsx     ← MODIFIED
├── SettingsContext.tsx
├── PeopleContext.tsx
└── ...
```

### Key Fixes

| Issue | File | Fix |
|-------|------|-----|
| Dashboard empty on load | HabitsContext.tsx | Added `isLoading` state |
| Dashboard shows wrong data | LogContext.tsx | Added `isLoading` state |
| Data loss on close | Both | Improved error handling |

---

## Next Steps

1. ✅ Download the 3 refactored files
2. ✅ Update GitHub repo
3. ✅ Pull into Replit
4. ✅ Run locally and test
5. ✅ Build for App Store
6. ✅ Submit for review

---

## Questions?

If you encounter issues:
1. Check the README.md troubleshooting section
2. Look at console logs for error messages
3. Review the comments in refactored files
4. Test one feature at a time (isolate the problem)

Good luck! 🚀
