export interface Registration {
  id: string;
  eventName: string;
  firstName: string;
  lastName: string;
  email: string;
  postalCode: string;
  adults: number;
  children: number;
  consent: boolean;
  createdAt: string;
}

export interface RegistrationInput extends Omit<
  Registration,
  "id" | "eventName" | "createdAt"
> {
  consent: boolean;
}

export interface StorageService {
  getRegistrations(): Registration[];
  addRegistration(registration: Registration): void;
  clearRegistrations(): void;
  getEventName(): string;
  setEventName(eventName: string): void;
}
