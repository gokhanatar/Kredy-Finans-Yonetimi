import WidgetKit
import SwiftUI

struct DebtStatusEntry: TimelineEntry {
    let date: Date
    let totalDebt: Double
    let totalLimit: Double
    let utilizationRate: Double
    let cardCount: Int
    let isPrivate: Bool
    let isPlaceholder: Bool
}

struct DebtStatusProvider: TimelineProvider {
    func placeholder(in context: Context) -> DebtStatusEntry {
        makeEntry(from: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (DebtStatusEntry) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        completion(makeEntry(from: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DebtStatusEntry>) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        let entry = makeEntry(from: payload, isPlaceholder: false)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func makeEntry(from payload: WidgetPayload, isPlaceholder: Bool) -> DebtStatusEntry {
        DebtStatusEntry(
            date: Date(),
            totalDebt: payload.totalDebt,
            totalLimit: payload.totalLimit,
            utilizationRate: payload.utilizationRate,
            cardCount: payload.cards.count,
            isPrivate: payload.privacyMode,
            isPlaceholder: isPlaceholder
        )
    }
}
