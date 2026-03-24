import SwiftUI
import WidgetKit

struct NextPaymentView: View {
    let entry: NextPaymentEntry

    private var urgencyColor: Color {
        if entry.daysUntilDue <= 3 { return WidgetConstants.accentRose }
        if entry.daysUntilDue <= 7 { return WidgetConstants.accentAmber }
        return WidgetConstants.accentGreen
    }

    var body: some View {
        ZStack {
            PremiumWidgetBackground()

            VStack(spacing: 4) {
                WidgetLabel(title: "SONRAKI ÖDEME", icon: "calendar.badge.clock")

                Spacer().frame(height: 6)

                if let card = entry.nextCard {
                    Text(card.bankName)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white.opacity(WidgetConstants.textSecondary))
                        .lineLimit(1)

                    Spacer().frame(height: 4)

                    AmountText(
                        card.currentDebt,
                        isPrivate: entry.isPrivate,
                        font: .system(size: 18, weight: .bold, design: .rounded),
                        color: .white.opacity(WidgetConstants.textPrimary),
                        compact: true
                    )

                    Spacer().frame(height: 6)

                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 9))
                        Text(entry.daysUntilDue == 0 ? "Bugün!" : "\(entry.daysUntilDue) gün")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(urgencyColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Capsule().fill(urgencyColor.opacity(0.18)))
                } else {
                    Spacer()
                    EmptyWidgetView(icon: "creditcard", message: "Kart Ekle")
                    Spacer()
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .widgetURL(URL(string: "kredy://cards"))
    }
}

struct NextPaymentWidget: Widget {
    let kind = "NextPaymentWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextPaymentProvider()) { entry in
            if #available(iOS 17.0, *) {
                NextPaymentView(entry: entry)
                    .containerBackground(for: .widget) { PremiumWidgetBackground() }
            } else {
                NextPaymentView(entry: entry)
            }
        }
        .configurationDisplayName("Sonraki Ödeme")
        .description("Yaklaşan kredi kartı ödemenizi takip edin")
        .supportedFamilies([.systemSmall])
    }
}
