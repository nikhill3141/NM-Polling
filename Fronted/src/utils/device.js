const DEVICE_KEY = "nm_polling_device_id";

// Anonymous voting uses this browser-stored ID to reduce repeated votes per device.
export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}
