import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin {

    @objc func updateWidget(_ call: CAPPluginCall) {
        guard let payload = call.getString("payload") else {
            call.reject("Missing payload")
            return
        }
        let groupID = "group.com.finansatlas.app"
        if let defaults = UserDefaults(suiteName: groupID) {
            defaults.set(payload, forKey: "widgetPayload")
            defaults.synchronize()
        }
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve(["success": true])
    }

    @objc func reloadWidgets(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve(["success": true])
    }
}
