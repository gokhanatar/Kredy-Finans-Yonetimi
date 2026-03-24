package com.finansatlas.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Next Payment Widget (2x1) — Shows upcoming card payment countdown.
 * Matches iOS NextPaymentWidget.
 * Finds card with nearest due date that has debt > 0.
 * Refresh: daily at midnight.
 */
public class NextPaymentWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_next_payment);

        // Deep link
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("kredy://wallet"));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, widgetId, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_header, pendingIntent);

        JSONObject data = WidgetDataHelper.loadWidgetData(context);

        if (data == null) {
            showEmpty(views);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        boolean privacy = WidgetDataHelper.isPrivacyMode(data);
        JSONArray cards = WidgetDataHelper.safeGetArray(data, "cards");

        // Find nearest due card with debt
        JSONObject nearestCard = null;
        int minDays = Integer.MAX_VALUE;

        if (cards != null) {
            for (int i = 0; i < cards.length(); i++) {
                JSONObject card = cards.optJSONObject(i);
                if (card == null) continue;
                double debt = card.optDouble("currentDebt", 0);
                if (debt <= 0) continue;

                int dueDay = card.optInt("dueDate", 1);
                int days = WidgetDataHelper.daysUntilDue(dueDay);
                if (days < minDays) {
                    minDays = days;
                    nearestCard = card;
                }
            }
        }

        if (nearestCard == null) {
            showEmpty(views);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        // Show data
        views.setViewVisibility(R.id.widget_content, View.VISIBLE);
        views.setViewVisibility(R.id.widget_empty, View.GONE);

        String bankName = nearestCard.optString("bankName", "Kart");
        String digits = nearestCard.optString("lastFourDigits", "");
        double debt = nearestCard.optDouble("currentDebt", 0);
        int urgencyColor = WidgetDataHelper.getUrgencyColor(minDays);

        views.setTextViewText(R.id.widget_bank_name, "💳 " + bankName);
        views.setTextViewText(R.id.widget_card_digits, digits.isEmpty() ? "" : "•••• " + digits);
        views.setTextViewText(R.id.widget_amount,
                privacy ? WidgetDataHelper.privacyAmount() : WidgetDataHelper.formatCurrency(debt));
        views.setTextViewText(R.id.widget_days, String.valueOf(minDays));
        views.setTextViewText(R.id.widget_urgency, WidgetDataHelper.getUrgencyLabel(minDays));
        views.setTextColor(R.id.widget_urgency, urgencyColor);

        manager.updateAppWidget(widgetId, views);
    }

    private void showEmpty(RemoteViews views) {
        views.setViewVisibility(R.id.widget_content, View.GONE);
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
    }
}
