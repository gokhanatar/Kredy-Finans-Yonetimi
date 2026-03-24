import WidgetKit
import SwiftUI

struct AccountBalanceEntry: TimelineEntry {
    let date: Date
    let totalBalance: Double
    let accounts: [WidgetAccountData]
    let isPrivate: Bool
    let isPlaceholder: Bool
}

struct AccountBalanceProvider: TimelineProvider {
    func placeholder(in context: Context) -> AccountBalanceEntry {
        makeEntry(from: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (AccountBalanceEntry) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        completion(makeEntry(from: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AccountBalanceEntry>) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        let entry = makeEntry(from: payload, isPlaceholder: false)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func makeEntry(from payload: WidgetPayload, isPlaceholder: Bool) -> AccountBalanceEntry {
        let total = payload.accounts.reduce(0) { $0 + $1.balance }
        return AccountBalanceEntry(
            date: Date(),
            totalBalance: total,
            accounts: Array(payload.accounts.prefix(2)),
            isPrivate: payload.privacyMode,
            isPlaceholder: isPlaceholder
        )
    }
}
