package app.pulseras.mvp;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.Build;
import android.os.ParcelUuid;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.UUID;

@CapacitorPlugin(
    name = "PulserasAdvertiser",
    permissions = {
        @Permission(
            alias = "advertise",
            strings = { Manifest.permission.BLUETOOTH_ADVERTISE }
        )
    }
)
public class PulserasAdvertiserPlugin extends Plugin {

    private BluetoothLeAdvertiser advertiser;
    private AdvertiseCallback callback;

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", resolveAdvertiser() != null);
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
            && getPermissionState("advertise") != PermissionState.GRANTED) {
            requestPermissionForAlias("advertise", call, "advertisePermsCallback");
            return;
        }
        startInternal(call);
    }

    @PermissionCallback
    private void advertisePermsCallback(PluginCall call) {
        if (getPermissionState("advertise") == PermissionState.GRANTED) {
            startInternal(call);
            return;
        }
        call.reject("BLUETOOTH_ADVERTISE permission was denied. Enable Nearby devices / advertising in app settings.");
    }

    private void startInternal(PluginCall call) {
        String serviceUuid = call.getString("serviceUuid");
        boolean includeServiceUuid = Boolean.TRUE.equals(call.getBoolean("includeServiceUuid", true));
        boolean includeManufacturerData = Boolean.TRUE.equals(call.getBoolean("includeManufacturerData", false));
        boolean includeLocalName = Boolean.TRUE.equals(call.getBoolean("includeLocalName", false));
        boolean includeTxPower = Boolean.TRUE.equals(call.getBoolean("includeTxPower", false));
        boolean connectable = Boolean.TRUE.equals(call.getBoolean("connectable", false));

        if (includeServiceUuid && (serviceUuid == null || serviceUuid.isEmpty())) {
            call.reject("Missing Pulseras service UUID.");
            return;
        }
        if (!includeServiceUuid && !includeManufacturerData && !includeLocalName && !includeTxPower) {
            call.reject("Advertising payload is empty. Enable the service UUID or manufacturer data in Settings.");
            return;
        }

        BluetoothLeAdvertiser next = resolveAdvertiser();
        if (next == null) {
            BluetoothAdapter adapter = resolveAdapter();
            if (adapter != null && !adapter.isEnabled()) {
                call.reject("Bluetooth is off.");
                return;
            }
            call.reject("BLE advertising is not supported on this device.");
            return;
        }

        stopInternal();
        advertiser = next;

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(advertiseMode(call.getString("mode")))
            .setTxPowerLevel(advertiseTxPower(call.getString("txPower")))
            .setConnectable(connectable)
            .setTimeout(0)
            .build();

        AdvertiseData.Builder primary = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false);
        AdvertiseData.Builder scanResponse = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false);

        if (includeServiceUuid) {
            try {
                primary.addServiceUuid(new ParcelUuid(UUID.fromString(serviceUuid)));
            } catch (IllegalArgumentException error) {
                call.reject("Invalid Pulseras service UUID.");
                return;
            }
        }

        byte[] manufacturerPayload = null;
        Integer manufacturerId = call.getInt("manufacturerId");
        JSArray manufacturerData = call.getArray("manufacturerData");
        if (includeManufacturerData) {
            if (manufacturerId == null || manufacturerData == null) {
                call.reject("Manufacturer data is enabled but missing.");
                return;
            }
            try {
                manufacturerPayload = new byte[manufacturerData.length()];
                for (int i = 0; i < manufacturerData.length(); i += 1) {
                    manufacturerPayload[i] = (byte) manufacturerData.getInt(i);
                }
            } catch (Exception error) {
                call.reject("Invalid manufacturer data.");
                return;
            }
            // 128-bit UUID + manufacturer data overflow the 31-byte advertise packet.
            if (includeServiceUuid) {
                scanResponse.addManufacturerData(manufacturerId, manufacturerPayload);
            } else {
                primary.addManufacturerData(manufacturerId, manufacturerPayload);
            }
        }

        if (includeTxPower) {
            scanResponse.setIncludeTxPowerLevel(true);
        }
        if (includeLocalName) {
            scanResponse.setIncludeDeviceName(true);
        }

        callback = new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                call.resolve();
            }

            @Override
            public void onStartFailure(int errorCode) {
                callback = null;
                call.reject(advertiseError(errorCode));
            }
        };

        try {
            advertiser.startAdvertising(settings, primary.build(), scanResponse.build(), callback);
        } catch (SecurityException error) {
            callback = null;
            call.reject("Permission denied for BLE advertising.");
        } catch (Exception error) {
            callback = null;
            call.reject(error.getMessage() != null ? error.getMessage() : "Unable to start BLE advertising.");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopInternal();
        call.resolve();
    }

    private BluetoothAdapter resolveAdapter() {
        BluetoothManager manager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (manager == null) {
            return null;
        }
        return manager.getAdapter();
    }

    private BluetoothLeAdvertiser resolveAdvertiser() {
        BluetoothAdapter adapter = resolveAdapter();
        if (adapter == null || !adapter.isEnabled() || !adapter.isMultipleAdvertisementSupported()) {
            return null;
        }
        return adapter.getBluetoothLeAdvertiser();
    }

    private void stopInternal() {
        if (advertiser != null && callback != null) {
            try {
                advertiser.stopAdvertising(callback);
            } catch (Exception ignored) {
                // Already stopped or permission revoked.
            }
        }
        advertiser = null;
        callback = null;
    }

    private static int advertiseMode(String mode) {
        if ("lowPower".equals(mode)) {
            return AdvertiseSettings.ADVERTISE_MODE_LOW_POWER;
        }
        if ("balanced".equals(mode)) {
            return AdvertiseSettings.ADVERTISE_MODE_BALANCED;
        }
        return AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY;
    }

    private static int advertiseTxPower(String txPower) {
        if ("ultraLow".equals(txPower)) {
            return AdvertiseSettings.ADVERTISE_TX_POWER_ULTRA_LOW;
        }
        if ("low".equals(txPower)) {
            return AdvertiseSettings.ADVERTISE_TX_POWER_LOW;
        }
        if ("high".equals(txPower)) {
            return AdvertiseSettings.ADVERTISE_TX_POWER_HIGH;
        }
        return AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM;
    }

    private static String advertiseError(int errorCode) {
        switch (errorCode) {
            case AdvertiseCallback.ADVERTISE_FAILED_DATA_TOO_LARGE:
                return "Advertise packet is too large. Turn off manufacturer data, local name, or TX power in Settings.";
            case AdvertiseCallback.ADVERTISE_FAILED_TOO_MANY_ADVERTISERS:
                return "Too many BLE advertisers are already running.";
            case AdvertiseCallback.ADVERTISE_FAILED_ALREADY_STARTED:
                return "BLE advertising is already started.";
            case AdvertiseCallback.ADVERTISE_FAILED_INTERNAL_ERROR:
                return "Internal Bluetooth error while starting advertising.";
            case AdvertiseCallback.ADVERTISE_FAILED_FEATURE_UNSUPPORTED:
                return "BLE advertising is not supported on this device.";
            default:
                return "Unable to start BLE advertising (error " + errorCode + ").";
        }
    }

    @Override
    protected void handleOnDestroy() {
        stopInternal();
        super.handleOnDestroy();
    }
}
