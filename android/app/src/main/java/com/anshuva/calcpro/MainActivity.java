package com.anshuva.calcpro;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // local plugin: theme-coloured system bars (see AppShellPlugin)
        registerPlugin(AppShellPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
