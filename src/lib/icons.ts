import type { Icon } from "leaflet";
export type IncidentIcons = Record<string, Icon>;

// Shared catalogue for the form, search, map and legends.
export const INCIDENT_TYPES = ["Vol simple", "Vol à main armée", "Car-jacking", "Cambriolage", "Tentative de cambriolage", "Agression physique", "Agression sexuelle", "Viol", "Dégradation", "Incendie volontaire", "Escroquerie", "Trafic de stupéfiants", "Rodéo urbain", "Nuisances / tapage", "Disparition inquiétante", "Homicide"] as const;

const designs: Record<string, [string, string]> = {
  "Vol simple": [
    "<rect x=\"6\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M9 8V6a3 3 0 0 1 6 0v2\"/>",
    "#a66a17"
  ],
  "Vol à main armée": [
    "<rect x=\"6\" y=\"10\" width=\"12\" height=\"10\" rx=\"2\"/><path d=\"M8 10V7a4 4 0 0 1 8 0v3M12 14v2\"/>",
    "#8c5a16"
  ],
  "Car-jacking": [
    "<path d=\"m5 10 2-5h10l2 5M4 10h16v8H4zM7 18v2m10-2v2M7 14h1m8 0h1\"/>",
    "#8054bd"
  ],
  "Cambriolage": [
    "<path d=\"m3 11 9-8 9 8M6 10v10h12V10M10 20v-7h4v7\"/>",
    "#315ec0"
  ],
  "Tentative de cambriolage": [
    "<path d=\"M5 21V3h14v18M9 21V6l7-2v17M12 13h.1\"/>",
    "#487cb2"
  ],
  "Agression physique": [
    "<path d=\"m12 3 8 3v6c0 4-5 7-8 9-3-2-8-5-8-9V6zM12 8v5m0 3h.01\"/>",
    "#c44b4b"
  ],
  "Agression sexuelle": [
    "<circle cx=\"12\" cy=\"6\" r=\"3\"/><path d=\"M5 21v-3a7 7 0 0 1 14 0v3M12 13v8\"/>",
    "#ac4676"
  ],
  "Viol": [
    "<path d=\"m12 3 8 3v6c0 4-5 7-8 9-3-2-8-5-8-9V6zM8 12l3 3 5-6\"/>",
    "#853d6b"
  ],
  "Dégradation": [
    "<path d=\"M4 4h16v16H4zM13 4l-4 6 6 3-5 7\"/>",
    "#9a6435"
  ],
  "Incendie volontaire": [
    "<path d=\"M13 2c1 6-6 6-3 11 2-1 3-3 3-5 5 4 8 8 4 12-5 5-14 0-12-6 1-4 5-6 8-12z\"/>",
    "#c55a2d"
  ],
  "Escroquerie": [
    "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 10h18M7 15h3m6-2v2m0 2h.01\"/>",
    "#8d64a9"
  ],
  "Trafic de stupéfiants": [
    "<path d=\"m8 4-4 4a5 5 0 0 0 7 7l4-4a5 5 0 0 0-7-7zM6 6l7 7M17 15v6m-3-3h6\"/>",
    "#39816d"
  ],
  "Rodéo urbain": [
    "<circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"m4 8 6 3m4 0 6-3M12 14v7\"/>",
    "#537295"
  ],
  "Nuisances / tapage": [
    "<path d=\"M4 9h4l5-5v16l-5-5H4zM17 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14\"/>",
    "#397f93"
  ],
  "Disparition inquiétante": [
    "<circle cx=\"10\" cy=\"10\" r=\"6\"/><path d=\"m15 15 6 6\"/><circle cx=\"10\" cy=\"9\" r=\"1.5\"/><path d=\"M7 13a3 3 0 0 1 6 0\"/>",
    "#a47722"
  ],
  "Homicide": [
    "<path d=\"M8 11h8v10H8zM6 21h12M12 11V8c-5-2-1-5 0-6 1 2 5 5 0 6\"/>",
    "#536079"
  ]
};

export async function getIcons(): Promise<IncidentIcons> {
  const { Icon } = await import("leaflet");
  const create = (drawing: string, color: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 46 9 34C-9 14 5 2 20 2s29 12 11 32Z" fill="${color}" stroke="white" stroke-width="2"/><g transform="translate(8 9)" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
    return new Icon({ iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`, iconSize: [36, 44], iconAnchor: [18, 43], popupAnchor: [0, -36] });
  };
  return Object.fromEntries([
    ...INCIDENT_TYPES.map((name) => [name, create(...designs[name])]),
    ["Autre", create(designs["Agression physique"][0], "#64748b")],
  ]);
}
