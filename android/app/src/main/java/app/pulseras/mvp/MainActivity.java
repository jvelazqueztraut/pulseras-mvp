package app.pulseras.mvp;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PulserasAdvertiserPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
