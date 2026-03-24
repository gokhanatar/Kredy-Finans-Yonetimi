import SwiftUI
import WidgetKit

struct DebtStatusView: View {
    let entry: DebtStatusEntry

    private var utilizationColor: Color {
        if entry.utilizationRate < 30 { return WidgetConstants.accentGreen }
        if entry.utilizationRate < 70 { return WidgetConstants.accentAmber }
        return WidgetConstants.accentRose
    }

    var body: some View {
        ZStack {
            PremiumWidgetBackground()

            VStack(spacing: 4) {
                WidgetLabel(title: "BORÇ DURUMU", icon: "creditcard.fill")

                Spacer().frame(height: 6)

                AmountText(
                    entry.totalDebt,
                    isPrivate: entry.isPrivate,
                    font: .system(size: 20, weight: .bold, design: .rounded),
                    color: .white.opacity(WidgetConstants.textPrimary),
                    compact: true
                )

                Spacer().frame(height: 6)

                WidgetProgressBar(
                    progress: entry.utilizationRate / 100,
                    color: utilizationColor
                )

                Spacer().frame(height: 4)

                HStack {
                    Text(entry.isPrivate ? "**%" : String(format: "%.0f%%", entry.utilizationRate))
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(utilizationColor)
                    Spacer()
                    Text("\(entry.cardCount) kart")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(.white.opacity(WidgetConstants.textTertiary))
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .widgetURL(URL(string: "kredy://cards"))
    }
}

struct DebtStatusWidget: Widget {
    let kind = "DebtStatusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DebtStatusProvider()) { entry in
            if #available(iOS 17.0, *) {
                DebtStatusView(entry: entry)
                    .containerBackground(for: .widget) { PremiumWidgetBackground() }
            } else {
                DebtStatusView(entry: entry)
            }
        }
        .configurationDisplayName("Borç Durumu")
        .description("Kredi kartı borcunuzu ve kullanım oranınızı takip edin")
        .supportedFamilies([.systemSmall])
    }
}
