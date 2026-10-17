# Pinle store listing

Use this copy in Google Play Console and App Store Connect. Do not submit until the developer accounts and a signed build are ready.

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

## Short description (Play, 80 characters)

Daily closest-to-the-pin. One hole. Three shots. New par 3 every day.

## Description

Pinle is a daily closest-to-the-pin game.

Each UTC day you get one par 3 and three shots. Aim, pick a club, and land it by the cup. Closest to the pin wins the day.

Share a score card to Messages, Instagram, WhatsApp, and anywhere else your phone can send a picture. Scores stay on this device. No account required.

Play the same game on the web at https://pinle.io.

## Keywords (App Store)

golf, daily, wordle, closest to the pin, par 3, sports, puzzle

## What’s new (1.0)

First release. Daily hole, three shots, shareable score card.

## Screenshots

Phone-size captures live in `store/screenshots/`. Play wants at least 2 phone screenshots. App Store wants 6.5-inch iPhone images (1242×2688 or 1284×2778).

Suggested set:

1. Landing — PLAY
2. Tee and aim HUD
3. Result card with SEND CARD / COPY CARD

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

This Windows machine cannot compile an IPA. On a Mac:

```
npm run cap:sync
npx cap open ios
```

Or run the `iOS build` GitHub Action after adding these secrets:

- `APPSTORE_ISSUER_ID`
- `APPSTORE_CERTIFICATE_BASE64`
- `APPSTORE_CERTIFICATE_PASSWORD`
- `APPSTORE_PROVISION_BASE64`
- `APPLE_TEAM_ID`
