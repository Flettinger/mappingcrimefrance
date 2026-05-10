"use client";

import { useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

type Incident = {
  type: string;
  city: string;
  description: string;
  position: [number, number];
};

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Vol");

  

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      type: "Vol",
      city: "Paris",
      description: "Vol signalé",
      position: [48.8566, 2.3522],
    },
    {
      type: "Agression",
      city: "Marseille",
      description: "Agression signalée",
      position: [43.2965, 5.3698],
    },
  ]);
async function getCityCoordinates(cityName: string) {
  try {
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?nom=${cityName}&fields=centre&limit=1`
    );

    const data = await response.json();

    if (data.length > 0 && data[0].centre?.coordinates) {
      return [
        data[0].centre.coordinates[1],
        data[0].centre.coordinates[0],
      ];
    }

    return [46.603354, 1.888334];
  } catch (error) {
    console.error(error);
    return [46.603354, 1.888334];
  }
}
  async function addIncident() {
    if (!city.trim() || !description.trim()) {
      alert("Veuillez renseigner la ville et la description.");
      return;
    }

    const coordinates = await getCityCoordinates(city);

const newIncident: Incident = {
  type,
  city: city.trim(),
  description: description.trim(),
  position: coordinates as [number, number],
};
   
    setIncidents([...incidents, newIncident]);
    setCity("");
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

            <label className="block mb-2">Ville</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
              placeholder="Ex : Lyon"
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

        <div className="mb-5">
          <label className="block mb-2 font-semibold">Type d’incident</label>
          <select className="w-full p-3 rounded bg-gray-900 border border-gray-700">
            <option>Tous</option>
            <option>Vol</option>
            <option>Agression</option>
            <option>Cambriolage</option>
            <option>Dégradation</option>
          </select>
        </div>

        <h2 className="text-xl font-bold mb-3">Statistiques</h2>

        <div className="bg-gray-900 p-4 rounded-lg mb-3">
          🔴 Incidents affichés : {incidents.length}
        </div>

        <div className="bg-gray-900 p-4 rounded-lg mb-3">
          🟠 Cambriolages :{" "}
          {incidents.filter((incident) => incident.type === "Cambriolage").length}
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          🔵 Agressions :{" "}
          {incidents.filter((incident) => incident.type === "Agression").length}
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
                {incident.city}
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