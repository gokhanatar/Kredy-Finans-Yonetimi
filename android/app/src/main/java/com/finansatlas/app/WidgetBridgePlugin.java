package com.finansatlas.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridge between Capacitor web app and Android home screen widgets.
 * Stores widget data in SharedPreferences and triggers widget refresh.
 * Mirrors iOS WidgetBridgePlugin (App Groups + UserDefaults).
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    public static final String PREFS_NAME = "com.finansatlas.app.widget_data";
    public static final String DATA_KEY = "widget_data";

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        String data = call.getString("data", "");
        if (data == null || data.isEmpty()) {
            call.reject("data is required");
            return;
        }

        Context context = getContext();

        // Store in SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(DATA_KEY, data).apply();

        // Notify all widget providers to refresh
        refreshAllWidgets(context);

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    private void refreshAllWidgets(Context context) {
        Class<?>[] widgetClasses = {
            DebtStatusWidget.class,
            WalletBarometerWidget.class,
            NextPaymentWidget.class,
            AccountBalanceWidget.class,
            SavingsGoalWidget.class,
            PortfolioWidget.class,
        };

        AppWidgetManager manager = AppWidgetManager.getInstance(context);

        for (Class<?> widgetClass : widgetClasses) {
            ComponentName component = new ComponentName(context, widgetClass);
            int[] ids = manager.getAppWidgetIds(component);
            if (ids != null && ids.length > 0) {
                Intent intent = new Intent(context, widgetClass);
                intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                context.sendBroadcast(intent);
            }
        }
    }
}
