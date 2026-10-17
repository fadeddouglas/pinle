# iOS build from GitHub (no Mac required)

This repo’s **iOS App Store** Action archives Pinle on a GitHub-hosted Mac and uploads the IPA to App Store Connect. It does **not** submit for review. You finish the listing in the browser, then click Add for Review.

## 1. App Store Connect API key (Windows is fine)

1. Open [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api).
2. Add a key named `Pinle CI`. Role: **Admin** (needed so the job can create a distribution certificate the first time).
3. Download `AuthKey_XXXXXXXXXX.p8`. Apple only lets you download it once. Keep it off git.
4. Note **Key ID** and **Issuer ID** on that page.

## 2. Team ID

On [developer.apple.com/account](https://developer.apple.com/account) open **Membership details**. Copy **Team ID** (10 characters).

## 3. Encode the .p8 in PowerShell

In the folder where you saved the key:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXXXXXXX.p8"))
```

Copy the one-line output. That is the `APP_STORE_CONNECT_KEY` secret.

## 4. GitHub secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Value |
| --- | --- |
| `APP_STORE_CONNECT_KEY_ID` | Key ID from step 1 |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from step 1 |
| `APP_STORE_CONNECT_KEY` | Base64 string from step 3 |
| `APPLE_TEAM_ID` | Team ID from step 2 |
| `MATCH_PASSWORD` | Any long passphrase you invent and save. Used to encrypt signing certs on the `match-certs` branch. |

## 5. Run the job

1. GitHub → **Actions** → **iOS App Store** → **Run workflow** → **Run workflow** on `main`.
2. First run creates signing files and pushes an encrypted `match-certs` branch. Later runs reuse it.
3. When it is green, App Store Connect → Pinle → the 1.0 version should show a build. Processing can take 5–15 minutes.

Then complete screenshots and listing, and click **Add for Review**. Do not click that until the build appears as **Ready to Submit**.
