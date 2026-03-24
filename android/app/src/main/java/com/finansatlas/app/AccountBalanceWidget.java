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
 * Account Balance Widget (2x1) — Shows total balance + top 4 accounts.
 * Matches iOS AccountBalanceWidget.
 * Refresh: every 30 minutes.
 */
public class AccountBalanceWidget extends AppWidgetProvider {

    private static final int[][] ACCOUNT_ROW_IDS = {
        { R.id.widget_account_1, R.id.widget_account_1_icon, R.id.widget_account_1_name, R.id.widget_account_1_amount },
        { R.id.widget_account_2, R.id.widget_account_2_icon, R.id.widget_account_2_name, R.id.widget_account_2_amount },
        { R.id.widget_account_3, R.id.widget_account_3_icon, R.id.widget_account_3_name, R.id.widget_account_3_amount },
        { R.id.widget_account_4, R.id.widget_account_4_icon, R.id.widget_account_4_name, R.id.widget_account_4_amount },
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_account_balance);

        // Deep link
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("kredy://family"));
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
        JSONArray accounts = WidgetDataHelper.safeGetArray(data, "accounts");

        if (accounts == null || accounts.length() == 0) {
            showEmpty(views);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        // Show content
        views.setViewVisibility(R.id.widget_accounts_list, View.VISIBLE);
        views.setViewVisibility(R.id.widget_empty, View.GONE);

        // Calculate total
        double total = 0;
        for (int i = 0; i < accounts.length(); i++) {
            JSONObject acc = accounts.optJSONObject(i);
            if (acc != null) total += acc.optDouble("balance", 0);
        }

        views.setTextViewText(R.id.widget_total,
                privacy ? WidgetDataHelper.privacyAmount() : WidgetDataHelper.formatCurrency(total));

        // Show up to 4 accounts
        int count = Math.min(accounts.length(), 4);
        for (int i = 0; i < 4; i++) {
            int[] rowIds = ACCOUNT_ROW_IDS[i];
            if (i < count) {
                JSONObject acc = accounts.optJSONObject(i);
                if (acc == null) {
                    views.setViewVisibility(rowIds[0], View.GONE);
                    continue;
                }

                String type = acc.optString("type", "bank");
                String name = acc.optString("name", "Hesap");
                double balance = acc.optDouble("balance", 0);

                views.setViewVisibility(rowIds[0], View.VISIBLE);
                views.setTextViewText(rowIds[1], WidgetDataHelper.getAccountTypeEmoji(type));
                views.setTextViewText(rowIds[2], name);
                views.setTextColor(rowIds[2], WidgetDataHelper.getAccountTypeColor(type));
                views.setTextViewText(rowIds[3],
                        privacy ? WidgetDataHelper.privacyAmount() : WidgetDataHelper.formatCompact(balance));
            } else {
                views.setViewVisibility(rowIds[0], View.GONE);
            }
        }

        manager.updateAppWidget(widgetId, views);
    }

    private void showEmpty(RemoteViews views) {
        views.setViewVisibility(R.id.widget_accounts_list, View.GONE);
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
        views.setTextViewText(R.id.widget_total, "—");
    }
}
