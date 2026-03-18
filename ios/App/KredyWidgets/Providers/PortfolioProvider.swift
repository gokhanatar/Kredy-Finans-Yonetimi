import WidgetKit
import SwiftUI

struct PortfolioEntry: TimelineEntry {
    let date: Date
    let portfolioValue: Double
    let portfolioPnl: Double
    let portfolioPnlPercent: Double
    let hasData: Bool
    let isPrivate: Bool
    let isPlaceholder: Bool
}

struct PortfolioProvider: TimelineProvider {
    func placeholder(in context: Context) -> PortfolioEntry {
        makeEntry(from: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (PortfolioEntry) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        completion(makeEntry(from: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PortfolioEntry>) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        let entry = makeEntry(from: payload, isPlaceholder: false)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func makeEntry(from payload: WidgetPayload, isPlaceholder: Bool) -> PortfolioEntry {
        if let value = payload.portfolioValue, value > 0 {
            return PortfolioEntry(
                date: Date(),
                portfolioValue: value,
                portfolioPnl: payload.portfolioPnl ?? 0,
                portfolioPnlPercent: payload.portfolioPnlPercent ?? 0,
                hasData: true,
                isPrivate: payload.privacyMode,
                isPlaceholder: isPlaceholder
            )
        }

        return PortfolioEntry(
            date: Date(),
            portfolioValue: 0,
            portfolioPnl: 0,
            portfolioPnlPercent: 0,
            hasData: false,
            isPrivate: payload.privacyMode,
            isPlaceholder: isPlaceholder
        )
    }
}
