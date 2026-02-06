# IoW - Inventory on Wheels

React Native inventory management app for EDA52 barcode scanner devices.

## Features

- ✅ Upload Excel/CSV master data files
- ✅ Scan barcodes (searches Item Barcode column)
- ✅ Enter item codes (searches Item Code column)
- ✅ Add quantities with expiry dates (Day/Month/Year selection)
- ✅ Export to PDF or Excel
- ✅ Password protection for master data
- ✅ Offline support

## Quick Start (Test with Expo Go)

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Scan QR code with Expo Go app on your phone
```

## Build APK for Android

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

If you don't have an Expo account, create one at: https://expo.dev/signup

### Step 3: Configure Project

```bash
eas build:configure
```

This will ask you some questions. Accept the defaults or customize as needed.

### Step 4: Build APK

```bash
eas build --platform android --profile preview
```

This will:
1. Upload your project to Expo's build servers
2. Build the APK (takes 10-20 minutes)
3. Give you a download link when complete

### Step 5: Download APK

When the build is complete:
1. Go to the link provided in terminal OR visit https://expo.dev
2. Navigate to your project's builds
3. Download the APK file
4. Rename it to `IoW.apk` if needed

### Step 6: Install on Device

1. Transfer `IoW.apk` to your Android device
2. Open the APK file to install
3. You may need to enable "Install from unknown sources" in device settings

## Build Commands Summary

| Command | Description |
|---------|-------------|
| `npx expo start` | Start development server |
| `eas build --platform android --profile preview` | Build APK |
| `eas build --platform android --profile production` | Build AAB (for Play Store) |

## File Naming Convention

Name your source files as: `Warehouse - Department.xlsx`

Examples:
- `Shaab - Food.xlsx`
- `Shaab - HPCI.xlsx`
- `Tajiyat - HPCII.xlsx`

The filename becomes the report title when exporting.

## Password

The master data password is: `IoWP@ssw0rd`

## Color Scheme

- Primary: #4b7c70
- Background: #ccd0d0
- Text: #000100
- Accent: #112d47

## Troubleshooting

### "Module not found" error
```bash
rm -rf node_modules
npm install
```

### Clear cache
```bash
npx expo start --clear
```

### Build fails
Make sure you have:
1. Valid Expo account
2. Correct app.json configuration
3. All dependencies installed

## Support

For issues with the app, check:
1. EDA52 is in keyboard wedge mode
2. Excel file has "Item Code" column
3. Dates are in the future
