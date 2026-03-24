package com.finansatlas.app;

import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native Play Billing bridge for Android-specific features.
 * Provides redeemPromoCode() — opens Play Store with pre-filled promo code.
 * Mirrors iOS StoreKitPlugin's presentOfferCodeRedeemSheet().
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin {

    private static final String PLAY_STORE_PACKAGE = "com.android.vending";

    /**
     * Opens the Google Play Store promo code redemption flow.
     * If a code is provided, it pre-fills the redemption dialog.
     * Falls back to browser if Play Store is not available.
     */
    @PluginMethod
    public void redeemPromoCode(PluginCall call) {
        String code = call.getString("code", "");

        try {
            // Build the Play Store redeem URI
            String redeemUrl = "https://play.google.com/redeem";
            if (code != null && !code.isEmpty()) {
                redeemUrl += "?code=" + Uri.encode(code);
            }

            // Try native Play Store intent first
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(redeemUrl));
            intent.setPackage(PLAY_STORE_PACKAGE);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (intent.resolveActivity(getActivity().getPackageManager()) != null) {
                getActivity().startActivity(intent);
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("method", "native");
                call.resolve(result);
            } else {
                // Fallback: open in browser
                openInBrowser(redeemUrl, call);
            }
        } catch (Exception e) {
            // Final fallback: browser
            try {
                String fallbackUrl = "https://play.google.com/redeem";
                if (code != null && !code.isEmpty()) {
                    fallbackUrl += "?code=" + Uri.encode(code);
                }
                openInBrowser(fallbackUrl, call);
            } catch (Exception ex) {
                call.reject("Failed to open promo code redemption: " + ex.getMessage());
            }
        }
    }

    private void openInBrowser(String url, PluginCall call) {
        Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(browserIntent);

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("method", "browser");
        call.resolve(result);
    }
}
