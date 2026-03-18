import Foundation

struct WidgetCardData: Codable {
    let id: String
    let bankName: String
    let lastFourDigits: String
    let limit: Double
    let currentDebt: Double
    let dueDate: Int
    let color: String
}

struct WidgetAccountData: Codable {
    let id: String
    let name: String
    let balance: Double
    let type: String
    let icon: String
    let bankName: String?
}

struct WidgetGoalData: Codable {
    let id: String
    let name: String
    let targetAmount: Double
    let currentAmount: Double
    let icon: String
}

struct WidgetPortfolioCategoryData: Codable {
    let name: String
    let value: Double
    let pnlPercent: Double
}

struct WidgetPayload: Codable {
    let cards: [WidgetCardData]
    let accounts: [WidgetAccountData]
    let goals: [WidgetGoalData]
    let totalDebt: Double
    let totalLimit: Double
    let utilizationRate: Double
    let privacyMode: Bool
    let updatedAt: String
    // Portfolio (optional — backward compatible with older payloads)
    let portfolioValue: Double?
    let portfolioCost: Double?
    let portfolioPnl: Double?
    let portfolioPnlPercent: Double?
    let portfolioCategories: [WidgetPortfolioCategoryData]?
}

extension WidgetPayload {
    static func load() -> WidgetPayload? {
        guard let defaults = UserDefaults(suiteName: WidgetConstants.appGroupID),
              let jsonString = defaults.string(forKey: WidgetConstants.dataKey),
              let data = jsonString.data(using: .utf8) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetPayload.self, from: data)
    }

    static var placeholder: WidgetPayload {
        WidgetPayload(
            cards: [
                WidgetCardData(id: "demo", bankName: "Banka", lastFourDigits: "1234", limit: 50000, currentDebt: 15000, dueDate: 15, color: "from-blue-600 to-blue-800")
            ],
            accounts: [
                WidgetAccountData(id: "demo1", name: "Vadesiz Hesap", balance: 12500, type: "bank", icon: "building-2", bankName: "Banka"),
                WidgetAccountData(id: "demo2", name: "Nakit", balance: 3200, type: "cash", icon: "wallet", bankName: nil)
            ],
            goals: [
                WidgetGoalData(id: "demo", name: "Tatil Fonu", targetAmount: 50000, currentAmount: 32500, icon: "target")
            ],
            totalDebt: 15000,
            totalLimit: 50000,
            utilizationRate: 30,
            privacyMode: false,
            updatedAt: ISO8601DateFormatter().string(from: Date()),
            portfolioValue: 125000,
            portfolioCost: 100000,
            portfolioPnl: 25000,
            portfolioPnlPercent: 25.0,
            portfolioCategories: [
                WidgetPortfolioCategoryData(name: "Altın", value: 75000, pnlPercent: 30),
                WidgetPortfolioCategoryData(name: "Hisse", value: 50000, pnlPercent: 15)
            ]
        )
    }
}
