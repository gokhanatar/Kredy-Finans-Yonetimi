package com.finansatlas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * Wallet Barometer Widget (1x1) — Financial health indicator.
 * Matches iOS WalletBarometerWidget.
 * 5 levels: Rahat → İyi → Dikkat → Sıkışık → Acil
 * Refresh: every 30 minutes.
 */
public class WalletBarometerWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_wallet_barometer);

        // Deep link
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("kredy://wallet"));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, widgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_header, pendingIntent);

        JSONObject data = WidgetDataHelper.loadWidgetData(context);

        if (data == null) {
            views.setTextViewText(R.id.widget_emoji, "—");
            views.setTextViewText(R.id.widget_level, "Veri yok");
            views.setTextColor(R.id.widget_level, WidgetDataHelper.COLOR_TEXT_SECONDARY);
            views.setTextViewText(R.id.widget_percent, "");
            views.setProgressBar(R.id.widget_progress, 100, 0, false);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        double rate = data.optDouble("utilizationRate", 0);
        int level = WidgetDataHelper.getBarometerLevel(rate);
        int color = WidgetDataHelper.getBarometerColor(level);

        views.setTextViewText(R.id.widget_emoji, WidgetDataHelper.getBarometerEmoji(level));
        views.setTextViewText(R.id.widget_level, WidgetDataHelper.getBarometerLabel(level));
        views.setTextColor(R.id.widget_level, color);
        views.setTextViewText(R.id.widget_percent,
                String.format("%%.0f kullanım", rate));
        views.setProgressBar(R.id.widget_progress, 100, (int) Math.min(rate, 100), false);

        manager.updateAppWidget(widgetId, views);
    }
}
