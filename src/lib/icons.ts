import type { Icon } from "leaflet";

export type IncidentIcons = Record<string, Icon>;

export async function getIcons(): Promise<IncidentIcons> {
  const { Icon } = await import("leaflet");

  const createIcon = (file: string, size = 60) =>
    new Icon({
      iconUrl: `/icons/${file}`,
      iconSize: [80, 80],
      iconAnchor: [36, 80],
      popupAnchor: [0, -65],
    });

  const disappearanceIcon = new Icon({
    iconUrl: "data:image/svg+xml," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="36" viewBox="0 0 76 36">' +
        '<path d="M9 2h58a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H46l-8 8-8-8H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7Z" fill="#790447" stroke="#fff" stroke-width="2"/>' +
        '<text x="38" y="14" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="10.5">DISPARITION</text>' +
      '</svg>'
    ),
    iconSize: [76, 36],
    iconAnchor: [38, 34],
    popupAnchor: [0, -34],
  });

  const defaultIcon = createIcon("autre.png");

  return {
    "Vol simple": createIcon("vol-simple.png"),
    "Vol à la tire": createIcon("vol-tire.png"),
    "Vol avec violence": createIcon("vol-violence.png"),
    "Vol à main armée": createIcon("vol-arme.png"),
    "Car-jacking": createIcon("car-jacking.png"),

    Cambriolage: createIcon("cambriolage.png"),
    "Tentative de cambriolage": createIcon("tentative-cambriolage.png"),

    "Agression physique": createIcon("agression-physique.png"),
    "Agression sexuelle": createIcon("agression-sexuelle.png"),
    Viol: createIcon("viol.png"),
    Harcèlement: createIcon("harcelement.png"),
    Menaces: createIcon("menaces.png"),
    "Violences conjugales": createIcon("violences-conjugales.png"),

    Dégradation: createIcon("degradation.png"),
    "Incendie volontaire": createIcon("incendie.png"),

    Escroquerie: createIcon("escroquerie.png"),
    "Arnaque internet": createIcon("arnaque-internet.png"),

    "Trafic de stupéfiants": createIcon("stupefiants.png"),
    "Rodéo urbain": createIcon("rodeo.png"),
    "Nuisances / tapage": createIcon("tapage.png"),

    "Disparition inquiétante": disappearanceIcon,
    Accident: createIcon("accident.png"),
    "Homicide": createIcon("homicide.png"),

    Autre: defaultIcon,
  };
}