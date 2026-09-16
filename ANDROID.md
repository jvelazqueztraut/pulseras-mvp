# The APK — building it on a laptop

The Android build wraps the static Next.js export in [Capacitor](https://capacitorjs.com/),
producing a single `.apk` that **contains the whole app**. Install it on a phone
and the UI loads from the package; Bluetooth Low Energy still needs the device
radio, but no web server is required.

Capacitor bundles `out/` into the APK and serves it from `https://localhost` via
Android's `WebViewAssetLoader`. That is a real secure origin, not `file://`,
which matters because the export's root-absolute `/_next/...` URLs resolve
correctly (see the comment in `next.config.ts`).

---

## 1. One-time setup on the build machine

Needed only to produce an APK. Nobody needs any of this to run the web app.

### JDK 21

Windows:

```bash
winget install --id EclipseAdoptium.Temurin.21.JDK
```

Set `JAVA_HOME` to the install directory. The Android Gradle Plugin needs 17 or
newer. Android Studio also bundles a JDK, at
`C:\Program Files\Android\Android Studio\jbr`.

### Android SDK

Easiest via Android Studio, which installs the SDK, platform-tools and
build-tools together and can open `android/` directly:

```bash
winget install --id Google.AndroidStudio
```

Command line only: install the `commandlinetools` package. It must be unpacked
to `<SDK>\cmdline-tools\latest\` — the tools resolve the SDK root by walking up
from their own location, and any other layout fails. Then:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

Called by full path on purpose: nothing puts `cmdline-tools\latest\bin` on
`PATH`, and this is the only time you need `sdkmanager`.

Two things that bite here:

- **Temurin does not put `java` on `PATH`** unless you ask it to, so
  `sdkmanager.bat` relies entirely on `JAVA_HOME`. The installer sets that at
  *machine* scope, which means a terminal opened before the JDK install cannot
  see it. Open a fresh one.
- **`sdkmanager` warns that it is deprecated** in favour of `android sdk
  install`. Ignore it if `sdkmanager` works.

Set `ANDROID_HOME` to the SDK directory. `build:apk` also checks
`ANDROID_SDK_ROOT` and the default install locations, and writes
`android/local.properties` for Gradle itself — it never calls `sdkmanager`, so
`PATH` does not matter to the build.

### The release keystore

Create this **once**, then keep it safe and backed up:

```bash
keytool -genkeypair -v -keystore pulseras-release.keystore -alias pulseras -keyalg RSA -keysize 4096 -validity 10000
```

Then write `android/keystore.properties` — gitignored, and it must stay that
way. Copy `android/keystore.properties.example`:

```properties
storeFile=C:/path/to/pulseras-release.keystore
storePassword=...
keyAlias=pulseras
keyPassword=...
```

> **Do not lose this file.** Android only permits an in-place upgrade when the
> new APK carries the same signature as the installed one. Without the original
> key, every future update becomes uninstall-then-reinstall.

For CI, set `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` instead.

---

## 2. Building

```bash
npm run build:apk
```

The APK lands in `dist/Pulseras-<version>.apk`.

| Flag | Effect |
|---|---|
| *(none)* | Signed release APK. Requires a keystore. |
| `--debug` | Debug-signed APK, no keystore needed. Quick on-device try. |
| `--version X.Y.Z` | Build that exact version. |
| `--bump` | Bump the patch version before building. |
| `--skip-web` | Reuse the existing `out/`, run only the native steps. |

`--version` and `--bump` are mutually exclusive, and both write the new value
back to `.env` — so the web build and the APK cannot drift apart. Either form
works and npm forwards both intact:

```bash
npm run build:apk -- --version 0.1.1
npm run build:apk -- --debug
```

The script checks the toolchain and the signing config **before** building
anything, so a missing JDK is a one-line message rather than a Gradle stack
trace four minutes in. The first Gradle run downloads Gradle and the AGP and
takes a while; later runs are quick.

### What it does, in order

1. Verifies the JDK, the Android SDK and the signing config.
2. Builds the static export with `NEXT_PUBLIC_NATIVE=true`.
3. Writes `android/app/version.properties` from `NEXT_PUBLIC_VERSION`.
4. `cap sync android` — copies `out/` into `android/app/src/main/assets/public`.
5. `gradlew assembleRelease` (or `assembleDebug` with `--debug`).
6. Copies the APK to `dist/` under a versioned name.

`npm run android:apk` is an alias for `npm run build:apk -- --debug`.

### Versioning

`versionName` is the semver from `.env`, set by `--version` or `--bump`.
`versionCode` is that semver flattened to an integer
(`major*10000 + minor*100 + patch`), so the scheme caps minor and patch at 99.
Both come from `version.properties`, which the build script generates — do not
hand-edit it.

Android **refuses to install a lower `versionCode` over a higher one**. `--bump`
can never cause this; `--version` can, so the build warns when the version you
asked for is lower than the last APK built in the checkout.

---

## 3. Installing on a phone

1. Copy the APK to the device (USB, Drive, `adb install -r dist/Pulseras-<version>.apk`).
2. Android may ask whether the file manager may install unknown apps. Allow it.
3. Grant Nearby devices / Bluetooth permissions when asked.
4. Launch Pulseras and tap **Start Scanning**.

Real BLE scanning needs a **physical device**. Android emulators typically have
no BLE radio.

### Verify the UI is self-contained

Turn on **airplane mode**, force-close the app, relaunch. The Home, Settings,
and details screens must still render. BLE discovery will not work with the
radio off; that is expected.

---

## 4. Native project files

`android/` is generated by `npx cap add android`, but it is **committed and
hand-edited** — treat it as source. `cap sync` only replaces web assets and
plugin wiring, so it will not clobber these:

| File | Why it differs from the template |
|---|---|
| `app/src/main/java/app/pulseras/mvp/MainActivity.java` | Registers `PulserasAdvertiserPlugin` |
| `app/src/main/java/app/pulseras/mvp/PulserasAdvertiserPlugin.java` | Peripheral advertising adapter |
| `app/src/main/AndroidManifest.xml` | BLE permissions, including `neverForLocation` |
| `app/src/main/res/values/styles.xml` | Dark splash instead of Capacitor placeholder art |
| `app/src/main/res/values/colors.xml` | **Added.** The template's `AppTheme` references `colorPrimary` / `colorPrimaryDark` / `colorAccent` but ships no `colors.xml` |
| `app/build.gradle` | Version from `version.properties`, release signing, explicit `androidx.core` |
| `.gitignore` | Keystore rules uncommented — the template would have committed signing keys |

Running `npx cap add android` again would overwrite all of it.

### Deliberately not done

Pulseras is a portrait phone app, not a kiosk. The APK does **not** lock
landscape, force immersive mode, or set `FLAG_KEEP_SCREEN_ON`.

`android.permission.INTERNET` is still declared. Removing it would be a
satisfying proof of offline-ness, but WebView behaviour without it has not been
tested on hardware.
