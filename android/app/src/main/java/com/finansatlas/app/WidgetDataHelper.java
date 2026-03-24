package com.finansatlas.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * Shared helper for all Kredy widgets.
 * Loads data from SharedPreferences (set by WidgetBridgePlugin).
 * Provides formatting and color utilities.
 */
public class WidgetDataHelper {

    // Design colors (matching iOS WidgetConstants)
    public static final int COLOR_BG_DEEP = 0xFF0D0F14;
    public static final int COLOR_BG_BASE = 0xFF131620;
    public static final int COLOR_BG_ELEVATED = 0xFF1A1E2E;
    public static final int COLOR_TEXT_PRIMARY = 0xF2FFFFFF;   // 95% white
    public static final int COLOR_TEXT_SECONDARY = 0x99FFFFFF; // 60% white
    public static final int COLOR_TEXT_TERTIARY = 0x59FFFFFF;  // 35% white

    public static final int COLOR_GREEN = 0xFF34D399;
    public static final int COLOR_BLUE = 0xFF60A5FA;
    public static final int COLOR_AMBER = 0xFFFBBF24;
    public static final int COLOR_ORANGE = 0xFFFB923C;
    public static final int COLOR_ROSE = 0xFFFB7185;
    public static final int COLOR_PURPLE = 0xFFA78BFA;

    private static final NumberFormat currencyFormat;

    static {
        currencyFormat = NumberFormat.getCurrencyInstance(new Locale("tr", "TR"));
        currencyFormat.setMaximumFractionDigits(0);
    }

    public static JSONObject loadWidgetData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(
                WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String data = prefs.getString(WidgetBridgePlugin.DATA_KEY, "");
        if (data == null || data.isEmpty()) return null;

        try {
            return new JSONObject(data);
        } catch (Exception e) {
            return null;
        }
    }

    public static String formatCurrency(double amount) {
        try {
            return currencyFormat.format(amount);
        } catch (Exception e) {
            return "₺" + String.format(new Locale("tr", "TR"), "%,.0f", amount);
        }
    }

    public static String formatCompact(double amount) {
        if (Math.abs(amount) >= 1_000_000) {
            return String.format(new Locale("tr", "TR"), "₺%.1fM", amount / 1_000_000);
        } else if (Math.abs(amount) >= 1_000) {
            return String.format(new Locale("tr", "TR"), "₺%.1fB", amount / 1_000);
        }
        return formatCurrency(amount);
    }

    public static String formatPercent(double percent) {
        return String.format(new Locale("tr", "TR"), "%%%.1f", percent);
    }

    public static boolean isPrivacyMode(JSONObject data) {
        return data != null && data.optBoolean("privacyMode", false);
    }

    public static String privacyAmount() {
        return "₺***";
    }

    /** Gauge color based on utilization rate (0-100) */
    public static int getGaugeColor(double rate) {
        if (rate <= 30) return COLOR_GREEN;
        if (rate <= 50) return COLOR_AMBER;
        if (rate <= 70) return COLOR_ORANGE;
        return COLOR_ROSE;
    }

    /** Urgency color based on days left */
    public static int getUrgencyColor(int daysLeft) {
        if (daysLeft <= 3) return COLOR_ROSE;
        if (daysLeft <= 7) return COLOR_AMBER;
        return COLOR_GREEN;
    }

    /** Urgency label based on days left */
    public static String getUrgencyLabel(int daysLeft) {
        if (daysLeft <= 3) return "Acil";
        if (daysLeft <= 7) return "Yakın";
        return "Rahat";
    }

    /** Barometer level (0-4) based on utilization rate */
    public static int getBarometerLevel(double rate) {
        if (rate < 20) return 0;
        if (rate < 40) return 1;
        if (rate < 60) return 2;
        if (rate < 80) return 3;
        return 4;
    }

    /** Barometer label */
    public static String getBarometerLabel(int level) {
        switch (level) {
            case 0: return "Rahat";
            case 1: return "İyi";
            case 2: return "Dikkat";
            case 3: return "Sıkışık";
            case 4: return "Acil";
            default: return "—";
        }
    }

    /** Barometer color */
    public static int getBarometerColor(int level) {
        switch (level) {
            case 0: return COLOR_GREEN;
            case 1: return COLOR_BLUE;
            case 2: return COLOR_AMBER;
            case 3: return COLOR_ORANGE;
            case 4: return COLOR_ROSE;
            default: return COLOR_TEXT_SECONDARY;
        }
    }

    /** Barometer emoji */
    public static String getBarometerEmoji(int level) {
        switch (level) {
            case 0: return "🛡️";
            case 1: return "👍";
            case 2: return "⚠️";
            case 3: return "⚡";
            case 4: return "🔥";
            default: return "—";
        }
    }

    /** Progress color for savings goals */
    public static int getProgressColor(double progressPercent) {
        if (progressPercent >= 75) return COLOR_GREEN;
        if (progressPercent >= 50) return COLOR_BLUE;
        if (progressPercent >= 25) return COLOR_AMBER;
        return COLOR_ORANGE;
    }

    /** Account type color */
    public static int getAccountTypeColor(String type) {
        if (type == null) return COLOR_BLUE;
        switch (type) {
            case "bank": return COLOR_BLUE;
            case "cash": return COLOR_GREEN;
            case "investment": return COLOR_PURPLE;
            case "crypto": return COLOR_ORANGE;
            case "gold": return COLOR_AMBER;
            default: return COLOR_BLUE;
        }
    }

    /** Account type emoji */
    public static String getAccountTypeEmoji(String type) {
        if (type == null) return "🏦";
        switch (type) {
            case "bank": return "🏦";
            case "cash": return "💵";
            case "investment": return "📈";
            case "crypto": return "₿";
            case "gold": return "💎";
            default: return "🏦";
        }
    }

    /** Calculate days until due date from current day */
    public static int daysUntilDue(int dueDay) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        int today = cal.get(java.util.Calendar.DAY_OF_MONTH);
        int maxDay = cal.getActualMaximum(java.util.Calendar.DAY_OF_MONTH);

        if (dueDay >= today) {
            return dueDay - today;
        } else {
            return (maxDay - today) + dueDay;
        }
    }

    /** Safe JSON array get */
    public static JSONArray safeGetArray(JSONObject obj, String key) {
        try {
            return obj.optJSONArray(key);
        } catch (Exception e) {
            return new JSONArray();
        }
    }
}
