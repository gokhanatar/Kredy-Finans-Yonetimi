import SwiftUI
import WidgetKit

// Placeholder view for empty state
struct EmptyWidgetView: View {
    let icon: String
    let message: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 26))
                .foregroundColor(.white.opacity(WidgetConstants.textTertiary))
            Text(message)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.white.opacity(WidgetConstants.textSecondary))
                .multilineTextAlignment(.center)
        }
    }
}

// Progress bar
struct WidgetProgressBar: View {
    let progress: Double // 0.0 - 1.0
    let color: Color

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(Color.white.opacity(0.12))
                    .frame(height: 6)
                RoundedRectangle(cornerRadius: 3)
                    .fill(color)
                    .frame(width: max(0, geo.size.width * min(progress, 1.0)), height: 6)
            }
        }
        .frame(height: 6)
    }
}
