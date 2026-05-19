"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import { getIcons, type IncidentIcons } from "../lib/icons";

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
      map.flyTo(selectedPosition, 18, { duration: 2 });
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

  async function loadIncidents() {
    const response = await fetch(`${API_URL}/incidents`);
    const data = await response.json();
    setIncidents(data);
  }

  async function searchIncidents() {
    const params = new URLSearchParams();
    if (searchSector.trim()) params.append("sector", searchSector.trim());
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);

    const response = await fetch(`${API_URL}/incidents?${params.toString()}`);
    const data = await response.json();
    setIncidents(data);

    if (data.length > 0) {
      setSelectedPosition([data[0].latitude, data[0].longitude]);
    }
  }

  async function resetSearch() {
    setSearchSector("");
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

    return {
      latitude: 46.603354,
      longitude: 1.888334,
      officialAddress: addressValue,
    };
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

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      media_url: result.media_url,
      media_type: result.media_type,
    };
  }

  async function addIncident() {
    if (
      !reporterEmail.trim() ||
      !streetNumber.trim() ||
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

    if (result.error) {
      alert(result.error);
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

  async function subscribeToAlerts() {
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

    if (result.error) {
      alert(result.error);
      return;
    }

    alert("Un email de confirmation vous a été envoyé.");
    setSubscriberEmail("");
    setSubscriberAddress("");
    setShowAlertForm(false);
  }

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
    <main className="min-h-screen w-full bg-black text-white md:h-screen md:overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
      />

      <header className="bg-gradient-to-r from-black via-[#111] to-black border-b border-gray-800 px-4 py-4 z-[2000] relative md:h-[170px] md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6 md:mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Mapping<span className="text-red-500">CrimeFrance</span>
            </h1>

            <p className="text-xs md:text-sm text-gray-300 mt-1">
              Cartographie citoyenne des incidents en France
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowForm(true);
                setShowAlertForm(false);
              }}
              className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-bold shadow-lg"
            >
              Déclarer un incident
            </button>

            <button
              onClick={() => {
                setShowAlertForm(true);
                setShowForm(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-bold shadow-lg"
            >
              Recevoir des alertes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-4 md:mt-0 md:grid-cols-[1.6fr_0.85fr_0.85fr_0.75fr_0.75fr_1fr] md:gap-4 md:items-end">
          <div>
            <label className="block text-sm font-semibold mb-2">Recherche</label>
            <input
              placeholder="Ville, village ou secteur..."
              value={searchSector}
              onChange={(e) => setSearchSector(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-[#111] border border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Date début
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-[#111] border border-gray-700 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Date fin</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-[#111] border border-gray-700 text-white"
            />
          </div>

          <button
            onClick={searchIncidents}
            className="h-11 bg-green-600 hover:bg-green-700 rounded-lg font-bold"
          >
            Rechercher
          </button>

          <button
            onClick={resetSearch}
            className="h-11 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
          >
            Réinitialiser
          </button>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Affichage carte
            </label>
            <select
              value={mapStyle}
              onChange={(e) =>
                setMapStyle(e.target.value as "street" | "satellite")
              }
              className="w-full h-11 px-4 rounded-lg bg-[#111] border border-gray-700 text-white"
            >
              <option value="street">Carte classique</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-170px)]">
        <aside className="order-2 md:order-1 w-full md:w-[410px] bg-black border-t md:border-t-0 md:border-r border-gray-800 p-4 max-h-[320px] md:max-h-none overflow-y-auto z-[1000]">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Incidents publiés ({incidents.length})
          </h2>

          <div className="space-y-3">
            {incidents.length === 0 && (
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 text-gray-300">
                Aucun incident trouvé.
              </div>
            )}

            {incidents.map((incident) => (
              <button
                key={incident.id}
                onClick={() =>
                  setSelectedPosition([incident.latitude, incident.longitude])
                }
                className="w-full text-left bg-[#111] p-4 rounded-lg border border-gray-800 hover:border-red-500 transition"
              >
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center font-bold shrink-0">
                    !
                  </div>

                  <div className="flex-1">
                    <div className="text-red-400 font-bold text-lg">
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

        <section className="order-1 md:order-2 flex-1 relative h-[58vh] md:h-full">
          <MapContainer
            key={mapStyle}
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
              incidents.map((incident) => (
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
<div className="hidden md:block absolute top-6 right-6 z-[1000] bg-black/90 border border-gray-700 rounded-xl p-3 shadow-xl w-[220px]">
  <h3 className="font-bold mb-3 text-base">Légende</h3>
  <div className="space-y-2 text-xs">
    {icons && (
      <>
        <LegendItem icon={icons["Vol simple"]} label="Vol simple" />
        <LegendItem icon={icons["Cambriolage"]} label="Cambriolage" />
        <LegendItem icon={icons["Car-jacking"]} label="Car-jacking" />
        <LegendItem icon={icons["Agression physique"]} label="Agression physique" />
        <LegendItem icon={icons["Incendie volontaire"]} label="Incendie volontaire" />
        <LegendItem icon={icons["Accident"]} label="Accident" />
        <LegendItem icon={icons["Trafic de stupéfiants"]} label="Trafic de stupéfiants" />
        <LegendItem icon={icons["Rodéo urbain"]} label="Rodéo urbain" />
        <LegendItem icon={icons["Nuisances / tapage"]} label="Nuisances / tapage" />
        <LegendItem icon={icons["Disparition inquiétante"]} label="Disparition" />
        <LegendItem icon={icons["Homicide"]} label="Homicide" />
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
  <div className="fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-4">
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
            <LegendItem icon={icons["Vol simple"]} label="Vol simple" />
            <LegendItem icon={icons["Cambriolage"]} label="Cambriolage" />
            <LegendItem icon={icons["Car-jacking"]} label="Car-jacking" />
            <LegendItem icon={icons["Agression physique"]} label="Agression physique" />
            <LegendItem icon={icons["Incendie volontaire"]} label="Incendie volontaire" />
            <LegendItem icon={icons["Accident"]} label="Accident" />
            <LegendItem icon={icons["Trafic de stupéfiants"]} label="Trafic de stupéfiants" />
            <LegendItem icon={icons["Rodéo urbain"]} label="Rodéo urbain" />
            <LegendItem icon={icons["Nuisances / tapage"]} label="Nuisances / tapage" />
            <LegendItem icon={icons["Disparition inquiétante"]} label="Disparition" />
            <LegendItem icon={icons["Homicide"]} label="Homicide" />
          </>
        )}
      </div>
    </div>
  </div>
)}
        </section>
      </div>


      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-3 md:p-6">
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
              placeholder="votre@email.fr"
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
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            >
              <option>Vol simple</option>
              <option>Vol à main armée</option>
              <option>Car-jacking</option>
              <option>Cambriolage</option>
              <option>Tentative de cambriolage</option>
              <option>Agression physique</option>
              <option>Agression sexuelle</option>
              <option>Viol</option>
              <option>Dégradation</option>
              <option>Incendie volontaire</option>
              <option>Escroquerie</option>
              <option>Trafic de stupéfiants</option>
              <option>Rodéo urbain</option>
              <option>Nuisances / tapage</option>
              <option>Violences conjugales</option>
              <option>Disparition inquiétante</option>
              <option>Accident</option>
              <option>Homicide</option>
            </select>

            <label className="block mb-2">Horaire de l’incident</label>
            <input
              type="time"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                placeholder="Numéro"
                value={streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />

              <input
                placeholder="Rue"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />

              <input
                placeholder="Code postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />

              <input
                placeholder="Ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="p-3 rounded bg-black border border-gray-700"
              />
            </div>

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mt-4 mb-4"
            />

            <input
              type="file"
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
              onClick={addIncident}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-bold"
            >
              Envoyer le signalement
            </button>
          </div>
        </div>
      )}

      {showAlertForm && (
        <div className="fixed inset-0 bg-black/70 z-[3000] flex items-center justify-center p-3 md:p-6">
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
              de 10 km autour de votre adresse.
            </p>

            <input
              type="email"
              placeholder="votre@email.fr"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <input
              placeholder="Adresse à surveiller"
              value={subscriberAddress}
              onChange={(e) => setSubscriberAddress(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <button
  onClick={subscribeToAlerts}
  className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-bold"
>
  {"M'inscrire aux alertes"}
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
