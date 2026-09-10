import Capacitor

// Capacitor auto-registers plugins installed via npm (it reads their name
// out of capacitor.config.json at build time), but CloudSyncPlugin is
// in-app-only code, so it needs a manual registerPluginInstance call.
// capacitorDidLoad() is the hook Capacitor's own docs point to for this —
// Main.storyboard's root view controller class is swapped to this subclass
// (was CAPBridgeViewController directly) to get access to it.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(CloudSyncPlugin())
    }
}
