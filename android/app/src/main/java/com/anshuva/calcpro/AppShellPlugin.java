package com.anshuva.calcpro;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Paints the system bar areas in the current app theme colour.
 *
 * On Android 15+ apps are drawn edge to edge and the old status bar colour call is ignored.
 * With WebViews older than 140, Capacitor keeps the web content clear of the bars by padding
 * the window, so the bars show the window background: this plugin sets that background (and the
 * bar colours on older Android) to the theme colour and picks light or dark bar icons to match.
 */
@CapacitorPlugin(name = "AppShell")
public class AppShellPlugin extends Plugin {

    private Integer lastColor = null;
    private boolean lastLight = false;

    @PluginMethod
    public void setColors(PluginCall call) {
        String color = call.getString("color", "#17191c");
        boolean light = Boolean.TRUE.equals(call.getBoolean("light", false));
        final int parsed;
        try {
            parsed = Color.parseColor(color);
        } catch (IllegalArgumentException e) {
            call.reject("Bad colour: " + color);
            return;
        }
        getActivity().runOnUiThread(() -> {
            apply(parsed, light);
            call.resolve();
        });
    }

    @SuppressWarnings("deprecation")
    private void apply(int color, boolean light) {
        lastColor = color;
        lastLight = light;
        Window window = getActivity().getWindow();
        window.getDecorView().setBackgroundColor(color);
        if (Build.VERSION.SDK_INT < 35) {
            window.setStatusBarColor(color);
            window.setNavigationBarColor(color);
        }
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(light);
        controller.setAppearanceLightNavigationBars(light);
    }

    // Capacitor's SystemBars resets the icon style on rotation / theme changes; put ours back.
    @Override
    protected void handleOnConfigurationChanged(Configuration newConfig) {
        super.handleOnConfigurationChanged(newConfig);
        if (lastColor != null) {
            getActivity().getWindow().getDecorView().post(() -> apply(lastColor, lastLight));
        }
    }
}
