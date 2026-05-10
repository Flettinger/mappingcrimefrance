"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function Home() {
  return (
    <main className="flex h-screen w-full">

      {/* PANNEAU GAUCHE */}
      <div className="w-[350px] bg-black text-white p-5 z-[1000] overflow-auto">

        <h1 className="text-3xl font-bold mb-6 text-red-500">
          MappingCrimeFrance
        </h1>

        <p className="text-sm text-gray-300 mb-6">
          Cartographie citoyenne des incidents et crimes en France.
        </p>

        <button className="w-full bg-red-600 hover:bg-red-700 p-3 rounded-lg font-semibold mb-6">
          Déclarer un incident
        </button>

        <div className="mb-5">
          <label className="block mb-2 font-semibold">
            Type d’incident
          </label>

          <select className="w-full p-3 rounded bg-gray-900 border border-gray-700">
            <option>Tous</option>
            <option>Vol</option>
            <option>Agression</option>
            <option>Cambriolage</option>
            <option>Dégradation</option>
          </select>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">
            Statistiques
          </h2>

          <div className="bg-gray-900 p-4 rounded-lg mb-3">
            🔴 Incidents aujourd’hui : 128
          </div>

          <div className="bg-gray-900 p-4 rounded-lg mb-3">
            🟠 Cambriolages : 32
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            🔵 Agressions : 18
          </div>
        </div>
      </div>

      {/* CARTE */}
      <div className="flex-1">

        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          scrollWheelZoom={true}
          className="h-full w-full"
        >

          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[48.8566, 2.3522]}>
            <Popup>
              Paris - Vol signalé.
            </Popup>
          </Marker>

          <Marker position={[43.2965, 5.3698]}>
            <Popup>
              Marseille - Agression signalée.
            </Popup>
          </Marker>

        </MapContainer>

      </div>
    </main>
  );
}