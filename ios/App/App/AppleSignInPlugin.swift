import Capacitor
import AuthenticationServices

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    private var pluginCall: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        self.pluginCall = call
        DispatchQueue.main.async {
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
            pluginCall?.reject("Invalid credential")
            return
        }
        var result: [String: Any] = ["user": credential.user]
        if let identityToken = credential.identityToken,
           let tokenString = String(data: identityToken, encoding: .utf8) {
            result["identityToken"] = tokenString
        }
        if let authCode = credential.authorizationCode,
           let codeString = String(data: authCode, encoding: .utf8) {
            result["authorizationCode"] = codeString
        }
        if let fullName = credential.fullName {
            result["givenName"] = fullName.givenName ?? ""
            result["familyName"] = fullName.familyName ?? ""
        }
        if let email = credential.email {
            result["email"] = email
        }
        pluginCall?.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let authError = error as? ASAuthorizationError
        if authError?.code == .canceled {
            pluginCall?.reject("Sign in canceled")
        } else {
            pluginCall?.reject(error.localizedDescription)
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        return bridge?.viewController?.view.window ?? UIWindow()
    }
}
