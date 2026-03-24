import SwiftUI
import WidgetKit

struct PortfolioView: View {
    let entry: PortfolioEntry

    private var pnlColor: Color {
        if entry.portfolioPnl > 0 { return WidgetConstants.accentGreen }
        if entry.portfolioPnl < 0 { return WidgetConstants.accentRose }
        return .white.opacity(WidgetConstants.textSecondary)
    }

    private var pnlIcon: String {
        if entry.portfolioPnl > 0 { return "arrow.up.right" }
        if entry.portfolioPnl < 0 { return "arrow.down.right" }
        return "minus"
    }

    var body: some View {
        ZStack {
            PremiumWidgetBackground()

            VStack(spacing: 4) {
                // Header
                WidgetLabel(title: "PORTFÖY", icon: "chart.line.uptrend.xyaxis")

                Spacer().frame(height: 6)

                if entry.hasData {
                    // Total value
                    AmountText(
                        entry.portfolioValue,
                        isPrivate: entry.isPrivate,
                        font: .system(size: 22, weight: .bold, design: .rounded),
                        color: .white.opacity(WidgetConstants.textPrimary),
                        compact: true
                    )

                    Spacer().frame(height: 4)

                    // P&L badge
                    HStack(spacing: 3) {
                        Image(systemName: pnlIcon)
                            .font(.system(size: 9, weight: .bold))

                        Text(entry.isPrivate ? "**%" : String(format: "%+.1f%%", entry.portfolioPnlPercent))
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        Capsule()
                            .fill(pnlColor)
                            .shadow(color: pnlColor.opacity(0.5), radius: 4)
                    )

                    Spacer().frame(height: 4)
                } else {
                    Spacer()

                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 28))
                        .foregroundColor(.white.opacity(WidgetConstants.textTertiary))

                    Text("Yatırım Ekle")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.white.opacity(WidgetConstants.textSecondary))

                    Spacer()
                }

                Text("Toplam Yatırım")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.white.opacity(WidgetConstants.textTertiary))
            }
            .padding(.vertical, 10)
        }
        .widgetURL(URL(string: "kredy://investments"))
    }
}

struct PortfolioWidget: Widget {
    let kind = "PortfolioWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PortfolioProvider()) { entry in
            if #available(iOS 17.0, *) {
                PortfolioView(entry: entry)
                    .containerBackground(for: .widget) {
                        PremiumWidgetBackground()
                    }
            } else {
                PortfolioView(entry: entry)
            }
        }
        .configurationDisplayName("Portföy Değeri")
        .description("Yatırım portföyünüzün toplam değerini takip edin")
        .supportedFamilies([.systemSmall])
    }
}
