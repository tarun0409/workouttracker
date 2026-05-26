# Workout Tracker

A fully offline, privacy-first workout and activity tracker for iOS and Android. No account required, no cloud sync, no subscriptions — all data lives on your device.

---

## Features

### Workout Logging
- Log exercises with sets, weight (kg), and reps
- Add multiple exercises per session
- Fuzzy autocomplete suggests exercises you've logged before (Levenshtein distance matching)
- Title Case normalization — "bench press" and "Bench Press" are treated as the same exercise
- Equipment selector: Barbell, Dumbbell, Smith Machine, Cable, Bodyweight, Kettlebell, Machine, Band, Other
- Set date of any workout (defaults to today)
- Add and remove sets inline

### Workout History
- Browse all past workouts grouped by date
- Tap a day to see every exercise logged on that day
- Edit any past workout — change exercises, sets, weight, reps, or even the date
- Unsaved changes are protected by a discard confirmation dialog

### Exercise History & PRs
- Tap any exercise to see its complete history across all sessions
- All-time Personal Record (PR) displayed prominently
- Per-session peak weight shown for each date
- Rename an exercise retroactively — updates every past session instantly

### Step Tracking
- **Auto mode (iOS):** Reads from CoreMotion — works even when the app is closed
- **Auto mode (Android):** Reads the step counter sensor since last device reboot
- **Manual mode:** Enter your step count yourself each day
- Daily step goal with a visual ring (configurable)
- Step history over time in the Progress screen

### Progress & Charts
- Weekly step trend chart
- Toggle between step history views

### Data Backup & Restore
- Export all data (workouts + steps + settings) as a single JSON file
- Share it via AirDrop, email, Files, or any share target
- Import a backup file to restore data — useful when migrating phones
- Reset all data option for a clean slate

### Design
- Dark theme throughout
- Fully offline — zero network requests
- No account, no login, no tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 (managed workflow) |
| Language | TypeScript |
| Navigation | React Navigation v7 (Native Stack + Bottom Tabs) |
| Storage | AsyncStorage (on-device) |
| Charts | react-native-chart-kit + react-native-svg |
| Step Sensor | expo-sensors |
| File I/O | expo-file-system v19 |
| Sharing | expo-sharing |
| Document Picker | expo-document-picker |
| Date Picker | @react-native-community/datetimepicker |
| Icons | @expo/vector-icons (Ionicons) |

---

## Installation

There are three ways to run this app. Choose based on your needs:

