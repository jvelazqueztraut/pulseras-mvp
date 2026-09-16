package app.pulseras.mvp;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.UUID;

@CapacitorPlugin(name = "PulserasAdvertiser")
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
        String serviceUuid = call.getString("serviceUuid");
        if (serviceUuid == null || serviceUuid.isEmpty()) {
            call.reject("Missing Pulseras service UUID.");
            return;
        }

        BluetoothLeAdvertiser next = resolveAdvertiser();
        if (next == null) {
            call.reject("BLE advertising is not supported on this device.");
            return;
        }

        stopInternal();
        advertiser = next;

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
            .setConnectable(false)
            .setTimeout(0)
            .build();

        AdvertiseData.Builder data = new AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false)
            .addServiceUuid(new ParcelUuid(UUID.fromString(serviceUuid)));

        Integer manufacturerId = call.getInt("manufacturerId");
        JSArray manufacturerData = call.getArray("manufacturerData");
        if (manufacturerId != null && manufacturerData != null) {
            try {
                byte[] payload = new byte[manufacturerData.length()];
                for (int i = 0; i < manufacturerData.length(); i += 1) {
                    payload[i] = (byte) manufacturerData.getInt(i);
                }
                data.addManufacturerData(manufacturerId, payload);
            } catch (Exception error) {
                call.reject("Invalid manufacturer data.");
                return;
            }
        }

        callback = new AdvertiseCallback() {
            @Override
            public void onStartSuccess(AdvertiseSettings settingsInEffect) {
                call.resolve();
            }

            @Override
            public void onStartFailure(int errorCode) {
                callback = null;
                call.reject("Unable to start BLE advertising (" + errorCode + ").");
            }
        };

        try {
            advertiser.startAdvertising(settings, data.build(), callback);
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

    private BluetoothLeAdvertiser resolveAdvertiser() {
        BluetoothManager manager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (manager == null) {
            return null;
        }
        BluetoothAdapter adapter = manager.getAdapter();
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

    @Override
    protected void handleOnDestroy() {
        stopInternal();
        super.handleOnDestroy();
    }
}
