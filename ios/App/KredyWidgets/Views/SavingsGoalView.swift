import SwiftUI
import WidgetKit

struct SavingsGoalView: View {
    let entry: SavingsGoalEntry

    var body: some View {
        ZStack {
            PremiumWidgetBackground()

            VStack(spacing: 4) {
                WidgetLabel(title: "TASARRUF HEDEFİ", icon: "target")

                Spacer().frame(height: 6)

                if let goal = entry.goal {
                    Text(goal.name)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.white.opacity(WidgetConstants.textSecondary))
                        .lineLimit(1)

                    Spacer().frame(height: 4)

                    AmountText(
                        goal.currentAmount,
                        isPrivate: entry.isPrivate,
                        font: .system(size: 18, weight: .bold, design: .rounded),
                        color: .white.opacity(WidgetConstants.textPrimary),
                        compact: true
                    )

                    Spacer().frame(height: 6)

                    WidgetProgressBar(
                        progress: entry.progress,
                        color: WidgetConstants.accentGreen
                    )

                    Spacer().frame(height: 4)

                    HStack {
                        Text(entry.isPrivate ? "**%" : String(format: "%.0f%%", entry.progress * 100))
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                            .foregroundColor(WidgetConstants.accentGreen)
                        Spacer()
                        Text(entry.isPrivate ? "****" : formatAmount(goal.targetAmount))
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white.opacity(WidgetConstants.textTertiary))
                    }
                } else {
                    Spacer()
                    EmptyWidgetView(icon: "target", message: "Hedef Ekle")
                    Spacer()
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .widgetURL(URL(string: "kredy://goals"))
    }

    private func formatAmount(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "%.0fK ₺", value / 1000)
        }
        return String(format: "%.0f ₺", value)
    }
}

struct SavingsGoalWidget: Widget {
    let kind = "SavingsGoalWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SavingsGoalProvider()) { entry in
            if #available(iOS 17.0, *) {
                SavingsGoalView(entry: entry)
                    .containerBackground(for: .widget) { PremiumWidgetBackground() }
            } else {
                SavingsGoalView(entry: entry)
            }
        }
        .configurationDisplayName("Tasarruf Hedefi")
        .description("Tasarruf hedefinizin ilerleme durumunu takip edin")
        .supportedFamilies([.systemSmall])
    }
}
