import type { Registration } from "./types";

const columns: (keyof Registration)[] = [
  "createdAt",
  "lastName",
  "firstName",
  "email",
  "postalCode",
  "adults",
  "children",
  "consent",
  "eventName",
];
const labels = [
  "Date",
  "Nom",
  "Prénom",
  "Email",
  "Code postal",
  "Adultes",
  "Enfants",
  "Consentement",
  "Événement",
];
const cell = (value: unknown) => {
  const text = String(value ?? "");
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
};

export function registrationsToCsv(registrations: Registration[]) {
  return (
    "\uFEFF" +
    [
      labels,
      ...registrations.map((row) =>
        columns.map((key) =>
          key === "consent" ? (row.consent ? "Oui" : "Non") : row[key],
        ),
      ),
    ]
      .map((row) => row.map(cell).join(";"))
      .join("\r\n")
  );
}

export function fileSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "evenement"
  );
}
