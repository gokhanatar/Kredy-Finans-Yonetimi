import WidgetKit
import SwiftUI

struct NextPaymentEntry: TimelineEntry {
    let date: Date
    let nextCard: WidgetCardData?
    let daysUntilDue: Int
    let isPrivate: Bool
    let isPlaceholder: Bool
}

struct NextPaymentProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextPaymentEntry {
        makeEntry(from: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (NextPaymentEntry) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        completion(makeEntry(from: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NextPaymentEntry>) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        let entry = makeEntry(from: payload, isPlaceholder: false)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 3, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func makeEntry(from payload: WidgetPayload, isPlaceholder: Bool) -> NextPaymentEntry {
        let today = Calendar.current.component(.day, from: Date())
        let nextCard = payload.cards
            .filter { $0.currentDebt > 0 }
            .sorted { a, b in
                let daysA = a.dueDate >= today ? a.dueDate - today : 30 - today + a.dueDate
                let daysB = b.dueDate >= today ? b.dueDate - today : 30 - today + b.dueDate
                return daysA < daysB
            }
            .first
        let days: Int
        if let card = nextCard {
            days = card.dueDate >= today ? card.dueDate - today : 30 - today + card.dueDate
        } else {
            days = 0
        }
        return NextPaymentEntry(
            date: Date(),
            nextCard: nextCard,
            daysUntilDue: days,
            isPrivate: payload.privacyMode,
            isPlaceholder: isPlaceholder
        )
    }
}
