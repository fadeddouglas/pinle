# Pinle store listing

Use this copy in App Store Connect. Google Play is later — ignore Play Console, the 1024×500 feature graphic, and the Android APK for now. Do not submit until a signed iOS build is uploaded.

## Identity

- Name: Pinle
- Subtitle: Daily closest to the pin
- Bundle / application id: `io.pinle.app`
- Category: Games / Sports
- Age rating: Everyone
- Website: https://pinle.io
- Privacy: https://pinle.io/privacy.html
- Support: https://pinle.io/support.html
- Contact: hello@pinle.io

## Description

Pinle is a daily closest-to-the-pin game.

Each UTC day you get one par 3 and three shots. Aim, pick a club, and land it by the cup. Closest to the pin wins the day.

Share a score card to Messages, Instagram, WhatsApp, and anywhere else your phone can send a picture. Scores stay on this device. No account required.

Play the same game on the web at https://pinle.io.

## Keywords (App Store)

golf, daily, wordle, closest to the pin, par 3, sports, puzzle

## What’s new (1.0)

First release. Daily hole, three shots, shareable score card.

## Marketing images

- Header (1920×1080), only if App Store Connect asks for an event or custom page header: `store/marketing/header-1920x1080.png`

Search results on the App Store use the 1024 app icon from the iOS build plus the name and subtitle. There is no search banner to upload.

## Screenshots

Upload PNGs from `store/screenshots/iphone-6.3/` into App Store Connect’s **required iPhone 6.3"** slot (Dynamic Island, medium display). Each file is **1206 × 2622**.

If you are on the **6.9"** slot instead, use `store/screenshots/iphone-6.9/` (**1290 × 2796**).

1. `01-landing.png` — PLAY
2. `02-aim.png` — tee and HUD
3. `03-result.png` — score card with SEND CARD / COPY CARD

## Android debug APK

This Windows machine does not have a JDK or Android SDK, so a debug APK was not compiled here. Install [Android Studio](https://developer.android.com/studio), open the `android/` folder, then:

```
npm run android:debug
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Android signing

1. Copy `android/key.properties.example` to `android/key.properties`.
2. Create a keystore (once) and keep it off git:

```
keytool -genkeypair -v -keystore store/keystore/pinle-release.keystore -alias pinle -keyalg RSA -keysize 2048 -validity 10000
```

3. Fill `storePassword`, `keyPassword`, `keyAlias`, and `storeFile` in `android/key.properties`.
4. Release bundle: `cd android && ./gradlew bundleRelease`

## iOS build

You do not need a Mac for the binary. Follow [store/ios-ci.md](ios-ci.md): add App Store Connect API secrets, then run the **iOS App Store** GitHub Action. That uploads an IPA; it does not submit for review.
