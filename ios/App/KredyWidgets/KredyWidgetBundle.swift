import SwiftUI
import WidgetKit

@main
struct KredyWidgetBundle: WidgetBundle {
    var body: some Widget {
        DebtStatusWidget()
        WalletBarometerWidget()
        NextPaymentWidget()
        AccountBalanceWidget()
        SavingsGoalWidget()
        PortfolioWidget()
    }
}
