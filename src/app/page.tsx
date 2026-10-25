"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import { getIcons, INCIDENT_TYPES, type IncidentIcons } from "../lib/icons";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      remove: (widgetId?: string) => void;
    };
  }
}

const MapContainer = dynamic<any>(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic<any>(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic<any>(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

const Popup = dynamic<any>(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

type Incident = {
  id: number;
  type: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  incident_time?: string | null;
  media_url?: string | null;
  media_type?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TURNSTILE_SITE_KEY = "0x4AAAAAADOpg7umNlyQBlo-";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  const [reporterEmail, setReporterEmail] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Vol simple");
  const [incidentTime, setIncidentTime] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberAddress, setSubscriberAddress] = useState("");

  const [searchSector, setSearchSector] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadedAt, setLoadedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [category, setCategory] = useState("");
  const requestId = useRef(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showLegend, setShowLegend] = useState(false);
  const [icons, setIcons] = useState<IncidentIcons | null>(null);
  const [map, setMap] = useState<any>(null);
  const [selectedPosition, setSelectedPosition] =
    useState<[number, number] | null>(null);

  useEffect(() => {
    loadIncidents();
    getIcons().then(setIcons);
  }, []);

  useEffect(() => {
    if (map && selectedPosition) {
      map.flyTo(selectedPosition, 14, { duration: 2 });
    }
  }, [map, selectedPosition]);

  useEffect(() => {
    if (
      !showForm ||
      !turnstileLoaded ||
      !captchaRef.current ||
      !window.turnstile
    ) {
      return;
    }

    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    setCaptchaToken("");

    widgetIdRef.current = window.turnstile.render(captchaRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken(""),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [showForm, turnstileLoaded]);

  async function fetchIncidents(params = new URLSearchParams(), move = false) {
    const id = ++requestId.current;
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`${API_URL}/incidents?${params}`, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error("Service indisponible");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Réponse inattendue");
      if (id !== requestId.current) return;
      setIncidents(data);
      setLoadedAt(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      if (move && data.length) setSelectedPosition([data[0].latitude, data[0].longitude]);
    } catch {
      if (id === requestId.current) {
        setIncidents([]);
        setLoadedAt("");
        setLoadError("Les signalements ne sont pas accessibles pour le moment. Réessayez dans quelques instants.");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  async function loadIncidents() { await fetchIncidents(); }

  async function searchIncidents() {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setNotice("La date de début doit précéder la date de fin.");
      return;
    }
    setNotice("");
    const params = new URLSearchParams();
    if (searchSector.trim()) params.set("sector", searchSector.trim());
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    await fetchIncidents(params, true);
  }

  async function resetSearch() {
    setSearchSector("");
    setCategory("");
    setNotice("");
    setDateFrom("");
    setDateTo("");
    await loadIncidents();

    if (map) {
      map.flyTo([46.603354, 1.888334], 6, { duration: 1.5 });
    }
  }

  async function getAddressInfo(addressValue: string) {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        addressValue
      )}&limit=1`
    );

    const data = await response.json();

    if (data.features?.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.geometry.coordinates;

      return {
        latitude,
        longitude,
        officialAddress: feature.properties.label,
      };
    }

    throw new Error("Adresse introuvable. Vérifiez la rue, le code postal et la ville.");
  }

  async function uploadMedia() {
    if (!mediaFile) {
      return { media_url: null, media_type: null };
    }

    const formData = new FormData();
    formData.append("file", mediaFile);

    const response = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || "Le transfert a échoué.");
    }

    return {
      media_url: result.media_url,
      media_type: result.media_type,
    };
  }

  async function sendIncident() {
    if (
      !reporterEmail.trim() ||
      !streetName.trim() ||
      !postalCode.trim() ||
      !city.trim() ||
      !description.trim()
    ) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!reporterEmail.includes("@")) {
      alert("Veuillez saisir une adresse email valide.");
      return;
    }

    if (!acceptTerms) {
      alert("Vous devez accepter les conditions d’utilisation.");
      return;
    }

    if (!captchaToken) {
      alert("Veuillez valider le captcha.");
      return;
    }

    const fullAddress = `${streetNumber} ${streetName} ${postalCode} ${city}`;

    const { latitude, longitude, officialAddress } = await getAddressInfo(
      fullAddress
    );

    let uploadedMedia = {
      media_url: null as string | null,
      media_type: null as string | null,
    };

    try {
      uploadedMedia = await uploadMedia();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur upload média");
      return;
    }

    const newIncident = {
      reporter_email: reporterEmail.trim().toLowerCase(),
      type,
      incident_time: incidentTime || null,
      address: officialAddress,
      description: description.trim(),
      latitude,
      longitude,
      captcha_token: captchaToken,
      media_url: uploadedMedia.media_url,
      media_type: uploadedMedia.media_type,
    };

    const response = await fetch(`${API_URL}/incidents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newIncident),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      alert(result.error || "Le service n’a pas pu traiter la demande.");
      return;
    }

    alert("Signalement envoyé pour validation.");

    setSelectedPosition([latitude, longitude]);
    setReporterEmail("");
    setStreetNumber("");
    setStreetName("");
    setPostalCode("");
    setCity("");
    setDescription("");
    setType("Vol simple");
    setIncidentTime("");
    setMediaFile(null);
    setCaptchaToken("");
    setAcceptTerms(false);
    setShowForm(false);

    await loadIncidents();
  }

  async function sendSubscription() {
    if (!subscriberEmail.trim() || !subscriberAddress.trim()) {
      alert("Veuillez renseigner votre email et votre adresse.");
      return;
    }

    const { latitude, longitude, officialAddress } = await getAddressInfo(
      subscriberAddress
    );

    const newSubscriber = {
      email: subscriberEmail.trim(),
      address: officialAddress,
      latitude,
      longitude,
    };

    const response = await fetch(`${API_URL}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newSubscriber),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      alert(result.error || "Le service n’a pas pu traiter la demande.");
      return;
    }

    alert("Un email de confirmation vous a été envoyé.");
    setSubscriberEmail("");
    setSubscriberAddress("");
    setShowAlertForm(false);
  }

  async function runSubmission(action: () => Promise<void>) {
    if (submitting) return;
    setSubmitting(true);
    try { await action(); }
    catch (error) { alert(error instanceof Error ? error.message : "La connexion a échoué. Réessayez."); }
    finally { setSubmitting(false); }
  }
  const addIncident = () => runSubmission(sendIncident);
  const subscribeToAlerts = () => runSubmission(sendSubscription);
  const visibleIncidents = incidents.filter((incident) => !["Accident", "Violences conjugales"].includes(incident.type) && (!category || incident.type === category));

  useEffect(() => {
    if (!showForm && !showAlertForm && !showLegend) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const getControls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, textarea, a[href]') || []);
    getControls()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setShowForm(false); setShowAlertForm(false); setShowLegend(false); }
      if (event.key === "Tab") {
        const controls = getControls();
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previous?.focus(); };
  }, [showForm, showAlertForm, showLegend]);

  function renderMedia(incident: Incident) {
    if (!incident.media_url) return null;

    const fullUrl = `${API_URL}${incident.media_url}`;

    if (incident.media_type === "video") {
      return (
        <video
          controls
          className="mt-3 h-20 w-24 rounded border border-gray-700 object-cover"
        >
          <source src={fullUrl} />
        </video>
      );
    }

    return (
      <img
        src={fullUrl}
        alt="Média incident"
        className="mt-3 h-20 w-24 rounded border border-gray-700 object-cover"
      />
    );
  }

  return (
    <main className="crime-app">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
      />

      <a href="#carte" className="skip-link">Aller à la carte</a>
      <header className="site-header">
        <div className="brand"><span className="brand-mark" aria-hidden="true">M<span>•</span></span><div><h1>Mapping Crime <span>France</span></h1><p>Comprendre son territoire, ensemble.</p></div></div>
        <nav aria-label="Actions principales"><a href="#methode">Notre démarche</a><button className="secondary" onClick={() => setShowAlertForm(true)}>Recevoir des alertes</button><button className="primary" onClick={() => setShowForm(true)}>+ Signaler un incident</button></nav>
      </header>
      <div className="intro-bar"><div><span className="eyebrow">LA CARTE CITOYENNE</span><h2>Un regard local sur les incidents signalés.</h2></div><p>Des contributions citoyennes, examinées avant publication.</p></div>
      <form className="search-bar" onSubmit={(event) => { event.preventDefault(); void searchIncidents(); }}>
        <label className="search-place">Ville ou secteur<input placeholder="Rechercher une ville, un quartier…" value={searchSector} onChange={(event) => setSearchSector(event.target.value)} /></label>
        <label>Publié à partir du<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
        <label>Jusqu’au<input type="date" min={dateFrom || undefined} value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
        <label>Type d’incident<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Tous les types</option>{INCIDENT_TYPES.map((name) => <option key={name}>{name}</option>)}</select></label>
        <button className="primary" disabled={loading} type="submit">{loading ? "Chargement…" : "Rechercher"}</button><button className="reset-button" type="button" onClick={resetSearch}>Effacer</button>
      </form>
      {notice && <p className="notice" role="alert">{notice}</p>}
      <div className="workspace">
        <aside className="incident-sidebar" aria-label="Liste des signalements" aria-busy={loading}>
          <div className="results-heading"><span className="eyebrow">SUR LE TERRITOIRE</span><h2>Signalements <span>{loading || loadError ? "—" : visibleIncidents.length}</span></h2><p>{loadedAt ? `Consultés à ${loadedAt} · Publications examinées` : "Contributions citoyennes"}</p></div>
          <div aria-live="polite">
            {loading && <p className="state-card">Chargement des signalements…</p>}
            {!loading && loadError && <div className="state-card error"><strong>Connexion indisponible</strong><p>{loadError}</p><button onClick={searchIncidents}>Réessayer</button></div>}
          </div>
          <div className="space-y-3">
            {!loading && !loadError && visibleIncidents.length === 0 && (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 text-gray-300">
                Aucun signalement publié pour cette recherche. Cela ne signifie pas qu’aucun incident n’a eu lieu.
              </div>
            )}

            {visibleIncidents.map((incident) => (
              <button
                key={incident.id}
                onClick={() =>
                  setSelectedPosition([incident.latitude, incident.longitude])
                }
                className="incident-card"
              >
                <div className="flex gap-3">
                  <div className="incident-symbol">
                    {icons && <img src={(icons[incident.type] || icons.Autre).options.iconUrl} alt="" width={28} height={34} />}
                  </div>

                  <div className="flex-1">
                    <div className="incident-title">
                      {incident.type}
                    </div>

                    {incident.incident_time && (
                      <div className="text-xs text-gray-400 mt-1">
                        Horaire : {incident.incident_time}
                      </div>
                    )}

                    <div className="text-gray-300 text-sm mt-1">
                      {incident.address}
                    </div>

                    <div className="text-sm mt-2 leading-relaxed">
                      {incident.description}
                    </div>

                    {renderMedia(incident)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section id="carte" className="map-panel" aria-label="Carte interactive des signalements">
          <div className="map-toolbar"><span>France · Vue d’ensemble</span><label><span className="sr-only">Fond de carte</span><select value={mapStyle} onChange={(event) => setMapStyle(event.target.value as "street" | "satellite")}><option value="street">Plan</option><option value="satellite">Satellite</option></select></label></div>
          <MapContainer
                        ref={setMap as any}
            center={[46.603354, 1.888334]}
            zoom={6}
            maxZoom={20}
            className="h-full w-full"
          >
            {mapStyle === "street" ? (
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            ) : (
              <TileLayer
                attribution="Tiles © Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}

            {icons &&
              visibleIncidents.map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.latitude, incident.longitude]}
                  icon={icons[incident.type] || icons["Autre"]}
                >
                  <Popup>
                    <strong>{incident.type}</strong>
                    <br />
                    {incident.incident_time && (
                      <>
                        Horaire : {incident.incident_time}
                        <br />
                      </>
                    )}
                    {incident.address}
                    <br />
                    {incident.description}
                    {incident.media_url && (
                      <>
                        <br />
                        Média joint disponible
                      </>
                    )}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>

          {/* Légende desktop */}
<div className="desktop-legend">
  <h3 className="font-bold mb-3 text-base">Légende</h3>
  <div className="space-y-2 text-xs">
    {icons && (
      <>
        {INCIDENT_TYPES.map((name) => <LegendItem key={name} icon={icons[name]} label={name} />)}
      </>
    )}
  </div>
</div>

{/* Bouton légende mobile */}
<div className="md:hidden absolute top-3 right-3 z-[1000]">
  <button
    onClick={() => setShowLegend(true)}
    className="bg-black/90 border border-gray-700 text-white px-4 py-2 rounded-xl shadow-lg font-bold text-sm"
  >
    📍 Légende
  </button>
</div>

{/* Popup légende mobile */}
{showLegend && (
  <div role="dialog" aria-modal="true" aria-label="Légende de la carte" className="fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-4">
    <div className="bg-gray-950 border border-gray-700 text-white rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Légende</h3>
        <button onClick={() => setShowLegend(false)} className="text-2xl">
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {icons && (
          <>
            {INCIDENT_TYPES.map((name) => <LegendItem key={name} icon={icons[name]} label={name} />)}
          </>
        )}
      </div>
    </div>
  </div>
)}
        </section>
      </div>


      <footer id="methode" className="method-footer"><div><span className="eyebrow">NOTRE DÉMARCHE</span><h2>Une carte de contributions, avec du contexte.</h2><p>Les publications proviennent de déclarations citoyennes examinées avant leur mise en ligne. Cet examen ne constitue pas une vérification officielle des faits. La carte n’est ni exhaustive ni une mesure du niveau de criminalité.</p></div><div><strong>Comment ça fonctionne ?</strong><p>1. Vous décrivez un incident.<br />2. Votre contribution est examinée.<br />3. Après publication, les abonnés concernés peuvent recevoir une alerte dans un rayon de 10 km.</p><a href="/cgu">Conditions d’utilisation</a></div></footer>

      {showForm && (
        <div role="dialog" aria-modal="true" aria-label="Formulaire citoyen" className="modal-backdrop fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-3 md:p-6">
          <div className="bg-gray-950 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-red-500">
                Déclaration citoyenne
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
              >
                Fermer
              </button>
            </div>

            <label className="block mb-2">Email de contact *</label>
            <input
              type="email"
              aria-label="Adresse email" placeholder="votre@email.fr"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-2"
            />

            <p className="text-xs text-gray-400 mb-4">
              Votre email restera confidentiel et ne sera jamais affiché
              publiquement.
            </p>

            <label className="block mb-2">Type d’incident</label>
            <select
              aria-label="Type d’incident" value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            >
              {INCIDENT_TYPES.map((name) => <option key={name}>{name}</option>)}
            </select>

            <label className="block mb-2">Horaire de l’incident</label>
            <input
              aria-label="Heure de l’incident (facultative)" type="time"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                aria-label="Numéro de rue (facultatif)" placeholder="Numéro"
                value={streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />

              <input
                aria-label="Rue" placeholder="Rue"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />

              <input
                aria-label="Code postal" placeholder="Code postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />

              <input
                aria-label="Ville" placeholder="Ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />
            </div>

            <textarea
              aria-label="Description des faits" placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mt-4 mb-4"
            />

            <input
              aria-label="Photo ou vidéo (facultative, maximum 50 Mo)" type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            {mediaFile && (
              <div className="text-sm text-gray-300 mb-4">
                Média sélectionné : {mediaFile.name}
              </div>
            )}

            <div className="mt-4 mb-4 text-sm text-white">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />

                <span className="leading-relaxed text-gray-300">
                  Je certifie que les informations déclarées sont exactes à ma
                  connaissance, ne sont ni mensongères ni diffamatoires, et
                  j’accepte les{" "}
                  <a
                    href="/cgu"
                    target="_blank"
                    className="text-red-400 underline hover:text-red-300"
                  >
                    Conditions Générales d’Utilisation
                  </a>
                  .
                </span>
              </label>
            </div>

            <div ref={captchaRef} className="mb-4 min-h-[70px]" />

            <button
              disabled={submitting} onClick={addIncident}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-bold"
            >
              {submitting ? "Envoi en cours…" : "Envoyer pour examen"}
            </button>
          </div>
        </div>
      )}

      {showAlertForm && (
        <div role="dialog" aria-modal="true" aria-label="Formulaire citoyen" className="modal-backdrop fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-3 md:p-6">
          <div className="bg-gray-950 border border-gray-700 rounded-xl w-full max-w-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl md:text-2xl font-bold text-blue-500">
                Alertes incidents
              </h2>

              <button
                onClick={() => setShowAlertForm(false)}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
              >
                Fermer
              </button>
            </div>

            <p className="text-sm text-gray-300 mb-4">
              Recevez une alerte si un incident validé est signalé dans un rayon
              de 10 km autour de votre adresse. L’inscription devient active après confirmation par email. Un lien de désinscription figure dans chaque alerte.
            </p>

            <input
              type="email"
              aria-label="Adresse email" placeholder="votre@email.fr"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <input
              aria-label="Adresse à surveiller" placeholder="Adresse à surveiller"
              value={subscriberAddress}
              onChange={(e) => setSubscriberAddress(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <button
              disabled={submitting} onClick={subscribeToAlerts}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold"
            >
              {submitting ? "Envoi en cours…" : "Recevoir le lien de confirmation"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function LegendItem({ icon, label }: { icon: any; label: string }) {
  if (!icon) return null;

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <img
        src={icon.options.iconUrl}
        alt={label}
        className="w-5 h-5 md:w-6 md:h-6 object-contain"
      />
      <span>{label}</span>
    </div>
  );
}