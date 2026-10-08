import { describe, expect, it } from "vitest";
import { fileSlug, registrationsToCsv } from "./export";
import type { Registration } from "./types";

const sample: Registration = {
  id: "id",
  eventName: "Salon du Jeu",
  firstName: "Léa",
  lastName: "Martin",
  email: "lea@example.com",
  postalCode: "01400",
  adults: 1,
  children: 2,
  consent: true,
  createdAt: "2026-10-08T17:00:00.000Z",
};

describe("exports", () => {
  it("exports event, date, and all registration fields to spreadsheet friendly CSV", () => {
    const csv = registrationsToCsv([sample]);
    expect(csv).toContain("\uFEFF");
    expect(csv).toContain("Martin");
    expect(csv).toContain("Léa");
    expect(csv).toContain("lea@example.com");
    expect(csv).toContain("01400");
    expect(csv).toContain('"1";"2";"Oui"');
    expect(csv).toContain("Salon du Jeu");
    expect(csv).toContain(sample.createdAt);
  });
  it("creates a readable event filename", () => {
    expect(fileSlug("Salon du Jeu 2026")).toBe("salon-du-jeu-2026");
  });
  it("protects spreadsheet cells from formula execution", () => {
    const csv = registrationsToCsv([{ ...sample, firstName: "=1+1" }]);
    expect(csv).toContain("'=1+1");
  });
});
