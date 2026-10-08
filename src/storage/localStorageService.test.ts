// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { localStorageService as storage } from "./localStorageService";
import type { Registration } from "../types";

const sample: Registration = {
  id: "id-1",
  eventName: "Salon",
  firstName: "Léa",
  lastName: "Martin",
  email: "lea@example.com",
  postalCode: "01400",
  adults: 0,
  children: 2,
  consent: true,
  createdAt: "2026-10-08T17:00:00.000Z",
};

describe("localStorageService", () => {
  beforeEach(() => localStorage.clear());
  it("stores and retrieves registrations across service reads", () => {
    storage.addRegistration(sample);
    expect(storage.getRegistrations()).toEqual([sample]);
  });
  it("clears registrations while preserving the event name", () => {
    storage.setEventName("Salon");
    storage.addRegistration(sample);
    storage.clearRegistrations();
    expect(storage.getRegistrations()).toEqual([]);
    expect(storage.getEventName()).toBe("Salon");
  });
  it("stores the event name and safely recovers from corrupted registration JSON", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    storage.setEventName("Festival");
    localStorage.setItem("ludylab_registrations", "{");
    expect(storage.getEventName()).toBe("Festival");
    expect(storage.getRegistrations()).toEqual([]);
    expect(log).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
