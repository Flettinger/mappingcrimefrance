"use client";

import { useEffect, useState } from "react";
import { geoJSON, type Map as LeafletMap } from "leaflet";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import data from "./departements-2025.json";

type Department = { code: string; nom: string };
type Indicator = { unit: string; counts: Record<string, number> };

const indicators: Record<string, Indicator> = data.categories;
const departments = Object.entries(data.departments).sort(([a], [b]) =>
  a.localeCompare(b, "fr", { numeric: true })
);
const formatCount = new Intl.NumberFormat("fr-FR");
const colors = ["#e0f2fe", "#7dd3fc", "#38bdf8", "#0284c7", "#075985"];
const source = "https://www.data.gouv.fr/datasets/bases-statistiques-communale-departementale-et-regionale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales";

export default function DepartmentStatistics({ map }: { map: LeafletMap | null }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Cambriolages de logement");
  const [department, setDepartment] = useState("");
  const [contours, setContours] = useState<FeatureCollection<Polygon | MultiPolygon, Department>>();
  const [failed, setFailed] = useState(false);
  const { unit, counts } = indicators[category];
  const maximum = Math.max(...Object.values(counts));

  useEffect(() => {
    if (!open || contours) return;
    const request = new AbortController();
    fetch("/departements.geojson", { signal: request.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Contours indisponibles");
        return response.json();
      })
      .then(setContours)
      .catch(() => {
        if (!request.signal.aborted) setFailed(true);
      });
    return () => request.abort();
  }, [open, contours]);

  useEffect(() => {
    if (!open || !map || !contours) return;
    const overlay = geoJSON<Department, Polygon | MultiPolygon>(contours, {
      style: (feature) => {
        const count = feature ? counts[feature.properties.code] : 0;
        const fraction = maximum ? Math.log1p(count) / Math.log1p(maximum) : 0;
        const color = colors[Math.min(colors.length - 1, Math.floor(fraction * colors.length))];
        return { color: "#075985", weight: 1, fillColor: color, fillOpacity: 0.6 };
      },
      onEachFeature: (feature, polygon) => {
        const { code, nom } = feature.properties;
        const content = document.createElement("div");
        const heading = document.createElement("strong");
        heading.textContent = nom + " (" + code + ") · 2025";
        content.append(heading, document.createElement("br"), category,
          document.createElement("br"), formatCount.format(counts[code]) + " · Unité : " + unit);
        polygon.bindPopup(content);
      },
    }).addTo(map);
    return () => { overlay.remove(); };
  }, [open, map, contours, category, counts, maximum, unit]);

  function selectDepartment(code: string) {
    setDepartment(code);
    const feature = contours?.features.find((item) => item.properties.code === code);
    if (map && feature) {
      map.fitBounds(geoJSON(feature).getBounds(), { padding: [25, 25], maxZoom: 10 });
    }
  }

  return (
    <div className="absolute left-12 top-3 z-[900] max-w-[calc(100%-4rem)] text-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="department-statistics"
        className="rounded-xl border border-gray-700 bg-black/90 px-3 py-2 text-sm font-bold shadow"
        onClick={() => {
          setFailed(false);
          setOpen(!open);
        }}
      >
        Statistiques 2025
      </button>
      {open && (
        <div id="department-statistics" className="mt-2 w-72 max-w-full space-y-2 rounded-xl border border-gray-700 bg-black/95 p-3 text-xs shadow-xl">
          <h2 className="text-sm font-bold">Chiffres officiels par département</h2>
          <p className="text-amber-200">En attente des chiffres par département de 2026.</p>
          <label className="block">
            Indicateur
            <select className="mt-1 block w-full rounded bg-gray-800 p-1.5" value={category} onChange={(event) => setCategory(event.target.value)}>
              {Object.keys(indicators).sort((a, b) => a.localeCompare(b, "fr")).map((name) =>
                <option key={name}>{name}</option>
              )}
            </select>
          </label>
          <label className="block">
            Département
            <select className="mt-1 block w-full rounded bg-gray-800 p-1.5" value={department} onChange={(event) => selectDepartment(event.target.value)}>
              <option value="">Choisir un département</option>
              {departments.map(([code, name]) => <option key={code} value={code}>{code} · {name}</option>)}
            </select>
          </label>
          {department && <p><strong>{formatCount.format(counts[department])}</strong> · Unité : {unit}</p>}
          {contours && (
            <p className="flex items-center gap-2">
              <span className="flex" aria-hidden="true">
                {colors.map((color) => <span key={color} className="h-2 w-3" style={{ backgroundColor: color }} />)}
              </span>
              Du plus faible au plus élevé
            </p>
          )}
          {!contours && <p role="status">{failed ? "Contours indisponibles. Les chiffres restent consultables." : "Chargement des contours…"}</p>}
          <p className="text-gray-300">
            <a className="underline" href={source}>SSMSI</a> · Police et gendarmerie · Licence Ouverte 2.0
          </p>
          <p className="text-gray-300">
            Contours <a className="underline" href="https://www.data.gouv.fr/datasets/contours-administratifs">IGN / Etalab</a>
          </p>
        </div>
      )}
    </div>
  );
}