| Method | Best for | Requires |
|---|---|---|
| [Expo Go](#method-1-expo-go) | Quick preview during development | Laptop on same WiFi |
| [EAS Build — iOS](#method-2-eas-build-ios) | Standalone iPhone app | Apple Developer account ($99/yr) |
| [EAS Build — Android](#method-3-eas-build-android) | Standalone Android app | Nothing extra (free) |

---

## Method 1: Expo Go

Run the app inside the Expo Go container. Good for development — the app reloads live as you change code. **Requires your laptop to be on and on the same WiFi as your phone.**

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [Git](https://git-scm.com/)
- Expo Go installed on your phone:
  - [iOS — App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android — Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 2. Clone and install

```bash
git clone https://github.com/your-username/workout-tracker.git
cd workout-tracker
npm install
```

### 3. Start the dev server

```bash
npx expo start --go --clear
```

### 4. Open on your phone

- **iOS:** Open the Camera app and scan the QR code printed in the terminal
- **Android:** Open the Expo Go app and tap **Scan QR Code**

The app loads immediately. Any code changes you save will hot-reload on your phone automatically.

> **Limitation:** The app only works while your laptop is running the dev server and both devices are on the same network. The app icon appears inside Expo Go, not on your home screen.

---

## Method 2: EAS Build — iOS

Builds a real standalone `.ipa` and installs it directly on your iPhone. Gets its own icon on your home screen, works completely offline, no laptop needed after installation.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [Git](https://git-scm.com/)
- An [Expo account](https://expo.dev/signup) (free)
- An [Apple Developer account](https://developer.apple.com/enroll/) ($99/year) — required by Apple to install apps on physical devices outside the App Store

### 1. Clone and install

```bash
git clone https://github.com/your-username/workout-tracker.git
cd workout-tracker
npm install
```

### 2. Set your bundle identifier

Open `app.json` and replace `com.yourname.workouttracker` with your own reverse-domain identifier (e.g. `com.tarun.workouttracker`). You cannot change this after your first build without losing your app's identity.

```json
"ios": {
  "bundleIdentifier": "com.yourname.workouttracker"
}
```

### 3. Install EAS CLI

```bash
npm install -g eas-cli
```

### 4. Log in to Expo

```bash
eas login
```

### 5. Configure EAS

```bash
eas build:configure
```

Select **iOS** when prompted. This creates an `eas.json` file. Verify it contains a `preview` profile with `"distribution": "internal"`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {}
  }
}
```

### 6. Register your iPhone

```bash
eas device:create
```

This outputs a URL and QR code. **Open the URL on your iPhone** — it installs a small configuration profile that registers your device with Apple. When prompted, go to **Settings → General → VPN & Device Management** to approve it.

### 7. Build

```bash
eas build --platform ios --profile preview
```

On the first run, EAS will ask for your Apple ID and Developer Team. It handles certificates and provisioning profiles automatically — you do not need Xcode.

The build runs in the cloud and takes **10–15 minutes**. A link to track progress is printed in the terminal.

### 8. Install on your iPhone

When the build finishes, EAS prints a QR code and an install link. Open the link on your iPhone and tap **Install**. The app appears on your home screen.

### Updating the app

After making code changes, run the same build command and install the new build:

```bash
eas build --platform ios --profile preview
```

---

## Method 3: EAS Build — Android

Builds a standalone `.apk` and installs it directly on your Android device. No Google Play account needed — Android allows sideloading out of the box.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- [Git](https://git-scm.com/)
- An [Expo account](https://expo.dev/signup) (free)

### 1. Clone and install

```bash
git clone https://github.com/your-username/workout-tracker.git
cd workout-tracker
npm install
```

### 2. Install EAS CLI

```bash
npm install -g eas-cli
```

### 3. Log in to Expo

```bash
eas login
```

### 4. Configure EAS

```bash
eas build:configure
```

Select **Android** when prompted. Make sure your `eas.json` has a `preview` profile that outputs an APK (not an AAB, which is for Play Store):

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### 5. Build

```bash
eas build --platform android --profile preview
```

EAS handles the signing keystore automatically on the first run. The build takes **5–10 minutes**.

### 6. Install on your Android device

When the build finishes, EAS prints a QR code and download link.

1. Open the link on your Android phone to download the `.apk`
2. Tap the downloaded file to install
3. If prompted, go to **Settings → Install unknown apps** and allow installation from your browser
4. Tap **Install**

### Updating the app

```bash
eas build --platform android --profile preview
```

Download and install the new APK the same way — Android will update the existing installation in place.

---

## Local Development

```bash
# Install dependencies
npm install

# Start Expo Go dev server
npx expo start --go --clear

# Type check
npx tsc --noEmit
```

### Project structure

```
src/
├── components/
│   └── ui/               # Shared UI components (EmptyState, StatCard, etc.)
├── constants/
│   └── colors.ts         # Design tokens (dark theme palette)
├── features/
│   ├── activity/         # Step tracking screen
│   ├── progress/         # Charts and history screen
│   ├── settings/         # Settings, backup/restore, reset
│   └── workout/
│       ├── screens/      # WorkoutList, ActiveWorkout, EditWorkout,
│       │                 # AddExercise, DayDetail, ExerciseHistory
│       └── exerciseQueue.ts  # Module-level queue for cross-screen data passing
├── hooks/                # useWorkouts, useSettings, useSteps
├── navigation/           # Stack and tab navigator definitions
├── storage/              # AsyncStorage wrappers (workout, steps, settings, backup)
└── utils/                # Date formatting helpers
```

### Data model

All data is stored locally via AsyncStorage under these keys:

| Key | Contents |
|---|---|
| `@workouts_v1` | Array of workout sessions (exercises + sets) |
| `@steps_v1` | Array of daily step counts |
| `@settings_v1` | User preferences (step mode, daily goal) |
| `@step_baseline` | Baseline sensor reading for step delta calculation |

---

## EAS Free Tier Limits

The Expo free tier includes **30 build minutes per month**. Each build takes roughly:
- iOS: ~15 minutes (~2 free builds/month)
- Android: ~8 minutes (~3 free builds/month)

For more frequent builds, the [EAS Production plan](https://expo.dev/pricing) is $9/month.

---

## License

[MIT](./LICENSE) © 2026 Tarun
