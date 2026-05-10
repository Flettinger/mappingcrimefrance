"use client";

import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

type Incident = {
  type: string;
  address: string;
  description: string;
  position: [number, number];
};

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Vol");

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      type: "Vol",
      address: "Paris",
      description: "Vol signalé",
      position: [48.8566, 2.3522],
    },
    {
      type: "Agression",
      address: "Marseille",
      description: "Agression signalée",
      position: [43.2965, 5.3698],
    },
  ]);

  async function getAddressCoordinates(addressValue: string) {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        addressValue
      )}&limit=1`
    );

    const data = await response.json();

    if (data.features?.length > 0) {
      const [longitude, latitude] = data.features[0].geometry.coordinates;
      return [latitude, longitude] as [number, number];
    }

    return [46.603354, 1.888334] as [number, number];
  }

  async function addIncident() {
    if (!address.trim() || !description.trim()) {
      alert("Veuillez renseigner l'adresse et la description.");
      return;
    }

    const coordinates = await getAddressCoordinates(address);

    const newIncident: Incident = {
      type,
      address: address.trim(),
      description: description.trim(),
      position: coordinates,
    };

    setIncidents([...incidents, newIncident]);
    setAddress("");
    setDescription("");
    setType("Vol");
    setShowForm(false);

    alert("Incident ajouté !");
  }

  return (
    <main className="flex h-screen w-full">
      <div className="w-[350px] bg-black text-white p-5 z-[1000] overflow-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-500">
          MappingCrimeFrance
        </h1>

        <p className="text-sm text-gray-300 mb-6">
          Cartographie citoyenne des incidents et crimes en France.
        </p>

        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg font-semibold mb-6"
        >
          Déclarer un incident
        </button>

        {showForm && (
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Nouvelle déclaration</h2>

            <label className="block mb-2">Type d’incident</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            >
              <option>Vol</option>
              <option>Agression</option>
              <option>Cambriolage</option>
              <option>Dégradation</option>
              <option>Autre</option>
            </select>

            <label className="block mb-2">Adresse précise</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
              placeholder="Ex : 12 rue de la République, Lyon"
            />

            <label className="block mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
              placeholder="Décrivez les faits sans nommer de personne..."
            />

            <button
              onClick={addIncident}
              className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold"
            >
              Envoyer la déclaration
            </button>
          </div>
        )}

        <h2 className="text-xl font-bold mb-3">Statistiques</h2>

        <div className="bg-gray-900 p-4 rounded-lg mb-3">
          🔴 Incidents affichés : {incidents.length}
        </div>

        <div className="bg-gray-900 p-4 rounded-lg mb-3">
          🟠 Cambriolages :{" "}
          {incidents.filter((incident) => incident.type === "Cambriolage").length}
        </div>

        <div className="bg-gray-900 p-4 rounded-lg mb-3">
          🔵 Agressions :{" "}
          {incidents.filter((incident) => incident.type === "Agression").length}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Derniers incidents</h2>

          <div className="space-y-3">
            {incidents
              .slice()
              .reverse()
              .map((incident, index) => (
                <div
                  key={index}
                  className="bg-gray-900 p-3 rounded-lg border border-gray-800"
                >
                  <div className="text-red-400 font-bold">{incident.type}</div>
                  <div className="text-sm text-gray-300">{incident.address}</div>
                  <div className="text-sm mt-2">{incident.description}</div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex-1">
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {incidents.map((incident, index) => (
            <Marker key={index} position={incident.position}>
              <Popup>
                <strong>{incident.type}</strong>
                <br />
                {incident.address}
                <br />
                {incident.description}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </main>
  );
}