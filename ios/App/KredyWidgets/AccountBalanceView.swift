import SwiftUI
import WidgetKit

struct AccountBalanceView: View {
    let entry: AccountBalanceEntry

    var body: some View {
        ZStack {
            PremiumWidgetBackground()

            VStack(spacing: 4) {
                WidgetLabel(title: "TOPLAM BAKİYE", icon: "banknote.fill")

                Spacer().frame(height: 6)

                AmountText(
                    entry.totalBalance,
                    isPrivate: entry.isPrivate,
                    font: .system(size: 20, weight: .bold, design: .rounded),
                    color: .white.opacity(WidgetConstants.textPrimary),
                    compact: true
                )

                Spacer().frame(height: 8)

                if entry.accounts.isEmpty {
                    EmptyWidgetView(icon: "building.columns", message: "Hesap Ekle")
                } else {
                    ForEach(entry.accounts, id: \.id) { account in
                        HStack {
                            Text(account.name)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(WidgetConstants.textSecondary))
                                .lineLimit(1)
                            Spacer()
                            Text(entry.isPrivate ? "****" : formatBalance(account.balance))
                                .font(.system(size: 10, weight: .semibold, design: .rounded))
                                .foregroundColor(account.balance >= 0
                                    ? WidgetConstants.accentGreen
                                    : WidgetConstants.accentRose)
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

struct AccountBalanceWidget: Widget {
    let kind = "AccountBalanceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AccountBalanceProvider()) { entry in
            if #available(iOS 17.0, *) {
                AccountBalanceView(entry: entry)
                    .containerBackground(for: .widget) { PremiumWidgetBackground() }
            } else {
                AccountBalanceView(entry: entry)
            }
        }
        .configurationDisplayName("Hesap Bakiyesi")
        .description("Banka hesaplarınızın toplam bakiyesini görün")
        .supportedFamilies([.systemSmall])
    }
}
