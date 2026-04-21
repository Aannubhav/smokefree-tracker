# SmokeFree Tracker

A mobile app to help you quit smoking by tracking both cigarettes smoked and urges resisted — because every battle counts, not just the ones you lose.

---

## Screenshots

> Dashboard · Analytics · Statistics · History · Settings

---

## Features

### Dashboard
- Log every cigarette with optional trigger and note
- Log urges you successfully resisted with one tap
- See today's count and total money spent at a glance

### Analytics
- Side-by-side count of urges resisted vs cigarettes smoked today
- **Urge Resistance Rate** — percentage of urges you won against
- 7-day dual bar chart comparing urges vs smokes
- Hourly urge distribution chart (when do cravings hit?)
- Full log of today's resisted urges with timestamps and triggers

### Statistics
- Monthly totals: smokes, money spent, daily average
- Weekly trend — are you smoking more or less than last week?
- Hourly smoking pattern chart
- Savings calculator — how much you'd save by cutting back

### History
- Full day-by-day log of every cigarette
- Delete incorrect entries
- Grouped by date with daily totals

### Settings
- Dark / Light mode toggle
- Configure cigarette price per pack and pack size
- Currency selector (₹, $, €, £, ¥)
- Auto-calculates cost per cigarette

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo 51 |
| Navigation | React Navigation (Bottom Tabs + Native Stack) |
| Backend | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | AsyncStorage (theme preference) |
| Icons | Expo Vector Icons (Ionicons) |
| Date handling | date-fns |
| Build | EAS Build (Expo Application Services) |

---

## Project Structure

```
smoking-tracker/
├── App.js                        # Entry point, ThemeProvider + AuthProvider
├── app.json                      # Expo config
├── eas.json                      # EAS Build profiles
├── .github/workflows/
│   └── build-android.yml         # Auto-build APK on push
└── src/
    ├── config/
    │   └── firebase.js           # Firebase init
    ├── context/
    │   ├── AuthContext.js        # Auth state (login, register, logout)
    │   └── ThemeContext.js       # Dark/light theme state
    ├── navigation/
    │   └── AppNavigator.js       # Bottom tab navigator
    ├── screens/
    │   ├── auth/
    │   │   ├── LoginScreen.js
    │   │   └── RegisterScreen.js
    │   ├── DashboardScreen.js    # Log smokes + urges
    │   ├── AnalyticsScreen.js    # Urge analytics
    │   ├── StatsScreen.js        # Smoking statistics
    │   ├── HistoryScreen.js      # Daily history log
    │   └── SettingsScreen.js     # App settings
    ├── services/
    │   └── smokingService.js     # All Firestore read/write logic
    └── theme/
        └── index.js              # Colors, spacing, typography
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Run locally

```bash
git clone https://github.com/Aannubhav/smokefree-tracker.git
cd smokefree-tracker
npm install
npx expo start
```

Scan the QR code with your phone to open in Expo Go.

### Run on web

```bash
npx expo start --web
```

---

## Build Android APK

Builds are automated via GitHub Actions. Every push to `main` triggers a new APK build on Expo's servers.

**Manual trigger:**
1. Go to the **Actions** tab on GitHub
2. Select **Build Android APK**
3. Click **Run workflow**

**Download APK:**
1. Go to [expo.dev](https://expo.dev) → Projects → smokefree-tracker → Builds
2. Download the `.apk` file
3. Install on your Android device (enable "Install unknown apps" in settings first)

---

## Firebase Setup

The app uses Firebase Firestore with the following data structure:

```
users/
└── {userId}/
    ├── settings/prefs          # Price, pack size, currency, display name
    ├── smokes/{smokeId}        # Each cigarette logged
    ├── urges/{urgeId}          # Each resisted urge logged
    └── dailySummary/{date}     # Daily aggregate (count + expense)
```

---

## Environment

Firebase credentials are stored directly in `src/config/firebase.js`. If you fork this repo, replace them with your own Firebase project credentials.

---

## License

MIT
