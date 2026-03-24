import WidgetKit
import SwiftUI

struct WalletBarometerEntry: TimelineEntry {
    let date: Date
    let totalBalance: Double
    let accountCount: Int
    let accounts: [WidgetAccountData]
    let isPrivate: Bool
    let isPlaceholder: Bool
}

struct WalletBarometerProvider: TimelineProvider {
    func placeholder(in context: Context) -> WalletBarometerEntry {
        makeEntry(from: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (WalletBarometerEntry) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        completion(makeEntry(from: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WalletBarometerEntry>) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        let entry = makeEntry(from: payload, isPlaceholder: false)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func makeEntry(from payload: WidgetPayload, isPlaceholder: Bool) -> WalletBarometerEntry {
        let total = payload.accounts.reduce(0) { $0 + $1.balance }
        return WalletBarometerEntry(
            date: Date(),
            totalBalance: total,
            accountCount: payload.accounts.count,
            accounts: Array(payload.accounts.prefix(3)),
            isPrivate: payload.privacyMode,
            isPlaceholder: isPlaceholder
        )
    }
}
