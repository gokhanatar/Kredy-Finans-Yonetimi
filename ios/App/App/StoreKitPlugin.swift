import Foundation
import StoreKit
import Capacitor
import UIKit

@available(iOS 15.0, *)
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isBillingSupported", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentOfferCodeRedeemSheet", returnType: CAPPluginReturnPromise),
    ]

    private var transactionTask: Task<Void, Never>?

    override public func load() {
        startTransactionListener()
    }

    deinit {
        transactionTask?.cancel()
    }

    // MARK: - Transaction Listener

    private func startTransactionListener() {
        transactionTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self else { return }
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    await self.emitCurrentEntitlements()
                }
            }
        }
    }

    private func emitCurrentEntitlements() async {
        let purchases = await fetchCurrentEntitlements()
        notifyListeners("transactionUpdated", data: ["purchases": purchases])
    }

    // MARK: - Plugin Methods

    @objc func isBillingSupported(_ call: CAPPluginCall) {
        call.resolve(["isBillingSupported": true])
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let identifiers = call.getArray("productIdentifiers", String.self) else {
            call.reject("productIdentifiers is required")
            return
        }

        Task {
            do {
                let storeProducts = try await Product.products(for: Set(identifiers))

                let products: [[String: Any]] = storeProducts.map { product in
                    var dict: [String: Any] = [
                        "productIdentifier": product.id,
                        "title": product.displayName,
                        "localizedTitle": product.displayName,
                        "description": product.description,
                        "localizedDescription": product.description,
                        "localizedPrice": product.displayPrice,
                        "price": "\(product.price)",
                        "currencyCode": product.priceFormatStyle.currencyCode,
                    ]

                    if let subscription = product.subscription {
                        let unit = subscription.subscriptionPeriod.unit
                        let value = subscription.subscriptionPeriod.value
                        dict["subscriptionPeriodUnit"] = Self.periodUnitString(unit)
                        dict["subscriptionPeriodValue"] = value
                    }

                    return dict
                }

                call.resolve(["products": products])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productIdentifier") else {
            call.reject("productIdentifier is required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])

                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve([
                            "transactionId": "\(transaction.id)",
                            "productIdentifier": transaction.productID,
                        ])
                    case .unverified(_, let error):
                        call.reject("Transaction verification failed: \(error.localizedDescription)")
                    }

                case .userCancelled:
                    call.reject("USER_CANCELLED", "USER_CANCELLED", nil)

                case .pending:
                    call.reject("Transaction is pending approval")

                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                let purchases = await fetchCurrentEntitlements()
                call.resolve(["purchases": purchases])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func getPurchases(_ call: CAPPluginCall) {
        Task {
            let purchases = await fetchCurrentEntitlements()
            call.resolve(["purchases": purchases])
        }
    }

    @objc func presentOfferCodeRedeemSheet(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                if #available(iOS 16.0, *) {
                    guard let windowScene = self.bridge?.webView?.window?.windowScene else {
                        call.reject("Could not find window scene")
                        return
                    }
                    try await AppStore.presentOfferCodeRedeemSheet(in: windowScene)
                    // After redemption, check entitlements
                    let purchases = await self.fetchCurrentEntitlements()
                    self.notifyListeners("transactionUpdated", data: ["purchases": purchases])
                    call.resolve(["success": true, "purchases": purchases])
                } else {
                    // iOS 15 fallback — StoreKit 1 API
                    SKPaymentQueue.default().presentCodeRedemptionSheet()
                    // StoreKit 1 doesn't have async completion, rely on transaction listener
                    call.resolve(["success": true, "purchases": []])
                }
            } catch {
                call.reject("Offer code redemption failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Helpers

    private func fetchCurrentEntitlements() async -> [[String: Any]] {
        var purchases: [[String: Any]] = []

        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                var dict: [String: Any] = [
                    "productIdentifier": transaction.productID,
                    "isActive": true,
                    "purchaseState": "PURCHASED",
                    "transactionId": "\(transaction.id)",
                ]

                if let expirationDate = transaction.expirationDate {
                    dict["expirationDate"] = ISO8601DateFormatter().string(from: expirationDate)
                    dict["isActive"] = expirationDate > Date()
                }

                purchases.append(dict)
            }
        }

        return purchases
    }

    private static func periodUnitString(_ unit: Product.SubscriptionPeriod.Unit) -> String {
        switch unit {
        case .day: return "day"
        case .week: return "week"
        case .month: return "month"
        case .year: return "year"
        @unknown default: return "unknown"
        }
    }
}
