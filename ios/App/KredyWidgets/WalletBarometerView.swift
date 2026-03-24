import SwiftUI
import WidgetKit

struct WalletBarometerView: View {
    let entry: WalletBarometerEntry

    var body: some View {
        ZStack {
            PremiumWidgetBackground()

            VStack(spacing: 4) {
                WidgetLabel(title: "CÜZDAN", icon: "wallet.pass.fill")

                Spacer().frame(height: 6)

                AmountText(
                    entry.totalBalance,
                    isPrivate: entry.isPrivate,
                    font: .system(size: 20, weight: .bold, design: .rounded),
                    color: .white.opacity(WidgetConstants.textPrimary),
                    compact: true
                )

                Spacer().frame(height: 6)

                if entry.accounts.isEmpty {
                    EmptyWidgetView(icon: "wallet.pass", message: "Hesap Ekle")
                } else {
                    ForEach(entry.accounts, id: \.id) { account in
                        HStack {
                            Text(account.name)
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.white.opacity(WidgetConstants.textSecondary))
                                .lineLimit(1)
                            Spacer()
                            Text(entry.isPrivate ? "****" : formatBalance(account.balance))
                                .font(.system(size: 9, weight: .semibold, design: .rounded))
                                .foregroundColor(.white.opacity(WidgetConstants.textPrimary))
                        }
                    }
                }

                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .widgetURL(URL(string: "kredy://accounts"))
    }

    private func formatBalance(_ value: Double) -> String {
        if abs(value) >= 1000 {
            return String(format: "%.1fK ₺", value / 1000)
        }
        return String(format: "%.0f ₺", value)
    }
}

struct WalletBarometerWidget: Widget {
    let kind = "WalletBarometerWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WalletBarometerProvider()) { entry in
            if #available(iOS 17.0, *) {
                WalletBarometerView(entry: entry)
                    .containerBackground(for: .widget) { PremiumWidgetBackground() }
            } else {
                WalletBarometerView(entry: entry)
            }
        }
        .configurationDisplayName("Cüzdan Barometresi")
        .description("Tüm hesaplarınızın toplam bakiyesini görün")
        .supportedFamilies([.systemSmall])
    }
}
