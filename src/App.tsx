import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  LockKeyhole,
  Users,
  UserRound,
  Sparkles,
  Maximize,
} from "lucide-react";
import { localStorageService as storage } from "./storage/localStorageService";
import { validateRegistration } from "./validation";
import { fileSlug, registrationsToCsv } from "./export";
import type { Registration, RegistrationInput } from "./types";
import ludylabLogo from "./assets/ludylab-logo.png";

const empty: RegistrationInput = {
  firstName: "",
  lastName: "",
  email: "",
  postalCode: "",
  adults: 0,
  children: 0,
  consent: false,
};
const ADMIN_HASH_KEY = "ludylab_admin_hash";

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export default function App() {
  const [admin, setAdmin] = useState(location.hash === "#/admin");
  const [signedIn, setSignedIn] = useState(false);
  const [eventName, setEventName] = useState(storage.getEventName());
  const [registrations, setRegistrations] = useState(
    storage.getRegistrations(),
  );
  const [form, setForm] = useState<RegistrationInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [screen, setScreen] = useState<
    "form" | "saving" | "success" | "failure"
  >("form");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const submitting = useRef(false);

  useEffect(() => {
    const onHash = () => {
      setAdmin(location.hash === "#/admin");
      setSignedIn(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (screen !== "success") return;
    const timeout = window.setTimeout(() => {
      submitting.current = false;
      setForm(empty);
      setErrors({});
      setScreen("form");
    }, 10000);
    return () => window.clearTimeout(timeout);
  }, [screen]);

  const totals = useMemo(
    () =>
      registrations.reduce(
        (sum, item) => ({
          adults: sum.adults + item.adults,
          children: sum.children + item.children,
        }),
        { adults: 0, children: 0 },
      ),
    [registrations],
  );

  function update<K extends keyof RegistrationInput>(
    key: K,
    value: RegistrationInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen may be unavailable in embedded or older mobile browsers.
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || screen !== "form") return;
    const invalid = validateRegistration(form);
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    submitting.current = true;
    setScreen("saving");
    try {
      const item: Registration = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        postalCode: form.postalCode,
        adults: form.adults,
        children: form.children,
        consent: true,
        id: crypto.randomUUID(),
        eventName,
        createdAt: new Date().toISOString(),
      };
      storage.addRegistration(item);
      setRegistrations(storage.getRegistrations());
      setScreen("success");
    } catch (error) {
      console.error("Échec de l’enregistrement de l’inscription.", error);
      submitting.current = false;
      setScreen("failure");
    }
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    const expected = localStorage.getItem(ADMIN_HASH_KEY);
    if (!expected) {
      if (newPassword.trim().length < 8) {
        setNotice("Choisissez un mot de passe d’au moins 8 caractères.");
        return;
      }
      localStorage.setItem(ADMIN_HASH_KEY, await hashPassword(newPassword));
      setSignedIn(true);
      setNotice("Mot de passe administrateur enregistré sur cette tablette.");
      return;
    }
    if ((await hashPassword(password)) === expected) {
      setSignedIn(true);
      setNotice("");
    } else setNotice("Mot de passe incorrect.");
  }

  function saveEvent(event: FormEvent) {
    event.preventDefault();
    const value = eventName.trim();
    if (!value) {
      setNotice("Le nom de l’événement ne peut pas être vide.");
      return;
    }
    try {
      storage.setEventName(value);
      setEventName(value);
      setNotice("Événement mis à jour.");
    } catch (error) {
      console.error(error);
      setNotice("Impossible d’enregistrer ce nom sur la tablette.");
    }
  }

  function exportFile(kind: "csv" | "json") {
    const data =
      kind === "csv"
        ? registrationsToCsv(registrations)
        : JSON.stringify(registrations, null, 2);
    const blob = new Blob([data], {
      type:
        kind === "csv"
          ? "text/csv;charset=utf-8"
          : "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ludylab-${fileSlug(eventName)}-${new Date().toISOString().slice(0, 10)}.${kind}`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function resetEvent() {
    if (
      !window.confirm(
        "Attention\n\nCette action va supprimer toutes les inscriptions enregistrées sur cette tablette. Exportez les données avant de continuer.\n\nVoulez-vous vraiment continuer ?",
      )
    )
      return;
    try {
      storage.clearRegistrations();
      storage.setEventName("");
      setRegistrations([]);
      setEventName("");
      setNotice(
        "Inscriptions supprimées. Saisissez le nom du nouvel événement.",
      );
    } catch (error) {
      console.error(error);
      setNotice("Impossible de supprimer les inscriptions locales.");
    }
  }

  if (admin)
    return (
      <main className="admin-shell">
        <header className="admin-header">
          <a className="back-link" href="#/" onClick={() => setSignedIn(false)}>
            <ArrowLeft size={19} /> Accueil visiteurs
          </a>
          <Brand />
        </header>
        {!signedIn ? (
          <section className="login-card">
            <span className="icon-disc">
              <LockKeyhole />
            </span>
            <p className="eyebrow">ESPACE ORGANISATEUR</p>
            <h1>Administration</h1>
            <p className="muted">
              Les données sont enregistrées sur cette tablette.
            </p>
            <form onSubmit={authenticate} className="stack-form">
              {!localStorage.getItem(ADMIN_HASH_KEY) ? (
                <>
                  <label htmlFor="new-password">
                    Créer le mot de passe administrateur
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="helper">
                    Première visite sur cette tablette · 8 caractères minimum
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="admin-password">Mot de passe</label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </>
              )}
              {notice && (
                <p role="status" className="notice">
                  {notice}
                </p>
              )}
              <button className="button primary" type="submit">
                {localStorage.getItem(ADMIN_HASH_KEY)
                  ? "Se connecter"
                  : "Créer l’accès"}
              </button>
            </form>
          </section>
        ) : (
          <section className="dashboard">
            <div className="dashboard-title">
              <div>
                <p className="eyebrow">TABLEAU DE BORD</p>
                <h1>Administration</h1>
                <p className="muted">
                  Événement actuel : <strong>{eventName || "À définir"}</strong>
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() => {
                  setSignedIn(false);
                  setPassword("");
                }}
              >
                Verrouiller
              </button>
            </div>
            <div className="stats">
              <article>
                <span className="icon-disc">
                  <Users />
                </span>
                <p>Groupes inscrits</p>
                <strong>{registrations.length}</strong>
              </article>
              <article>
                <span className="icon-disc">
                  <UserRound />
                </span>
                <p>Adultes</p>
                <strong>{totals.adults}</strong>
              </article>
              <article>
                <span className="icon-disc">
                  <Sparkles />
                </span>
                <p>Enfants</p>
                <strong>{totals.children}</strong>
              </article>
              <article className="total-stat">
                <span className="icon-disc">
                  <Users />
                </span>
                <p>Total visiteurs</p>
                <strong>{totals.adults + totals.children}</strong>
              </article>
            </div>
            <section className="panel">
              <h2>Événement</h2>
              <form className="event-form" onSubmit={saveEvent}>
                <label className="sr-only" htmlFor="event-name">
                  Nom de l’événement
                </label>
                <input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ex. Salon du Jeu 2026"
                />
                <button className="button primary" type="submit">
                  Enregistrer
                </button>
              </form>
              {notice && (
                <p className="notice" role="status">
                  {notice}
                </p>
              )}
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Inscriptions</h2>
                  <p className="muted">
                    {registrations.length} groupe
                    {registrations.length !== 1 ? "s" : ""} enregistré
                    {registrations.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="export-actions">
                  <button
                    className="button secondary"
                    onClick={() => exportFile("csv")}
                  >
                    <Download size={18} /> Export CSV
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => exportFile("json")}
                  >
                    JSON
                  </button>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Email</th>
                      <th>Code postal</th>
                      <th>Adultes</th>
                      <th>Enfants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations
                      .slice()
                      .reverse()
                      .map((item) => (
                        <tr key={item.id}>
                          <td>
                            {new Date(item.createdAt).toLocaleString("fr-FR")}
                          </td>
                          <td>{item.lastName}</td>
                          <td>{item.firstName}</td>
                          <td>{item.email}</td>
                          <td>{item.postalCode}</td>
                          <td>{item.adults}</td>
                          <td>{item.children}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {registrations.length === 0 && (
                  <p className="empty-state">
                    Aucune inscription pour le moment.
                  </p>
                )}
              </div>
            </section>
            <section className="reset-panel">
              <div>
                <h2>Nouvel événement</h2>
                <p>
                  Supprime les inscriptions de cette tablette et permet de
                  préparer un autre événement.
                </p>
              </div>
              <button className="button danger" onClick={resetEvent}>
                Réinitialiser les inscriptions
              </button>
            </section>
          </section>
        )}
      </main>
    );

  return (
    <main className="visitor-shell">
      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <span className="event-pill">{eventName}</span>
          <button
            className="fullscreen-button"
            type="button"
            onClick={toggleFullscreen}
            aria-label="Activer ou quitter le plein écran"
            title="Plein écran"
          >
            <Maximize size={18} />
          </button>
        </div>
      </header>
      {screen === "success" ? (
        <section className="result-card" aria-live="polite">
          <span className="success-mark">
            <Check size={46} />
          </span>
          <p className="eyebrow">C’EST NOTÉ !</p>
          <h1>Merci {form.firstName} !</h1>
          <p className="result-copy">
            Votre inscription a bien été enregistrée.
          </p>
          <p className="muted">À très bientôt chez Ludylab !</p>
          <div className="countdown">
            <span /> Retour à l’accueil dans quelques secondes
          </div>
          <button
            className="button secondary"
            onClick={() => {
              submitting.current = false;
              setForm(empty);
              setScreen("form");
            }}
          >
            Terminer maintenant
          </button>
        </section>
      ) : screen === "failure" ? (
        <section className="result-card">
          <span className="failure-mark">!</span>
          <h1>Une erreur est survenue</h1>
          <p className="result-copy">
            Votre inscription n’a pas pu être enregistrée.
            <br />
            Veuillez réessayer.
          </p>
          <button className="button primary" onClick={() => setScreen("form")}>
            Revenir au formulaire
          </button>
        </section>
      ) : (
        <section className="form-layout">
          <div className="intro">
            <span className="eyebrow">BIENVENUE CHEZ LUDYLAB</span>
            <h1>
              On est ravis{" "}
              <br />
              de vous accueillir<span className="period">.</span>
            </h1>
            <p>Quelques informations et c’est parti !</p>
            <div className="intro-decoration">
              <span>Le jeu nous rassemble</span>
              <Sparkles size={24} />
            </div>
          </div>
          <form className="registration-card" onSubmit={submit} noValidate>
            <div className="card-title">
              <div>
                <p className="eyebrow">INSCRIPTION VISITEUR</p>
                <h2>Faisons connaissance</h2>
              </div>
              <span className="required-note">* obligatoire</span>
            </div>
            <div className="fields two-cols">
              <Field
                label="Nom"
                id="lastName"
                value={form.lastName}
                error={errors.lastName}
                onChange={(value) => update("lastName", value)}
                autoComplete="family-name"
              />
              <Field
                label="Prénom"
                id="firstName"
                value={form.firstName}
                error={errors.firstName}
                onChange={(value) => update("firstName", value)}
                autoComplete="given-name"
              />
              <Field
                label="Adresse email"
                id="email"
                value={form.email}
                error={errors.email}
                onChange={(value) => update("email", value)}
                type="email"
                autoComplete="email"
                className="wide"
              />
              <Field
                label="Code postal"
                id="postalCode"
                value={form.postalCode}
                error={errors.postalCode}
                onChange={(value) =>
                  update("postalCode", value.replace(/\D/g, "").slice(0, 5))
                }
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
              />
              <div className="group-count">
                <span className="field-label">Votre groupe</span>
                <div className="count-grid">
                  <Counter
                    label="Adultes"
                    value={form.adults}
                    onChange={(value) => update("adults", value)}
                  />
                  <Counter
                    label="Enfants"
                    value={form.children}
                    onChange={(value) => update("children", value)}
                  />
                </div>
              </div>
            </div>
            <label className={`consent ${errors.consent ? "invalid" : ""}`}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => update("consent", e.target.checked)}
              />
              <span>
                J’accepte que mes informations soient utilisées pour gérer mon
                inscription à cet événement. <span className="required">*</span>
              </span>
            </label>
            {errors.consent && (
              <p className="field-error" role="alert">
                {errors.consent}
              </p>
            )}
            <p className="privacy-note">
              Vos données restent sur cette tablette et servent uniquement au
              suivi de l’événement.
            </p>
            <button
              className="button primary submit-button"
              type="submit"
              disabled={screen === "saving"}
            >
              {screen === "saving" ? "Enregistrement…" : "Je m’inscris"}
              <span>→</span>
            </button>
          </form>
        </section>
      )}
      <footer className="visitor-footer">
        <span>Un événement ludique signé Ludylab</span>
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <a className="brand" href="#/" aria-label="Ludylab accueil">
      <img src={ludylabLogo} alt="LUDyLAB — Fun & Learn" />
    </a>
  );
}

function Field({
  label,
  id,
  value,
  error,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  className = "",
}: {
  label: string;
  id: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "numeric" | "email";
  autoComplete?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>
        {label} <span className="required">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="counter">
      <span>{label}</span>
      <div>
        <button
          type="button"
          aria-label={`Diminuer ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <output>{value}</output>
        <button
          type="button"
          aria-label={`Augmenter ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
