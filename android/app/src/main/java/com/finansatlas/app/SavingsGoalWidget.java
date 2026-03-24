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
 * Savings Goal Widget (2x1) — Shows first savings goal progress.
 * Matches iOS SavingsGoalWidget.
 * Refresh: every 1 hour.
 */
public class SavingsGoalWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    private void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_savings_goal);

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
        JSONArray goals = WidgetDataHelper.safeGetArray(data, "goals");

        if (goals == null || goals.length() == 0) {
            showEmpty(views);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        JSONObject goal = goals.optJSONObject(0);
        if (goal == null) {
            showEmpty(views);
            manager.updateAppWidget(widgetId, views);
            return;
        }

        // Show content
        views.setViewVisibility(R.id.widget_content, View.VISIBLE);
        views.setViewVisibility(R.id.widget_empty, View.GONE);

        String name = goal.optString("name", "Hedef");
        String icon = goal.optString("icon", "target");
        double target = goal.optDouble("targetAmount", 0);
        double current = goal.optDouble("currentAmount", 0);
        double percent = target > 0 ? (current / target) * 100 : 0;
        int progressColor = WidgetDataHelper.getProgressColor(percent);

        // Map icon to emoji
        String emoji = mapIconToEmoji(icon);

        views.setTextViewText(R.id.widget_percent, String.format("%%.0f", percent));
        views.setTextColor(R.id.widget_percent, progressColor);
        views.setTextViewText(R.id.widget_goal_name, emoji + " " + name);
        views.setTextViewText(R.id.widget_current,
                privacy ? WidgetDataHelper.privacyAmount() : WidgetDataHelper.formatCurrency(current));
        views.setProgressBar(R.id.widget_progress, 100, (int) Math.min(percent, 100), false);
        views.setTextViewText(R.id.widget_target,
                privacy ? "Hedef: " + WidgetDataHelper.privacyAmount()
                        : "Hedef: " + WidgetDataHelper.formatCurrency(target));

        manager.updateAppWidget(widgetId, views);
    }

    private void showEmpty(RemoteViews views) {
        views.setViewVisibility(R.id.widget_content, View.GONE);
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
    }

    private String mapIconToEmoji(String icon) {
        if (icon == null) return "🎯";
        switch (icon) {
            case "home": return "🏠";
            case "plane": return "✈️";
            case "car": return "🚗";
            case "graduation-cap": return "🎓";
            case "gift": return "🎁";
            case "heart": return "❤️";
            case "baby": return "👶";
            case "umbrella": return "☂️";
            case "shield": return "🛡️";
            default: return "🎯";
        }
    }
}
