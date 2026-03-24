package com.finansatlas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * Debt Status Widget (1x1) — Shows credit card debt utilization.
 * Matches iOS DebtStatusWidget.
 * Refresh: every 30 minutes.
 */
public class DebtStatusWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_debt_status);

        // Deep link: open wallet page
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("kredy://wallet"));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, widgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_header, pendingIntent);

        JSONObject data = WidgetDataHelper.loadWidgetData(context);

        if (data == null) {
            // Placeholder
            views.setTextViewText(R.id.widget_percent, "%0");
            views.setTextColor(R.id.widget_percent, WidgetDataHelper.COLOR_TEXT_SECONDARY);
            views.setTextViewText(R.id.widget_amount, "—");
            views.setProgressBar(R.id.widget_progress, 100, 0, false);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        boolean privacy = WidgetDataHelper.isPrivacyMode(data);
        double totalDebt = data.optDouble("totalDebt", 0);
        double totalLimit = data.optDouble("totalLimit", 0);
        double rate = data.optDouble("utilizationRate", 0);

        int gaugeColor = WidgetDataHelper.getGaugeColor(rate);

        views.setTextViewText(R.id.widget_percent, String.format("%%.0f", rate));
        views.setTextColor(R.id.widget_percent, gaugeColor);
        views.setProgressBar(R.id.widget_progress, 100, (int) Math.min(rate, 100), false);
        views.setTextViewText(R.id.widget_amount,
                privacy ? WidgetDataHelper.privacyAmount() : WidgetDataHelper.formatCompact(totalDebt));

        manager.updateAppWidget(widgetId, views);
    }
}
