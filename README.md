# Pulseras MVP

Proximity-based app for detecting nearby Bluetooth Low Energy devices without pairing.

The UI is a Next.js static export. Browsers use a simulated BLE source. The Android APK uses Capacitor with real BLE scanning and optional native advertising.

## Tooling

- Node.js 22+ (npm)
- JDK 21
- Android Studio Ladybug or newer
- Android SDK with compile/target API 36 and a device or emulator image
- A **physical Android phone** for BLE scanning (emulators do not provide reliable BLE)

## Web (mock BLE)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Start/Stop Scanning, device details, hide/restore, and Settings all run against simulated devices. Advertising is reported as unsupported.

Production static files:

```bash
npm run build        # writes ./out
npx serve out        # optional local static server
npm test
```

## Capacitor / Android

App id: `app.pulseras.mvp`  
Display name: Pulseras  
Web assets: `out/` (Next.js `output: "export"`)

```bash
npm run android:prepare   # next build + cap sync android
npm run cap:open          # open Android Studio
# or
npm run android:open
```

Sync after web changes:

```bash
npm run build
npm run cap:sync
```

### Debug APK

```bash
npm run android:apk
```

The APK is written to:

`android/app/build/outputs/apk/debug/app-debug.apk`

Install on a device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Or use Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

### Permissions

Declared in `android/app/src/main/AndroidManifest.xml`:

- Android 12+ (API 31): `BLUETOOTH_SCAN` with `neverForLocation`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE`
- Android 11 and older: `BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` (`maxSdkVersion=30`)

Pulseras does **not** use scan results to derive physical location. Runtime prompts come from `@capacitor-community/bluetooth-le` `BleClient.initialize({ androidNeverForLocation: true })`. Denied permissions show the existing Home “permission denied” state; Settings can reopen the system app settings screen.

### Test BLE scanning on a phone

1. Build and install the debug APK on a physical device with Bluetooth on.
2. Grant Nearby devices / Bluetooth permissions when asked.
3. Open Pulseras and tap **Start Scanning**.
4. Nearby BLE advertisements should appear in the Home list with qualitative proximity (Very close / Close / Nearby / Far / Unknown) from RSSI. This is not a distance measurement.
5. Open a row for details. Hide remains local and persists across scans.

**Emulators:** Android emulators typically have no BLE radio. Scanning will not discover real devices. Do not treat emulator results as proof that native BLE works.

Real BLE scanning has been implemented against the official `BleClient` API and unit-tested with fakes. **It has not been verified on a physical Android device in this environment.** Confirm on hardware before claiming production BLE behavior.

## Mock vs native

| | Web (`next dev` / static site) | Android Capacitor APK |
| --- | --- | --- |
| BLE source | Simulated catalog | `BleClient.requestLEScan` |
| Bluetooth toggle | Local demo state | `requestEnable` / Bluetooth settings |
| Permissions | Local demo state | OS runtime permissions |
| Advertising | Unsupported | Native `PulserasAdvertiser` if the chipset supports peripheral mode |

The UI never imports Capacitor directly. `src/lib/ble/factory.ts` selects the service.

## Advertising

`@capacitor-community/bluetooth-le` is **central-role only** and does not advertise. Capawesome’s BLE SDK supports peripheral mode but is a separate paid plugin; Pulseras instead ships a small Android adapter (`PulserasAdvertiserPlugin`) using `BluetoothLeAdvertiser`.

Protocol v1 (no PII):

- Service UUID: `8f2a4c10-9b7e-4d31-9c4a-1f6e8b2d0a01`
- Local advertiser name is not included (avoids the phone’s Bluetooth name)
- Optional manufacturer payload: company id `0xFFFF` (development), `[version=0x01, 8 anonymous bytes]`

Enable advertising from Settings when the row says it is supported. Test with a second phone running Pulseras (or nRF Connect) and look for that service UUID. If `isMultipleAdvertisementSupported()` is false, Settings shows advertising as unsupported — that is not faked.

Foreground only: scanning and advertising stop when the app backgrounds. There is no unrestricted background scan.

## Architecture

- `src/lib/ble/mockBleService.ts` — web fallback
- `src/lib/ble/nativeBleService.ts` — Android `BleClient` + advertising port
- `src/lib/ble/scanMapper.ts` — identity, dedupe, hidden filter, RSSI merge
- `src/lib/proximity.ts` — RSSI bands
- `android/app/src/main/java/app/pulseras/mvp/PulserasAdvertiserPlugin.java` — peripheral advertise
