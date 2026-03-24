import SwiftUI

enum WidgetConstants {
    static let appGroupID = "group.com.finansatlas.app"
    static let dataKey = "widgetPayload"

    // Opacity constants
    static let textPrimary: Double = 0.95
    static let textSecondary: Double = 0.70
    static let textTertiary: Double = 0.45

    // Colors
    static let accentGreen = Color(red: 0.18, green: 0.80, blue: 0.44)
    static let accentRose  = Color(red: 0.95, green: 0.30, blue: 0.35)
    static let accentBlue  = Color(red: 0.24, green: 0.56, blue: 0.98)
    static let accentAmber = Color(red: 0.98, green: 0.68, blue: 0.13)
}

// MARK: - Shared UI Components

struct PremiumWidgetBackground: View {
    var body: some View {
        LinearGradient(
            colors: [
                Color(red: 0.07, green: 0.07, blue: 0.16),
                Color(red: 0.12, green: 0.10, blue: 0.22)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}

struct WidgetLabel: View {
    let title: String
    let icon: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 8, weight: .semibold))
            Text(title)
                .font(.system(size: 8, weight: .semibold, design: .rounded))
                .kerning(0.8)
        }
        .foregroundColor(.white.opacity(WidgetConstants.textTertiary))
    }
}

struct AmountText: View {
    let amount: Double
    let isPrivate: Bool
    let font: Font
    let color: Color
    let compact: Bool

    init(_ amount: Double, isPrivate: Bool, font: Font = .headline, color: Color = .white, compact: Bool = false) {
        self.amount = amount
        self.isPrivate = isPrivate
        self.font = font
        self.color = color
        self.compact = compact
    }

    var body: some View {
        Text(isPrivate ? "****" : formattedAmount)
            .font(font)
            .foregroundColor(color)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
    }

    private var formattedAmount: String {
        if compact && abs(amount) >= 1_000_000 {
            return String(format: "%.1fM ₺", amount / 1_000_000)
        }
        if compact && abs(amount) >= 1_000 {
            return String(format: "%.1fK ₺", amount / 1_000)
        }
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.maximumFractionDigits = 0
        formatter.groupingSeparator = "."
        return (formatter.string(from: NSNumber(value: amount)) ?? "0") + " ₺"
    }
}
