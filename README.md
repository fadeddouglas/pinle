# Pinle

Daily closest-to-the-pin. One hole, three shots.

Play at [pinle.io](https://pinle.io/). Privacy: [pinle.io/privacy.html](https://pinle.io/privacy.html). Support: [pinle.io/support.html](https://pinle.io/support.html).

```bash
npm install
npm run dev
```

## Native apps

The same Vite build is packaged with Capacitor for Google Play and the App Store (`io.pinle.app`). Store listing copy and signing notes live in [store/listing.md](store/listing.md).

```bash
npm run cap:sync
npm run cap:android
```

A debug APK needs Android Studio (JDK + Android SDK). iOS needs a Mac or the `iOS build` GitHub Action. This Windows machine cannot compile an IPA.
