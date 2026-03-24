import WidgetKit
import SwiftUI

struct SavingsGoalEntry: TimelineEntry {
    let date: Date
    let goal: WidgetGoalData?
    let progress: Double
    let isPrivate: Bool
    let isPlaceholder: Bool
}

struct SavingsGoalProvider: TimelineProvider {
    func placeholder(in context: Context) -> SavingsGoalEntry {
        makeEntry(from: .placeholder, isPlaceholder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (SavingsGoalEntry) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        completion(makeEntry(from: payload, isPlaceholder: context.isPreview))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SavingsGoalEntry>) -> Void) {
        let payload = WidgetPayload.load() ?? .placeholder
        let entry = makeEntry(from: payload, isPlaceholder: false)
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func makeEntry(from payload: WidgetPayload, isPlaceholder: Bool) -> SavingsGoalEntry {
        let goal = payload.goals.first
        let progress: Double
        if let g = goal, g.targetAmount > 0 {
            progress = min(g.currentAmount / g.targetAmount, 1.0)
        } else {
            progress = 0
        }
        return SavingsGoalEntry(
            date: Date(),
            goal: goal,
            progress: progress,
            isPrivate: payload.privacyMode,
            isPlaceholder: isPlaceholder
        )
    }
}
