import type { Registration, StorageService } from "../types";

const REGISTRATIONS_KEY = "ludylab_registrations";
const EVENT_KEY = "ludylab_event_name";

function readRegistrations(): Registration[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(REGISTRATIONS_KEY) ?? "[]",
    );
    return Array.isArray(value) ? (value as Registration[]) : [];
  } catch (error) {
    console.error("Impossible de lire les inscriptions locales.", error);
    return [];
  }
}

export const localStorageService: StorageService = {
  getRegistrations: readRegistrations,
  addRegistration(registration) {
    const registrations = readRegistrations();
    registrations.push(registration);
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
  },
  clearRegistrations() {
    localStorage.removeItem(REGISTRATIONS_KEY);
  },
  getEventName() {
    try {
      return localStorage.getItem(EVENT_KEY) || "Événement Ludylab";
    } catch (error) {
      console.error("Impossible de lire la configuration locale.", error);
      return "Événement Ludylab";
    }
  },
  setEventName(eventName) {
    localStorage.setItem(EVENT_KEY, eventName);
  },
};
