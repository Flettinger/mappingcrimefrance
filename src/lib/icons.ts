import type { Icon } from "leaflet";

export type IncidentIcons = Record<string, Icon>;

const styles: Record<string, [string, string, string?]> = {
  "Vol simple": ["#17418c", "VOL SIMPLE"],
  "Vol à la tire": ["#365579", "VOL À LA TIRE"],
  "Vol avec violence": ["#9d123c", "VOL AVEC", "VIOLENCE"],
  "Vol à main armée": ["#69301d", "VOL À MAIN", "ARMÉE"],
  "Car-jacking": ["#5b21a4", "CAR-JACKING"],
  Cambriolage: ["#a34408", "CAMBRIOLAGE"],
  "Tentative de cambriolage": ["#6e4816", "TENTATIVE DE", "CAMBRIOLAGE"],
  "Agression physique": ["#ad2020", "AGRESSION", "PHYSIQUE"],
  "Agression sexuelle": ["#682b70", "AGRESSION", "SEXUELLE"],
  Viol: ["#501735", "VIOL"],
  Harcèlement: ["#654b7b", "HARCÈLEMENT"],
  Menaces: ["#59404a", "MENACES"],
  "Violences conjugales": ["#872053", "VIOLENCES", "CONJUGALES"],
  Dégradation: ["#485322", "DÉGRADATION"],
  "Incendie volontaire": ["#00758f", "INCENDIE", "VOLONTAIRE"],
  Escroquerie: ["#155b64", "ESCROQUERIE"],
  "Arnaque internet": ["#245d9a", "ARNAQUE", "INTERNET"],
  "Trafic de stupéfiants": ["#166534", "TRAFIC DE", "STUPÉFIANTS"],
  "Rodéo urbain": ["#765500", "RODÉO URBAIN"],
  "Nuisances / tapage": ["#007268", "NUISANCES", "TAPAGE"],
  "Disparition inquiétante": ["#790447", "DISPARITION"],
  "Alerte communale": ["#16445e", "ALERTE", "COMMUNALE"],
  Accident: ["#07557b", "ACCIDENT"],
  Homicide: ["#31283b", "HOMICIDE"],
  Autre: ["#45515f", "AUTRE"],
};

export async function getIcons(): Promise<IncidentIcons> {
  const { Icon } = await import("leaflet");

  return Object.fromEntries(Object.entries(styles).map(([type, [color, line, secondLine]]) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="76" height="36" viewBox="0 0 76 36">
      <path d="M9 2h58a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H46l-8 8-8-8H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7Z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <text x="38" y="${secondLine ? 9 : 14}" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="${secondLine ? 9 : 10.5}" text-anchor="middle" dominant-baseline="central">${line}${secondLine ? `<tspan x="38" y="19">${secondLine}</tspan>` : ""}</text>
    </svg>`;

    return [type, new Icon({
      iconUrl: "data:image/svg+xml," + encodeURIComponent(svg),
      iconSize: [76, 36],
      iconAnchor: [38, 34],
      popupAnchor: [0, -34],
    })];
  }));
}
