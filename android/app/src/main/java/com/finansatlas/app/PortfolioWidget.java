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
 * Portfolio Widget (1x1) — Shows investment portfolio value + P&L.
 * Matches iOS PortfolioWidget.
 * Refresh: every 1 hour.
 */
public class PortfolioWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_portfolio);

        // Deep link
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("kredy://investments"));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, widgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_header, pendingIntent);

        JSONObject data = WidgetDataHelper.loadWidgetData(context);

        double portfolioValue = data != null ? data.optDouble("portfolioValue", 0) : 0;
        double portfolioPnlPercent = data != null ? data.optDouble("portfolioPnlPercent", 0) : 0;

        if (data == null || portfolioValue <= 0) {
            // Empty state
            views.setViewVisibility(R.id.widget_center, View.GONE);
            views.setViewVisibility(R.id.widget_label, View.GONE);
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        boolean privacy = WidgetDataHelper.isPrivacyMode(data);

        // Show data
        views.setViewVisibility(R.id.widget_center, View.VISIBLE);
        views.setViewVisibility(R.id.widget_label, View.VISIBLE);
        views.setViewVisibility(R.id.widget_empty, View.GONE);

        views.setTextViewText(R.id.widget_value,
                privacy ? WidgetDataHelper.privacyAmount() : WidgetDataHelper.formatCurrency(portfolioValue));

        // P&L badge
        String arrow;
        int pnlColor;
        if (portfolioPnlPercent > 0) {
            arrow = "↗";
            pnlColor = WidgetDataHelper.COLOR_GREEN;
        } else if (portfolioPnlPercent < 0) {
            arrow = "↘";
            pnlColor = WidgetDataHelper.COLOR_ROSE;
        } else {
            arrow = "—";
            pnlColor = WidgetDataHelper.COLOR_TEXT_SECONDARY;
        }

        views.setTextViewText(R.id.widget_pnl,
                privacy ? "₺***" : String.format("%s %+.1f%%", arrow, portfolioPnlPercent));
        views.setTextColor(R.id.widget_pnl, pnlColor);

        manager.updateAppWidget(widgetId, views);
    }
}
