package com.finansatlas.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register native Android plugins before super.onCreate
        registerPlugin(PlayBillingPlugin.class);
        registerPlugin(WidgetBridgePlugin.class);

        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    /**
     * Android 8+ (API 26+) requires notification channels.
     * Matches iOS notification categories with custom sounds.
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        // Family activity channel — real-time family updates (matches iOS push)
        createChannel(manager,
                "family-activity",
                "Aile Bildirimleri",
                "Aile üyelerinin finansal işlem bildirimleri",
                NotificationManager.IMPORTANCE_HIGH,
                "kredy_info");

        // Payment reminders
        createChannel(manager,
                "payment-reminder",
                "Ödeme Hatırlatmaları",
                "Kredi kartı ve fatura ödeme hatırlatmaları",
                NotificationManager.IMPORTANCE_HIGH,
                "kredy_reminder");

        // Golden window alerts
        createChannel(manager,
                "golden-window",
                "Altın Pencere",
                "Kredi kartı altın pencere uyarıları",
                NotificationManager.IMPORTANCE_DEFAULT,
                "kredy_positive");

        // Budget & goal alerts
        createChannel(manager,
                "budget-alert",
                "Bütçe Uyarıları",
                "Bütçe aşımı ve hedef hatırlatmaları",
                NotificationManager.IMPORTANCE_DEFAULT,
                "kredy_warning");

        // Overdue / urgent
        createChannel(manager,
                "overdue-alert",
                "Gecikme Uyarıları",
                "Gecikmiş ödeme ve acil uyarılar",
                NotificationManager.IMPORTANCE_HIGH,
                "kredy_urgent");

        // General notifications (default fallback)
        createChannel(manager,
                "default",
                "Genel Bildirimler",
                "Diğer bildirimler",
                NotificationManager.IMPORTANCE_DEFAULT,
                null);
    }

    private void createChannel(NotificationManager manager, String id, String name,
                                String description, int importance, String soundName) {
        NotificationChannel channel = new NotificationChannel(id, name, importance);
        channel.setDescription(description);

        if (soundName != null) {
            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE
                    + "://" + getPackageName() + "/raw/" + soundName);
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            channel.setSound(soundUri, attrs);
        }

        channel.enableVibration(true);
        channel.setShowBadge(true);
        manager.createNotificationChannel(channel);
    }
}
