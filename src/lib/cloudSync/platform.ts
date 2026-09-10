import { Capacitor } from "@capacitor/core";

// CloudSyncPlugin only exists in the iOS native shell — calling it on the
// plain web build or a future Android build would just reject with
// "plugin not implemented," so gate on this first everywhere.
export function isCloudSyncSupported(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}
