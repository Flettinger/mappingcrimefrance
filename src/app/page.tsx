"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import { getIcons, recentIconKey, type IncidentIcons } from "../lib/icons";

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

const DepartmentStatistics = dynamic(() => import("./DepartmentStatistics"), { ssr: false });

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

type ResearchNotice = { city: string; date: string; center?: [number, number]; slug: string };

const researchNotices: ResearchNotice[] = [
  { city: "Saint-Pierre (La Réunion)", date: "5 novembre 2026", center: [-21.34, 55.48], slug: "laurent-imare-52-ans-disparu-saint-pierre-le-05-novembre-2026" },
  { city: "Sathonay-Camp (69)", date: "3 novembre 2026", center: [45.82, 4.87], slug: "lois-marechal-61-ans-disparu-de-sathonay-camp-69-le-03-novembre-2026" },
  { city: "Créteil (94)", date: "1er novembre 2026", center: [48.79, 2.46], slug: "alain-badin-70-ans-disparu-creteil-94-le-01-novembre-2026" },
  { city: "Chanteloup-les-Vignes (78)", date: "30 octobre 2026", center: [48.98, 2.03], slug: "celie-ngameni-33-ans-disparue-depuis-le-30-octobre-2026-chanteloup-les-vignes-78" },
  { city: "Périssac (33)", date: "2 novembre 2026", center: [45.02, -0.33], slug: "david-tovar-56-ans-disparu-perissac-33-le-02-novembre-2026" },
  { city: "Béganne (56)", date: "28 octobre 2026", center: [47.6, -2.24], slug: "michel-boulo-78-ans-disparu-le28-octobre-2026-beganne-56" },
  { city: "Baillif (Guadeloupe)", date: "21 octobre 2026", center: [16.02, -61.75], slug: "christophe-le-rouzes-42-ans-disparu-baillif-le-21-octobre-2026" },
  { city: "Lavaur (81)", date: "19 octobre 2026", center: [43.7, 1.82], slug: "laurent-cortese-49-ans-disparu-lavaur-81-le-19-octobre-2026" },
  { city: "Sarzeau (56)", date: "14 octobre 2026", center: [47.53, -2.77], slug: "claude-cocherel-73-ans-disparu-le-14-octobre-2026-sarzeau-56" },
  { city: "Dechy (59)", date: "10 octobre 2026", center: [50.35, 3.13], slug: "jean-claude-accou-80-ans-disparu-depuis-le-10-octobre-2026-dechy-59" },
  { city: "Rennes (35)", date: "4 octobre 2026", center: [48.11, -1.68], slug: "benoit-bilheude-56-ans-disparu-le-4-octobre-2026-rennes-35" },
  { city: "La Rochelle (17)", date: "16 septembre 2026", center: [46.16, -1.15], slug: "philippe-meheust-62-ans-disparu-la-rochelle-le-16-septembre-2026" },
  { city: "Pau (64)", date: "06 novembre 2026", center: [43.3, -0.37], slug: "tiya-kouassi-daron-16-ans-disparue-pau-64-le-06-novembre-2026" },
  { city: "Paris, Porte Maillot (75)", date: "15 octobre 2026", center: [48.88, 2.28], slug: "octave-31-ans-disparu-paris-porte-maillot-75-le-15-octobre-2026" },
  { city: "Paris 15e (75)", date: "11 octobre 2026", center: [48.84, 2.3], slug: "pierre-tomeselli-35-ans-disparu-le-11-octobre-2026-apres-avoir-quitte-paris-15eme" },
  { city: "Lieu non précisé dans l’annuaire", date: "02 octobre 2026", slug: "nena-stevic-37-ans-disparue-depuis-le-02-octobre-2026" },
  { city: "Roquebrune-sur-Argens (83)", date: "20 octobre 2026", center: [43.44, 6.64], slug: "michael-amsallem-disparu-roquebrune-sur-argens-83-le-20-octobre-2026" },
  { city: "Oberhoffen-sur-Moder (67)", date: "04 octobre 2026", center: [48.78, 7.86], slug: "leo-raeppel-14-ans-disparu-oberhoffen-sur-moder-67-le-04-octobre-2026" },
  { city: "Marne (51)", date: "12 septembre 2026", slug: "frederic-ricci-50-ans-disparu-depuis-le-12-septembre-2026-dans-la-marne-51" },
  { city: "Herblay-sur-Seine (95)", date: "15 septembre 2026", center: [49, 2.16], slug: "marie-chognard-epouse-ferret-85-ans-disparue-herblay-95-le-15-septembre-2026" },
  { city: "Le Mené (22)", date: "11 septembre 2026", center: [48.3, -2.52], slug: "yves-clement-63-ans-disparu-le-11-septembre-2026-le-mene-22" },
  { city: "Étréaupont (02)", date: "09 septembre 2026", center: [49.91, 3.92], slug: "sullivan-couvreur-46-ans-disparu-etreaupont-02-le-09-septembre-2026" },
  { city: "Tonneins (47)", date: "04 septembre 2026", center: [44.39, 0.31], slug: "daniel-pourtier-disparu-tonneins-47-le-04-septembre-2026" },
];

function NoticeDetails({ notice }: { notice: (typeof researchNotices)[number] }) {
  return (
    <>
      <strong>{notice.city}</strong>
      <p>{notice.date}{notice.center ? " · Localisation approximative" : " · Avis consultable dans la liste"}</p>
      <a className="underline" target="_blank" rel="noopener noreferrer" href={"https://www.arpd.fr/fr/disparition-" + notice.slug}>Consulter l’avis sur l’ARPD</a>
    </>
  );
}

const legendCategories = [
  {
    "type": "Menaces",
    "label": "Menaces"
  },
  {
    "type": "Dégradation",
    "label": "Dégradation"
  },
  {
    "type": "Vol simple",
    "label": "Vol simple"
  },
  {
    "type": "Cambriolage",
    "label": "Cambriolage"
  },
  {
    "type": "Car-jacking",
    "label": "Car-jacking"
  },
  {
    "type": "Agression physique",
    "label": "Agression physique"
  },
  {
    "type": "Incendie volontaire",
    "label": "Incendie volontaire"
  },
  {
    "type": "Alerte communale",
    "label": "Alerte communale"
  },
  {
    "type": "Trafic de stupéfiants",
    "label": "Trafic de stupéfiants"
  },
  {
    "type": "Rodéo urbain",
    "label": "Rodéo urbain"
  },
  {
    "type": "Nuisances / tapage",
    "label": "Nuisances / tapage"
  },
  {
    "type": "Disparition inquiétante",
    "label": "Disparition"
  },
  {
    "type": "Homicide",
    "label": "Homicide"
  }
].sort((a, b) => a.label.localeCompare(b.label, "fr"));
const reportTypes = [
  "Vol simple",
  "Vol à main armée",
  "Car-jacking",
  "Cambriolage",
  "Tentative de cambriolage",
  "Agression physique",
  "Agression sexuelle",
  "Viol",
  "Dégradation",
  "Menaces",
  "Incendie volontaire",
  "Escroquerie",
  "Trafic de stupéfiants",
  "Rodéo urbain",
  "Nuisances / tapage",
  "Violences conjugales",
  "Disparition inquiétante",
  "Accident",
  "Homicide"
];
const missingPersonType = "Disparition inquiétante";
const frenchMonths = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function normalizeSearch(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, " ").trim();
}

const parisDate = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" });

const recentCrimeExcludedTypes = new Set([missingPersonType, "Alerte communale", "Accident", "Nuisances / tapage", "Autre"]);

function parisDay() {
  const [day, month, year] = parisDate.format(new Date()).split("/").map(Number);
  return Date.UTC(year, month - 1, day);
}

function oldestVisibleDate() {
  const [day, month, year] = parisDate.format(new Date()).split("/").map(Number);
  const lastDay = new Date(Date.UTC(year - 1, month, 0)).getUTCDate();
  return [year - 1, String(month).padStart(2, "0"), String(Math.min(day, lastDay)).padStart(2, "0")].join("-");
}

function isRecentIncident(incident: Incident, cutoff: string) {
  return !incident.incident_date || incident.incident_date.slice(0, 10) >= cutoff;
}

function noticeMatches(notice: ResearchNotice, sector: string, from: string, to: string) {
  if (sector && !normalizeSearch(notice.city).includes(normalizeSearch(sector))) return false;
  if (!from && !to) return true;
  const match = /^(?:(\d{1,2})(?:er)?\s+)?(\p{L}+)\s+(\d{4})$/u.exec(notice.date.trim().toLowerCase());
  if (!match) return false;
  const [, day, month, year] = match;
  const monthIndex = frenchMonths.indexOf(month);
  if (monthIndex < 0) return false;
  const prefix = year + "-" + String(monthIndex + 1).padStart(2, "0") + "-";
  const first = prefix + (day ? day.padStart(2, "0") : "01");
  const last = day ? first : prefix + new Date(Number(year), monthIndex + 1, 0).getDate();
  return (!from || last >= from) && (!to || first <= to);
}

type Incident = {
  id: number;
  type: string;
  address: string;
  description: string;
  latitude: number;
  longitude: number;
  incident_date?: string | null;
  source_url?: string;
  video_url?: string | null;
  incident_time?: string | null;
  media_url?: string | null;
  media_type?: string | null;
};

const publicReports: Incident[] = [
  {"id":-498,"type":"Agression physique","incident_date":"2026-11-19","address":"Sartrouville (78) — repère communal","latitude":48.938,"longitude":2.158,"description":"Le 19 novembre peu après 10 h, des tirs de mortiers d’artifice dans un lycée ont touché un enseignant et deux élèves. Des brûlures légères sont rapportées pour les élèves. Les deux auteurs avaient pris la fuite et restaient recherchés lors de la publication. Repère communal approximatif, sans adresse privée.","source_url":"https://www.leparisien.fr/yvelines-78/sartrouville-ils-tirent-des-mortiers-sur-un-prof-et-des-eleves-19-11-2026-NWSLVMVHPVBCDFCLUPMXLUAW5I.php"},
  {"id":-499,"type":"Agression physique","incident_date":"2026-11-18","address":"Montauban (82) — repère communal","latitude":44.018,"longitude":1.355,"description":"Vers 2 h 30 dans la nuit du 17 au 18 novembre, une femme a reçu deux coups de couteau dans le dos. Hospitalisée, elle n’avait pas de pronostic vital engagé selon le parquet. Une enquête pour tentative de meurtre et proxénétisme est ouverte ; aucun homicide consommé n’est affirmé. Repère communal approximatif, sans adresse privée.","source_url":"https://www.ladepeche.fr/2026/11/19/une-jeune-femme-de-21-ans-poignardee-dans-le-dos-a-montauban-une-autre-trainee-par-les-cheveux-en-pleine-rue-une-enquete-pour-tentative-de-meurtre-et-13661773.php"},
  // Hautes-Alpes : faits datés depuis septembre 2026 ; repères publics ou communaux explicités.
  {"id":-492,"type":"Dégradation","incident_date":"2026-09-09","address":"Briançon (05) — repère communal","latitude":44.8982,"longitude":6.6436,"description":"Dans la nuit du 8 au 9 septembre, le véhicule personnel d’une fonctionnaire de police a été endommagé : vitres cassées, pneu crevé et inscription sur la carrosserie. La police a confirmé l’ouverture d’une enquête. Le mobile d’intimidation demeure une hypothèse. Repère communal approximatif, sans localisation du domicile.","source_url":"https://alpesdusud.alpes1.com/news/hautes-alpes/112785/tentative-d-intimidation-dans-les-hautes-alpes-vitres-brisees-pneu-creve-une-policiere-visee-a-briancon"},
  {"id":-493,"type":"Menaces","incident_date":"2026-09-23","address":"Abords du distributeur de La Poste, rue Carnot, Gap (05)","latitude":44.55851,"longitude":6.08025,"description":"Le 23 septembre, une femme a été menacée avec une arme de poing factice près d’un distributeur. L’homme a été interpellé après l’alerte donnée par une témoin. Alpes 1 rapporte une condamnation le 25 septembre à trois ans de prison, dont 21 mois avec sursis probatoire. La tentative de vol n’est pas présentée comme un vol consommé. Repère approximatif du site public.","source_url":"https://alpesdusud.alpes1.com/news/hautes-alpes/112923/deux-condamnations-a-gap-sur-fond-de-dependance-a-la-cocaine"},
  {"id":-494,"type":"Cambriolage","incident_date":"2026-10-05","address":"Centre d’incendie et de secours, Veynes (05)","latitude":44.52832,"longitude":5.8242,"description":"Dans la nuit du 4 au 5 octobre, un portail et une porte de la caserne ont été fracturés et du matériel de désincarcération a été dérobé. Une enquête pour vol avec effraction a été ouverte ; elle a ensuite été regroupée avec des affaires similaires du département voisin. Repère approximatif de la caserne.","source_url":"https://alpesdusud.alpes1.com/news/locales/113006/quatre-casernes-de-pompiers-cambriolees-en-une-nuit-du-materiel-particulierement-sensible-vole-dans-les-alpes-du-sud"},
  {"id":-495,"type":"Incendie volontaire","incident_date":"2026-10-06","address":"Abords du lycée Dominique-Villars, Gap (05)","latitude":44.56149,"longitude":6.07572,"description":"Vers 8 h le 6 octobre, une poubelle a été incendiée devant le lycée. Un mineur a été interpellé puis placé en garde à vue pour destruction par moyen dangereux, selon le parquet. Aucun blessé n’est rapporté. Repère approximatif de l’établissement ; emplacement de la poubelle non précisé.","source_url":"https://alpesdusud.alpes1.com/news/hautes-alpes/112996/mobilisation-lyceenne-a-gap-un-adolescent-interpelle-apres-un-feu-de-poubelle-devant-un-lycee"},
  {"id":-496,"type":"Agression physique","incident_date":"2026-10-19","address":"Briançon (05) — repère communal","latitude":44.8982,"longitude":6.6436,"description":"Le 19 octobre, la gérante d’un hôtel et son père ont été agressés par un client après le refus de lui servir un nouveau verre. Le Dauphiné Libéré rapporte une condamnation à six mois de prison ferme. Repère communal approximatif, établissement exact non identifié dans les éléments accessibles.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/25/la-gerante-de-l-hotel-refuse-de-lui-servir-un-dernier-verre-il-l-agresse-violemment"},
  {"id":-497,"type":"Agression physique","incident_date":"2026-10-19","address":"Laragne-Montéglin (05) — repère communal","latitude":44.3152,"longitude":5.8217,"description":"Le 19 octobre, une femme a été blessée avec un couteau lors de violences conjugales. Les gendarmes intervenus ont également été menacés de mort. Le tribunal a prononcé deux ans de prison, dont un ferme, le 21 octobre. Un seul signalement regroupe cette affaire. Repère communal approximatif, sans adresse privée.","source_url":"https://alpesdusud.laradioplus.com/news/hautes-alpes/15832/hautes-alpes-il-poignarde-sa-compagne-et-menace-de-tuer-une-gendarme-un-an-de-prison-ferme"},
  // Aisne : faits documentés depuis septembre 2026 ; précision géographique indiquée dans chaque fiche.
  {"id":-473,"type":"Dégradation","incident_date":"2026-09-03","address":"Carrefour Market, Braine (02)","latitude":49.33905,"longitude":3.52624,"description":"Dans la nuit du 2 au 3 septembre, un fourgon-bélier a été utilisé contre le distributeur du supermarché. Les dégâts sont rapportés, mais aucun vol d’argent n’est confirmé par la source. Une enquête est ouverte. Repère approximatif du commerce.","source_url":"https://www.nradio.fr/news/aisne-un-dab-attaque-au-fourgon-belier-600"},
  {"id":-474,"type":"Dégradation","incident_date":"2026-09-07","address":"Buironfosse (02) — repère communal","latitude":49.9662,"longitude":3.8342,"description":"Le 7 septembre au soir, un véhicule a enfoncé la façade du magasin Proxi. Les dommages entraînent plusieurs semaines de fermeture ; aucun butin n’est signalé. Repère communal approximatif du commerce, emplacement exact non établi.","source_url":"https://nradio.fr/news/aisne-cambriole-le-magasin-proxi-sera-ferme-pendant-plusieurs-semaines-601"},
  {"id":-475,"type":"Vol simple","incident_date":"2026-09-16","address":"E.Leclerc, Harly (02)","latitude":49.84226,"longitude":3.3254,"description":"Deux personnes ont été interceptées après le vol de viande dans l’hypermarché le 16 septembre. Le montant annoncé est de 425 euros. La police est intervenue et une convocation judiciaire est rapportée. Repère approximatif du commerce.","source_url":"https://www.echo-fm.fr/news/harly-425-euros-de-viande-voles-chez-leclerc-9346"},
  {"id":-476,"type":"Cambriolage","incident_date":"2026-09-20","address":"Bohain-en-Vermandois (02) — repère communal","latitude":49.987,"longitude":3.453,"description":"Durant le week-end des 19 et 20 septembre, deux enceintes ont été dérobées après une effraction dans le cinéma municipal. Un suspect a été interpellé et le matériel récupéré. Le 20 marque la fin du week-end rapporté, le jour précis n’étant pas publié. Repère communal approximatif.","source_url":"https://echo-fm.fr/news/bohain-en-vermandois-un-homme-s-endort-apres-avoir-commis-un-cambriolage-9355"},
  {"id":-477,"type":"Incendie volontaire","incident_date":"2026-10-02","address":"Abords du lycée Gay-Lussac, Chauny (02) — repère communal","latitude":49.616,"longitude":3.219,"description":"Un feu a été allumé sous une voiture en marge de la manifestation lycéenne du 2 octobre. Il a rapidement été éteint et la conductrice n’a pas été blessée. Une condamnation à six mois de prison avec sursis est rapportée. Repère communal approximatif ; emplacement précis non établi.","source_url":"https://www.echo-fm.fr/news/chauny-six-mois-de-prison-avec-sursis-pour-un-jeune-homme-apres-l-incendie-d-une-voiture-9467"},
  {"id":-478,"type":"Cambriolage","incident_date":"2026-10-05","address":"Intersport, zone commerciale Auchan, Fayet (02)","latitude":49.86817,"longitude":3.25063,"description":"Dans la nuit du 4 au 5 octobre, des maillots de football ont été volés après une intrusion par le toit. Butin et réparations sont estimés à 40 000 euros. Le prévenu jugé le 30 octobre a été relaxé, selon Paris-Normandie du 2 novembre ; aucune culpabilité ne lui est attribuée ici. Repère approximatif du commerce.","source_url":"https://www.echo-fm.fr/news/saint-quentin-40-000-euros-de-prejudice-apres-un-cambriolage-a-intersport-9450"},
  {"id":-479,"type":"Cambriolage","incident_date":"2026-10-19","address":"Fontaine-lès-Vervins (02) — repère communal","latitude":49.8528,"longitude":3.8956,"description":"Vers 4 h dans la nuit du 18 au 19 octobre, du matériel d’entretien, des outils, du carburant et un camion ont été volés dans le dépôt technique communal. Le camion a ensuite été retrouvé calciné. Une plainte et une enquête sont rapportées. Repère communal approximatif, dépôt non géolocalisé précisément.","source_url":"https://www.echo-fm.fr/news/fontaine-les-vervins-le-depot-technique-de-la-commune-pille-un-camion-retrouve-calcine-9551"},
  {"id":-480,"type":"Cambriolage","incident_date":"2026-10-21","address":"Clairfontaine (02) — repère communal","latitude":49.9824,"longitude":3.9902,"description":"Un cambriolage a été signalé le 21 octobre vers 18 h. La mairie a lancé un appel à témoins auprès de la gendarmerie de La Capelle. Repère communal approximatif ; aucune adresse privée n’est publiée dans cette fiche.","source_url":"https://www.echo-fm.fr/news/clairfontaine-un-nouveau-cambriolage-rue-du-docteur-mahy-9563"},
  {"id":-481,"type":"Vol simple","incident_date":"2026-10-22","address":"Chauny (02) — repère communal","latitude":49.616,"longitude":3.219,"description":"Une voiture a été volée à Chauny avant d’être conduite vers Soissons. La police a interpellé sa conductrice mineure le 22 octobre à 13 h, selon L’Union. Repère communal approximatif du lieu du vol, adresse exacte non publiée.","source_url":"https://www.lunion.fr/id835920/article/2026-10-24/une-mineure-de-16-ans-en-fugue-arretee-au-volant-dune-voiture-volee-soissons"},
  {"id":-482,"type":"Vol simple","incident_date":"2026-10-25","address":"A26, secteur d’Urvillers (02) — repère communal","latitude":49.7901,"longitude":3.3099,"description":"Dans la nuit du 24 au 25 octobre, 1 440 bidons d’huile moteur ont été volés dans un poids lourd stationné sur une aire de l’A26. Deux personnes ont été interpellées puis condamnées le 28 octobre, selon la Gendarmerie nationale. Repère communal approximatif, emplacement de l’aire non établi.","source_url":"https://www.gendarmerie.interieur.gouv.fr/gendinfo/criminalite-organisee-et-enquetes/2026/aisne-les-gendarmes-interpellent-deux-individus-impliques-dans-un-vol-de-fret-sur-l-autoroute-a26"},
  {"id":-483,"type":"Cambriolage","incident_date":"2026-10-27","address":"Laon (02) — repère communal","latitude":49.563,"longitude":3.624,"description":"Les occupants d’un logement ont découvert un intrus dans leur salle de bains le 27 octobre. La police l’a interpellé ; il s’agissait, selon la source, d’un détenu évadé. Repère communal approximatif, sans adresse privée.","source_url":"https://www.echo-fm.fr/news/laon-un-detenu-evade-interpelle-apres-un-cambriolage-9614"},
  {"id":-484,"type":"Dégradation","incident_date":"2026-10-31","address":"Burger King, Chambry (02)","latitude":49.58431,"longitude":3.65311,"description":"Vers 20 h 30 le 31 octobre, une vitre du restaurant a été brisée lors d’une intrusion présentée comme un braquage. Aucun blessé n’est signalé. Une enquête est en cours ; la source ne confirme ni arme ni montant volé. Repère approximatif du commerce.","source_url":"https://echo-fm.fr/news/chambry-le-burger-king-vise-par-un-braquage-le-soir-d-halloween-9617"},
  {"id":-485,"type":"Vol simple","incident_date":"2026-11-07","address":"A26, secteur d’Urvillers (02) — repère communal","latitude":49.7901,"longitude":3.3099,"description":"Vers 3 h 30 dans la nuit du 6 au 7 novembre, un chauffeur a signalé le vol de cartons dans son camion sur une aire de l’A26. Trois personnes ont été condamnées pour vol aggravé, selon le compte rendu judiciaire du 10 novembre. Affaire distincte du vol d’huile moteur du 25 octobre. Repère communal approximatif.","source_url":"https://www.lunion.fr/id839347/article/2026-11-10/interpelles-pour-vol-de-fret-dans-laisne-trois-individus-condamnes-malgre"},
  {"id":-486,"type":"Vol simple","incident_date":"2026-11-08","address":"Guise (02) — repère communal","latitude":49.899,"longitude":3.628,"description":"Dans la nuit du 7 au 8 novembre, une voiture a été volée dans le centre-ville. Elle a ensuite été retrouvée incendiée dans un champ hors de Guise. La gendarmerie enquête. Un seul signalement regroupe le vol et la destruction du véhicule. Repère communal approximatif du lieu du vol.","source_url":"https://www.la-thierache.fr/guise-voiture-volee-incendiee-vol/"},
  {"id":-487,"type":"Dégradation","incident_date":"2026-11-08","address":"Esquéhéries (02) — repère communal","latitude":49.9834,"longitude":3.7474,"description":"Dans la nuit du 7 au 8 novembre, la porte d’un salon de coiffure a été forcée et des individus se sont introduits à l’intérieur. La source ne précise pas de butin. Des plaintes et une enquête de gendarmerie sont rapportées. Repère communal approximatif du commerce.","source_url":"https://www.la-thierache.fr/guise-voiture-volee-incendiee-vol/"},
  {"id":-488,"type":"Vol simple","incident_date":"2026-11-08","address":"Boncourt (02) — repère communal","latitude":49.616,"longitude":3.945,"description":"Deux camping-cars stationnés en hivernage ont été dérobés dans la nuit du 7 au 8 novembre, selon L’Union. Les deux véhicules sont regroupés dans une seule fiche. Repère communal approximatif, lieu de stationnement non publié.","source_url":"https://www.lunion.fr/id839073/article/2026-11-09/les-vols-de-vehicules-se-succedent-en-champagne-picarde-et-aux-alentours"},
  {"id":-489,"type":"Agression physique","incident_date":"2026-11-10","address":"Villers-Cotterêts (02) — repère communal","latitude":49.254,"longitude":3.09,"description":"Une personne vulnérable a été agressée le 10 novembre. L’Union rapporte une condamnation à quatre ans de prison, dont un avec sursis probatoire. Repère communal approximatif ; aucun nom ni domicile n’est indiqué.","source_url":"https://www.lunion.fr/id840892/article/2026-11-18/une-plaie-de-12-cm-4-ans-de-prison-apres-cette-agression-villers-cotterets"},
  {"id":-490,"type":"Vol simple","incident_date":"2026-11-16","address":"La Neuville-lès-Dorengt (02) — repère communal","latitude":49.9777,"longitude":3.6791,"description":"Un fourgon d’un supermarché a été volé peu après 3 h le 16 novembre. Il a été retrouvé calciné le même matin près de Grougis ; des pièces auraient été démontées. Une enquête de gendarmerie est en cours. Un seul signalement regroupe cette affaire. Repère communal approximatif du lieu du vol.","source_url":"https://www.la-thierache.fr/fourgon-vole-neuville-dorengt-incendie/"},
  {"id":-491,"type":"Vol simple","incident_date":"2026-11-10","address":"Esquéhéries (02) — repère communal","latitude":49.9834,"longitude":3.7474,"description":"Une voiture a été dérobée entre minuit et 1 h dans la nuit du 9 au 10 novembre. Sa propriétaire a été informée le 13 novembre qu’elle avait été retrouvée calcinée à quelques kilomètres, selon L’Aisne nouvelle. Affaire distincte de l’intrusion dans un salon le 8 novembre. Repère communal approximatif, sans adresse privée.","source_url":"https://www.aisnenouvelle.fr/id759628/article/2026-11-15/vols-de-vehicules-et-cambriolages-en-serie-en-thierache-encore-une-alfa-romeo"},
  {"id":-450,"type":"Trafic de stupéfiants","incident_date":"2026-09-14","address":"Secteur d’Oyonnax (01) — repère communal","latitude":46.259,"longitude":5.657,"description":"Un réseau de vente d’héroïne utilisant des rendez-vous sur des chemins forestiers à Échallon et Samognat a été démantelé. Deux hommes ont été condamnés, selon Le Progrès. Date des interpellations ; enquête commencée avant septembre. Le point ne localise pas un lieu de vente. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/09/19/trafic-d-heroine-le-reseau-albanais-ronaldo-a-nouveau-demantele"},
  {"id":-451,"type":"Dégradation","incident_date":"2026-09-15","address":"Bourg-en-Bresse (01) — secteur Reyssouze, repère communal","latitude":46.205,"longitude":5.225,"description":"Un homme a été interpellé après avoir été photographié en train de crever des pneus. Plusieurs véhicules auraient été visés les jours précédents ; leur nombre n’est pas établi dans l’article du Progrès. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/09/16/un-serial-creveur-de-pneus-interpelle-en-flagrant-delit-a-bourg-en-bresse"},
  {"id":-452,"type":"Agression physique","incident_date":"2026-09-15","address":"Bourg-en-Bresse (01) — repère communal","latitude":46.205,"longitude":5.225,"description":"Une femme a dénoncé des coups portés par son ex-compagnon et présenté un certificat de 21 jours d’ITT. Un suspect a été interpellé puis déféré, selon Le Progrès. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/09/18/un-homme-interpelle-pour-des-coups-et-des-menaces-sur-son-ex-compagne"},
  {"id":-453,"type":"Cambriolage","incident_date":"2026-09-22","address":"Châtillon-sur-Chalaronne (01) — repère communal","latitude":46.12,"longitude":4.956,"description":"Dans la nuit du 21 au 22 septembre, un bureau de tabac a été attaqué à la voiture-bélier, selon Le Progrès. Une enquête pour vol aggravé a été rapportée par FC Radio. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/archives/2026/24-09"},
  {"id":-454,"type":"Cambriolage","incident_date":"2026-09-23","address":"Replonges (01) — repère communal","latitude":46.31,"longitude":4.879,"description":"Dans la nuit du 22 au 23 septembre, un tabac-presse a été attaqué à la voiture-bélier. Le parquet a ouvert une enquête pour vol aggravé, distincte de l’affaire de Châtillon-sur-Chalaronne, selon FC Radio. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.fc-radio.website-radio.com/news/2-bureaux-de-tabac-attaques-a-la-voiture-belier-1542"},
  {"id":-455,"type":"Cambriolage","incident_date":"2026-09-29","address":"Caserne des pompiers — Ambérieux-en-Dombes (01), repère communal","latitude":45.999,"longitude":4.902,"description":"La caserne a été attaquée dans la nuit du 28 au 29 septembre avec une voiture-bélier préalablement volée. Du matériel de secours a été dérobé et le véhicule ensuite incendié, selon Le Progrès. Ces faits sont regroupés en une affaire. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/09/29/la-caserne-de-pompiers-attaquee-avec-une-voiture-belier-incendiee-ensuite"},
  {"id":-456,"type":"Incendie volontaire","incident_date":"2026-10-04","address":"Montrevel-en-Bresse (01) — secteur rue Bresse-Cocagne, repère communal","latitude":46.336,"longitude":5.129,"description":"Une bâtisse inhabitée a brûlé en pleine nuit. Le Progrès présente l’incendie comme volontaire tout en précisant qu’une enquête sur son origine est en cours. Aucune victime n’est rapportée. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/04/un-incendie-volontaire-ravage-une-batisse-inhabitee-a-montrevel-en-bresse"},
  {"id":-457,"type":"Dégradation","incident_date":"2026-10-06","address":"Secteur du lycée Carriat — Bourg-en-Bresse (01)","latitude":46.197376,"longitude":5.223058,"description":"Des dégradations d’établissements scolaires ont été constatées pendant les rassemblements lycéens. Un arrêté préfectoral mentionne notamment quatorze interpellations près du lycée Carriat. La responsabilité individuelle et le détail des dégâts restent à établir. Repère du site public ; emplacement précis de la scène non confirmé.","source_url":"https://www.senspo.fr/gouvernement/prefets/recueil/ain-01-2026-560-special-24-octobre-2026"},
  {"id":-458,"type":"Agression physique","incident_date":"2026-10-06","address":"Oyonnax (01) — repère communal","latitude":46.259,"longitude":5.657,"description":"Des tirs de mortiers et jets de projectiles ont été constatés pendant les rassemblements lycéens, selon l’arrêté préfectoral du 6 octobre. La source ne précise pas le bilan propre à cet épisode. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://politique.pappers.fr/commune/document/4b8ef6b6565b72060ea05c2af8c02917"},
  {"id":-459,"type":"Agression physique","incident_date":"2026-10-16","address":"Parking du centre commercial Cap Émeraude — Bourg-en-Bresse (01)","latitude":46.22053,"longitude":5.2435,"description":"Trois agents de sécurité ont été frappés en intervenant pour secourir une femme violentée sur le parking, selon Le Progrès. Des ITT de sept et dix jours ont été rapportées pour les agents. Repère du site public ; emplacement précis de la scène non confirmé.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/20/des-agents-de-securite-frappes-en-venant-au-secours-d-une-femme-violentee"},
  {"id":-460,"type":"Cambriolage","incident_date":"2026-10-17","address":"Centre d’incendie et de secours — Oyonnax (01)","latitude":46.26803,"longitude":5.66299,"description":"Dans la nuit du 16 au 17 octobre, du matériel de désincarcération estimé à environ 70 000 euros a été volé dans la caserne. Des suspects ont été interpellés quelques heures plus tard sur l’A40, selon Le Progrès. Repère du site public ; emplacement précis de la scène non confirmé.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/20/cambriolage-a-la-caserne-d-oyonnax-le-materiel-vole-estime-a-plusieurs-dizaines-de-milliers-d-euros"},
  {"id":-461,"type":"Agression physique","incident_date":"2026-10-17","address":"Bourg-en-Bresse (01) — repère communal","latitude":46.205,"longitude":5.225,"description":"Lors d’une manifestation, des tirs tendus de mortiers ont visé les forces de l’ordre. Des policiers et manifestants ont été blessés, selon un arrêté préfectoral. La fiche regroupe cet épisode sans attribuer les blessures à un auteur déterminé. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.senspo.fr/gouvernement/prefets/recueil/ain-01-2026-560-special-24-octobre-2026"},
  {"id":-462,"type":"Dégradation","incident_date":"2026-10-19","address":"Boutique Orange, place du 8-Mai-1945 — Ambérieu-en-Bugey (01), repère communal","latitude":45.958,"longitude":5.358,"description":"La vitrine du commerce a été fracassée dans la nuit du 18 au 19 octobre. Trois suspects ont été interpellés à l’intérieur. Le Progrès précise que la tentative de vol a échoué : la fiche recense les dégâts matériels. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/19/amberieu-trois-cambrioleurs-pris-en-flagrant-delit-apres-avoir-fracasse-la-vitrine-d-orange"},
  {"id":-463,"type":"Cambriolage","incident_date":"2026-10-19","address":"Entreprise Soquet — Ambérieu-en-Bugey (01), repère communal","latitude":45.958,"longitude":5.358,"description":"Des métaux et du matériel professionnel ont été dérobés dans un entrepôt pendant la nuit du 18 au 19 octobre. Quatre hommes ont été interpellés à Lyon puis condamnés, selon Le Progrès. Affaire distincte de la boutique Orange. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/27/ils-volent-a-amberieu-et-sont-interpelles-a-lyon-une-bande-condamnee"},
  {"id":-464,"type":"Menaces","incident_date":"2026-10-22","address":"Tabac-presse, Grande Rue — Attignat (01), repère communal","latitude":46.289,"longitude":5.163,"description":"Deux hommes masqués ont menacé une employée et dévalisé un tabac-presse. Aucune arme n’a été exhibée selon Le Progrès ; la fiche n’est donc pas présentée comme un vol à main armée. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/23/deux-hommes-ont-devalise-le-tabac-presse-en-menacant-une-employee-a-attignat"},
  {"id":-465,"type":"Agression physique","incident_date":"2026-10-28","address":"Belley (01) — secteur Clos Morcel, repère communal","latitude":45.759,"longitude":5.688,"description":"Une rixe a nécessité une importante intervention de gendarmerie. Une enquête judiciaire a été ouverte. Aucun blessé n’était rapporté par Le Progrès ; les violences alléguées contre la police municipale n’étaient pas confirmées par les autorités. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/10/29/rixe-et-violences-urbaines-coup-de-chaud-a-belley"},
  {"id":-466,"type":"Cambriolage","incident_date":"2026-10-31","address":"Jasseron (01) — secteur Bénonnières, repère communal","latitude":46.213,"longitude":5.325,"description":"Deux maisons voisines ont été cambriolées et des bijoux dérobés, selon Le Progrès. Le 31 octobre est la date de découverte rapportée, et non l’heure ou le jour confirmé de chaque intrusion. Les deux logements sont regroupés sans adresse privée. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/01/plusieurs-cambriolages-ont-eu-lieu-a-jasseron-et-marboz"},
  {"id":-467,"type":"Agression physique","incident_date":"2026-10-31","address":"Belley (01) — secteur Clos Morcel, repère communal","latitude":45.759,"longitude":5.688,"description":"De nouveaux incidents comprenant des jets de pierres contre les forces de l’ordre ont été rapportés par Le Progrès pour le 31 octobre. Épisode distinct de la rixe du 28 octobre. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/archives/2026/01-11"},
  {"id":-468,"type":"Car-jacking","incident_date":"2026-11-04","address":"Saint-Denis-en-Bugey (01) — repère communal","latitude":45.95,"longitude":5.329,"description":"Une voiture a été volée après la prise des clés dans un garage. Le propriétaire, accroché à une portière pour arrêter les voleurs, a été traîné puis projeté au sol. Un auteur a été condamné, selon Le Progrès. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/10/le-proprietaire-traine-sur-plusieurs-metres-il-est-condamne-pour-un-vol-de-voiture"},
  {"id":-469,"type":"Trafic de stupéfiants","incident_date":"2026-11-06","address":"Valserhône (01) — repère communal","latitude":46.108,"longitude":5.825,"description":"Les gendarmes ont repéré une transaction présumée devant un PMU. Un homme a été interpellé avec notamment 20 grammes de cocaïne puis condamné, selon Le Progrès. Date de l’interpellation. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/10/sorti-de-prison-depuis-trois-semaines-il-est-interpelle-avec-20-grammes-de-cocaine"},
  {"id":-470,"type":"Cambriolage","incident_date":"2026-11-10","address":"Jasseron (01) — repère communal","latitude":46.213,"longitude":5.325,"description":"Pendant qu’une femme demandait son chemin à une habitante, un homme est entré par une fenêtre et a dérobé son sac, selon Le Progrès. Les gendarmes ont commencé leur enquête. Fait distinct des cambriolages découverts le 31 octobre. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/11/jasseron-une-maison-cambriolee-par-un-couple-sans-scrupule"},
  {"id":-471,"type":"Agression physique","incident_date":"2026-11-10","address":"Bourg-en-Bresse (01) — repère communal","latitude":46.205,"longitude":5.225,"description":"Une femme a été blessée au cou avec un couteau dans une cuisine commune d’un foyer. Des témoins sont intervenus et le suspect a été interpellé. Trois jours d’ITT ont été rapportés par Le Progrès. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/13/une-femme-recoit-un-coup-de-couteau-dans-un-foyer-de-bourg-en-bresse"},
  {"id":-472,"type":"Cambriolage","incident_date":"2026-11-16","address":"Bijouterie Garel, centre commercial Cap Émeraude — Bourg-en-Bresse (01)","latitude":46.22053,"longitude":5.2435,"description":"Dans la nuit du 15 au 16 novembre, des malfaiteurs ont découpé le rideau métallique et brisé des vitrines avant d’emporter des bijoux. Ils ont pris la fuite avec un complice et échappé aux policiers, selon Le Progrès. Repère du site public ; emplacement précis de la scène non confirmé.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/17/trois-malfaiteurs-echappent-a-la-police-apres-un-cambriolage-de-bijouterie-a-bourg-en-bresse"},
  {"id":-425,"type":"Vol avec violence","incident_date":"2026-09-03","address":"Chelles (77) — secteur avenue Foch, repère communal","latitude":48.883,"longitude":2.592,"description":"Un jeune homme a été frappé et sa chaîne arrachée avenue Foch, selon Le Parisien. Une condamnation pour deux vols avec violence est rapportée. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/une-femme-de-80-ans-accepte-de-leur-payer-un-sandwich-les-deux-jeunes-lui-arrachent-son-collier-12-09-2026-QWBAA6ABWJACNHAY5Y4QBC6BEU.php"},
  {"id":-426,"type":"Vol avec violence","incident_date":"2026-09-06","address":"Chelles (77) — secteur boulevard Alsace-Lorraine, repère communal","latitude":48.883,"longitude":2.592,"description":"Une octogénaire a été victime d’un vol de collier à l’arraché. Un suspect a été rattrapé par des commerçants puis condamné, selon la presse. Fait distinct du vol du 3 septembre. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/une-femme-de-80-ans-accepte-de-leur-payer-un-sandwich-les-deux-jeunes-lui-arrachent-son-collier-12-09-2026-QWBAA6ABWJACNHAY5Y4QBC6BEU.php"},
  {"id":-427,"type":"Homicide","incident_date":"2026-09-13","address":"La Brosse-Montceaux (77) — repère communal","latitude":48.3449,"longitude":3.0191,"description":"Une femme de 94 ans a été tuée par arme à feu. Son mari a appelé les policiers pour annoncer les faits avant son interpellation et son hospitalisation, selon Le Parisien. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/a-92-ans-il-tue-sa-femme-de-94-ans-et-le-chat-puis-tente-de-se-suicider-mais-son-arme-senraye-14-09-2026-MESIQ7327BB6PE5JOEV4CFMA7Q.php"},
  {"id":-428,"type":"Trafic de stupéfiants","incident_date":"2026-09-17","address":"Villeparisis (77) — repère communal","latitude":48.943,"longitude":2.616,"description":"À la suite d’un contrôle routier, des stupéfiants et un fusil à pompe ont été saisis dans une affaire de livraisons présumées. Deux hommes ont été jugés, selon Le Parisien. Date du contrôle ; début du trafic non établi. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/je-lai-trouve-en-promenant-mon-chien-un-fusil-a-pompe-et-3-kg-de-drogue-saisis-apres-un-controle-a-villeparisis-22-09-2026-WDRS64ES3BH65AW57NOGYFGWXE.php"},
  {"id":-429,"type":"Agression physique","incident_date":"2026-09-21","address":"Avon (77) — secteur Butte-Montceau, repère communal","latitude":48.405,"longitude":2.721,"description":"Des coups de feu ont provoqué le confinement d’établissements scolaires et d’une crèche. Un suspect a été interpellé ; sa présentation pour tentative d’homicide volontaire était annoncée par le parquet, selon Le Parisien. Aucun homicide consommé rapporté. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/tirs-pres-du-lycee-davon-le-demi-frere-du-jeune-poignarde-interpelle-le-scenario-dune-vengeance-se-precise-23-09-2026-BOVHDVXZXFHDXEM4R62ROMOJR4.php"},
  {"id":-430,"type":"Agression physique","incident_date":"2026-09-23","address":"Meaux (77) — quartier Henri-Dunant, repère communal","latitude":48.96,"longitude":2.888,"description":"Une personne a été agressée à la hachette près d’un commerce du quartier Henri-Dunant. Trois suspects ont été interpellés après une fuite dans un véhicule volé, selon Le Parisien. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/meaux-77100/meaux-une-personne-agressee-a-la-hache-dans-un-commerce-les-suspects-interpelles-apres-une-course-poursuite-avec-la-police-24-09-2026-KJSDZHZPSNDHFD4OM4YL4SRX24.php"},
  {"id":-431,"type":"Vol simple","incident_date":"2026-09-23","address":"Chessy (77) — repère communal","latitude":48.878,"longitude":2.763,"description":"Un homme a été interpellé en flagrant délit de vol de courrier. Il a reconnu rechercher des chèques pour les falsifier et a été condamné, selon Ouest-France citant La Marne. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.ouest-france.fr/ile-de-france/chessy-77700/il-volait-du-courrier-apres-le-passage-du-facteur-et-encaissait-les-cheques-trouves-un-trentenaire-condamne-7f12dcfe-bd87-11f1-9431-be07b240dff0"},
  {"id":-432,"type":"Incendie volontaire","incident_date":"2026-10-02","address":"Lycée Henri-Moissan — Meaux (77)","latitude":48.95871,"longitude":2.87506,"description":"Des poubelles en feu ont été projetées contre les accès du lycée, causant d’importants dégâts. Trois mineurs ont été déférés, notamment pour destruction par moyen dangereux, selon le parquet cité par Le Parisien. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/trois-mineurs-deferes-apres-lincendie-du-lycee-henri-moissan-a-meaux-un-quatrieme-toujours-recherche-06-10-2026-ZPM5R7HFMVCJHA75S6ZI5SBJRY.php"},
  {"id":-433,"type":"Agression physique","incident_date":"2026-10-06","address":"Secteur du groupe scolaire Bickart — Chelles (77)","latitude":48.88356,"longitude":2.588525,"description":"Un père de famille a été grièvement blessé au couteau devant l’école Bickart après un différend de stationnement, selon La Dépêche citant Le Parisien. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.ladepeche.fr/2026/10/09/on-a-dabord-cru-quil-avait-pris-un-coup-de-poing-laltercation-pour-une-place-de-parking-a-la-sortie-de-lecole-primaire-degenere-un-pere-de-famille-13592787.php"},
  {"id":-434,"type":"Agression physique","incident_date":"2026-10-07","address":"Lycée Camille-Claudel — Pontault-Combault (77)","latitude":48.787405,"longitude":2.59949,"description":"Un tir de mortier dirigé vers le lycée a légèrement blessé trois lycéennes et un surveillant. Un adolescent a été interpellé, selon Le Parisien. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/seine-et-marne-le-tir-de-mortier-dun-adolescent-avait-blesse-trois-lyceennes-et-un-surveillant-08-10-2026-WDDXUGWZYVCBLKGHJP7S67FIII.php"},
  {"id":-435,"type":"Dégradation","incident_date":"2026-10-09","address":"Lycée Martin-Luther-King — Bussy-Saint-Georges (77)","latitude":48.838993,"longitude":2.719296,"description":"Des vitres du lycée ont été brisées. Deux adolescents scolarisés dans un établissement voisin ont été identifiés puis interpellés, selon Le Parisien. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/des-eleves-du-prive-venus-casser-dans-le-public-deux-ados-dun-lycee-catholique-interpelles-en-seine-et-marne-16-10-2026-ZAYEDHT3XFEF5MWXPZIXEOOI3E.php"},
  {"id":-436,"type":"Agression physique","incident_date":"2026-10-14","address":"Lycée Martin-Luther-King — Bussy-Saint-Georges (77)","latitude":48.838993,"longitude":2.719296,"description":"Des tirs de mortiers sur le parvis ont fait douze blessés légers, dont une élève hospitalisée. Trois suspects ont été interpellés, selon Le Parisien. Épisode distinct des dégradations du 9 octobre. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/mouvement-lyceen-12-eleves-blesses-apres-des-tirs-de-mortier-devant-le-lycee-martin-luther-king-de-bussy-saint-georges-14-10-2026-DQTO5MKUYJHT3AS4DUHVDECRBU.php"},
  {"id":-437,"type":"Agression physique","incident_date":"2026-10-14","address":"Lycée Jehan-de-Chelles — Chelles (77)","latitude":48.888584,"longitude":2.61264,"description":"Des tirs de mortiers à l’intérieur du lycée ont provoqué une panique puis l’évacuation des élèves, selon Le Parisien. Aucun décès n’est rapporté. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/des-tirs-de-mortiers-a-linterieur-de-quatre-lycees-en-deux-jours-en-seine-et-marne-une-eleve-blessee-et-hospitalisee-15-10-2026-Q5TGPPQ3WJD6VAZOTBJEEVP4WQ.php"},
  {"id":-438,"type":"Agression physique","incident_date":"2026-10-15","address":"Mitry-Mory (77) — secteur lycée Honoré-de-Balzac, repère communal","latitude":48.977,"longitude":2.617,"description":"Des tirs de mortiers ont été signalés dans le secteur du lycée Honoré-de-Balzac, avec intervention policière, selon Le Parisien. Le lieu précis et le bilan propre à cet établissement ne sont pas établis dans le texte accessible. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/des-tirs-de-mortiers-a-linterieur-de-quatre-lycees-en-deux-jours-en-seine-et-marne-une-eleve-blessee-et-hospitalisee-15-10-2026-Q5TGPPQ3WJD6VAZOTBJEEVP4WQ.php"},
  {"id":-439,"type":"Dégradation","incident_date":"2026-10-18","address":"Bailly-Romainvilliers (77) — mairie et police municipale, repère communal","latitude":48.847,"longitude":2.823,"description":"Dans la nuit du 17 au 18 octobre, les locaux de la police municipale et de la mairie ont été dégradés : vitrages et équipements ont été visés, selon Le Parisien. Les deux sites sont regroupés en une fiche. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/violences-urbaines-la-mairie-et-la-police-municipale-de-bailly-romainvilliers-prises-pour-cibles-19-10-2026-NKU3VB2JKNB6HL7UQJAEHGQPTQ.php"},
  {"id":-440,"type":"Agression physique","incident_date":"2026-10-18","address":"Champs-sur-Marne (77) — repère communal","latitude":48.853,"longitude":2.602,"description":"Dans la nuit du 17 au 18 octobre, des policiers ont été visés par des tirs de mortiers et ont dû attendre des renforts, selon un arrêté préfectoral. Aucun décès n’y est indiqué. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://panneau-pocket.s3.gra.perf.cloud.ovh.net/source/sign_pdf/1495870086ae49e36606c76.89363438-1793367606.pdf"},
  {"id":-441,"type":"Agression physique","incident_date":"2026-10-19","address":"Noisiel (77) — secteur cours des Roches, repère communal","latitude":48.854,"longitude":2.628,"description":"Des barricades et des tirs de mortiers ont visé des policiers intervenant après une altercation. Deux jeunes ont ensuite été condamnés, selon Le Parisien. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/tirs-de-mortiers-sur-les-policiers-a-noisiel-deux-jeunes-de-19-ans-condamnes-26-10-2026-FP3XCJLL3JGO5ALBQIEWJK3SZE.php"},
  {"id":-442,"type":"Agression physique","incident_date":"2026-10-20","address":"Dammarie-les-Lys (77) — repère communal","latitude":48.515,"longitude":2.635,"description":"Dans la soirée du 19 au 20 octobre, des policiers ont essuyé des tirs de mortiers. Aucun blessé n’est rapporté par Le Parisien. Fait distinct des violences de Noisiel. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/violences-urbaines-en-seine-et-marne-les-policiers-vises-par-des-tirs-de-mortiers-a-noisiel-et-dammarie-les-lys-20-10-2026-FWW43DGXSZGTTDBZ5E5XTV2HHQ.php"},
  {"id":-443,"type":"Agression physique","incident_date":"2026-10-20","address":"Place Gallieni, abords de la gare — Melun (77)","latitude":48.5277,"longitude":2.6554,"description":"Un homme a reçu un coup de couteau au visage lors d’une rixe entre vendeurs à la sauvette, place Gallieni. Deux suspects ont été interpellés à Paris et une enquête a été ouverte, selon Le Parisien. Repère des abords de la gare ; emplacement précis de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/une-balafre-de-20-cm-au-visage-violente-rixe-entre-vendeurs-a-la-sauvette-pres-de-la-gare-de-melun-21-10-2026-4FBL23QW2ZHQ5LXQ2MNHNXJZLY.php"},
  {"id":-444,"type":"Cambriolage","incident_date":"2026-10-24","address":"Gressy (77) — repère communal","latitude":48.965,"longitude":2.675,"description":"Une maison a été cambriolée. Deux adolescents ont été interpellés après une poursuite à laquelle ont participé des habitants et le maire, selon Le Parisien. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.leparisien.fr/seine-et-marne-77/le-maire-les-habitants-et-la-police-traquent-deux-cambrioleurs-pendant-30-minutes-dans-un-village-de-seine-et-marne-27-10-2026-NIMKWHHMMNFAPC4GDADO5HULWA.php"},
  {"id":-445,"type":"Homicide","incident_date":"2026-10-30","address":"Secteur rue Richelieu — Mitry-Mory (77)","latitude":48.96,"longitude":2.588,"description":"Un homme de 22 ans a été tué par plusieurs tirs de fusil d’assaut, selon le parquet cité par Le Parisien. La police judiciaire est chargée de l’enquête ; le mobile reste à établir. Repère approximatif de la voie, lieu exact des tirs non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/seine-et-marne-un-trafiquant-de-drogue-presume-tue-au-fusil-dassaut-a-mitry-mory-31-10-2026-GCPGGXZNLNELPGQRGANAKI6BQI.php"},
  {"id":-446,"type":"Agression physique","incident_date":"2026-11-09","address":"Lycée Jehan-de-Chelles — Chelles (77)","latitude":48.888584,"longitude":2.61264,"description":"Un mortier a explosé pendant un cours. Le lycéen initialement poursuivi a été relaxé le 13 novembre après un témoignage l’innocentant, selon Le Parisien. La fiche relate l’incident sans attribuer les faits à cette personne. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/tir-de-mortier-en-plein-cours-de-maths-a-chelles-un-lyceen-de-18-ans-relaxe-apres-un-temoignage-surprise-13-11-2026-EAH3RTJZSBEB7KBQIFOCTOYBRQ.php"},
  {"id":-447,"type":"Agression physique","incident_date":"2026-11-10","address":"Lycée Gaston-Bachelard — Chelles (77)","latitude":48.8833,"longitude":2.61273,"description":"Une élue a reçu une bouteille contenant de l’essence devant le lycée. Une enquête pour tentative d’homicide volontaire a été ouverte, selon Le Parisien. Aucun homicide consommé n’est rapporté. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/chelles-une-elue-regionale-visee-par-une-bouteille-dessence-devant-un-lycee-et-porte-plainte-10-11-2026-3ZKEJF2K4ND4BMCRURHXEUDK3U.php"},
  {"id":-448,"type":"Agression physique","incident_date":"2026-11-10","address":"Lycée René-Descartes — Champs-sur-Marne (77)","latitude":48.84438,"longitude":2.585309,"description":"Un policier a été percuté par un adolescent en trottinette lors d’une interpellation près du lycée. Une fracture du bras et trente jours d’ITT ont été rapportés par Le Parisien. La qualification définitive reste à établir. Repère de l’établissement public ; emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/un-ado-de-13-ans-en-trottinette-percute-un-policier-et-lui-casse-le-bras-pres-du-lycee-descartes-a-champs-sur-marne-11-11-2026-HO5AISO7NVF67JVMM5XDZK3ZOA.php"},
  {"id":-449,"type":"Homicide","incident_date":"2026-11-18","address":"Neufmoutiers-en-Brie (77) — repère communal","latitude":48.7689,"longitude":2.8303,"description":"Dans la nuit du 17 au 18 novembre, une jeune femme a été tuée par balle. Son compagnon ou ex-compagnon présumé a ensuite été retrouvé mort à Serris. Une enquête a été ouverte, selon le procureur cité par la presse. Un seul homicide est recensé. Repère communal approximatif ; emplacement exact non publié.","source_url":"https://www.estrepublicain.fr/faits-divers-justice/2026/11/19/neufmoutiers-en-brie-un-jeune-homme-de-18-ans-tue-sa-petite-amie-avant-de-se-suicider"},
  {"id":-424,"type":"Cambriolage","incident_date":"2026-11-18","address":"Nantes (Loire-Atlantique) — repère communal","latitude":47.2184,"longitude":-1.5536,"description":"Une boulangerie a été cambriolée dans la nuit du 17 au 18 novembre : un tiroir-caisse a été emporté. Un suspect a été interpellé à proximité, selon Presse Océan. Repère communal, sans localisation du commerce.","source_url":"https://www.ouest-france.fr/pays-de-la-loire/nantes-44000/faits-divers/"},
  {"id":-423,"type":"Menaces","incident_date":"2026-10-01","address":"Lycée François-Villon, avenue Pierre-de-Félice, Beaugency (45)","latitude":47.786365,"longitude":1.62025,"description":"Une vidéo tournée lors du blocus du lycée a conduit le parquet à ouvrir une enquête préliminaire pour apologie du terrorisme, selon Le Parisien. Trois mineurs ont ensuite été placés en garde à vue, selon l’AFP. Il s’agit de soupçons faisant l’objet d’investigations, sans condamnation établie par ces sources. Repère du lycée, emplacement exact de la scène non confirmé.","source_url":"https://www.leparisien.fr/loiret-45/loiret-des-lyceens-chantent-un-morceau-de-rap-faisant-reference-a-mohamed-merah-et-salah-abdeslam-le-parquet-ouvre-une-enquete-06-10-2026-5V7O6VILGVH7BBJVEK5IDP3AWY.php"},
  {"id":-416,"type":"Agression physique","incident_date":null,"address":"Campus universitaire d’Orléans-La Source — repère de secteur","latitude":47.84361,"longitude":1.93444,"description":"Une série de violences, tentatives d’extorsion et une agression sexuelle ont fait l’objet de plaintes, selon les informations policières relayées par ICI Orléans le 25 septembre 2026. Les plaintes ont été déposées entre le 18 et le 20 septembre ; les dates individuelles des faits ne sont pas établies ici. Repère du campus, sans désigner de résidence ou de bâtiment précis.","source_url":"https://www.shango.media/france-info-une-douzaine-de-plaintes-deposees-apres-des-agressions-sur-le-campus-de-luniversite-dorleans-11882132"},
  {"id":-417,"type":"Cambriolage","incident_date":"2026-10-01","address":"Rue de la République — Orléans (45)","latitude":47.90399,"longitude":1.90433,"description":"Un magasin de la rue de la République a été pillé le 1er octobre, selon un arrêté de la préfecture du Loiret reproduit par Pappers. Repère du secteur de la rue : le commerce et le numéro exact ne sont pas identifiés dans la source consultée.","source_url":"https://politique.pappers.fr/commune/document/dbc27a0189657528ab7e804d86b452fa"},
  {"id":-418,"type":"Dégradation","incident_date":"2026-10-17","address":"Centre-ville d’Orléans (45) — repère de secteur","latitude":47.9028,"longitude":1.9074,"description":"La mairie confirme des dégradations de vitrines et d’équipements publics, des feux de poubelles, des tirs de mortiers et des affrontements lors de la journée du 17 octobre. Cette fiche regroupe plusieurs incidents. Repère approximatif du centre-ville, qui ne désigne aucun commerce particulier.","source_url":"https://www.orleans.fr/fileadmin/news/document/orleans/20261022_arretes_municipaux/2026VOARR0624.pdf"},
  {"id":-419,"type":"Accident","incident_date":"2026-11-01","address":"Avenue de Trévise, secteur du pont Joffre — Orléans (45)","latitude":47.89451,"longitude":1.89696,"description":"Un piéton et son chien sont morts après avoir été percutés sur un passage piéton. Le parquet rapporte une enquête pour homicide routier et une fuite du conducteur ; un suspect a été placé en détention provisoire. Repère de l’avenue près du pont Joffre : le passage piéton exact n’est pas confirmé.","source_url":"https://www.leparisien.fr/loiret-45/un-pieton-et-son-chien-tues-sur-la-route-a-orleans-un-homme-interpelle-apres-avoir-provoque-un-second-accident-04-11-2026-WFYPPGOQINAMBIKIVNDQMNXNGA.php"},
  {"id":-420,"type":"Agression physique","incident_date":"2026-11-05","address":"Orléans (45) — établissement scolaire non précisé","latitude":47.9028,"longitude":1.9074,"description":"Le ministère de l’Intérieur rapporte qu’un personnel de l’Éducation nationale a été blessé à la tête par un tir de mortier à Orléans le 5 novembre. Repère communal approximatif : l’établissement n’est pas nommé dans le communiqué et ce point ne permet pas de le localiser.","source_url":"https://www.interieur.gouv.fr/actualites/communiques-de-presse/bilan-de-mobilisation-lyceenne-et-de-journee-nationale-daction-du-5-novembre-2026"},
  {"id":-421,"type":"Alerte communale","incident_date":"2026-11-12","address":"Lycée Voltaire, 3 avenue Voltaire — Orléans (45)","latitude":47.836522,"longitude":1.94002,"description":"Des tirs de mortiers d’artifice ont été signalés au lycée Voltaire le 12 novembre, entraînant sa fermeture le lendemain, selon Orléans Actualité citant ICI. Aucun blessé n’est précisé pour cet établissement dans la source consultée. Repère du lycée, emplacement précis des tirs inconnu.","source_url":"https://orleans-actualite.fr/orleans-lycees-fermes-tirs-mortiers/"},
  {"id":-422,"type":"Alerte communale","incident_date":"2026-11-12","address":"Lycée Benjamin-Franklin — Orléans (45)","latitude":47.91114,"longitude":1.9108,"description":"Des tirs de mortiers d’artifice ont été signalés au lycée Benjamin-Franklin le 12 novembre, entraînant sa fermeture le lendemain, selon Orléans Actualité citant ICI. Aucun blessé n’est précisé pour cet établissement dans la source consultée. Repère du lycée, emplacement précis des tirs inconnu.","source_url":"https://orleans-actualite.fr/orleans-lycees-fermes-tirs-mortiers/"},
  {"id":-414,"type":"Vol simple","incident_date":"2026-11-14","address":"Puylaroque (82)","latitude":44.25244,"longitude":1.61068,"description":"Environ 300 mètres de câbles téléphoniques ont été arrachés dans la nuit du 13 au 14 novembre. Un suspect est poursuivi pour vol avec dégradation et recel, selon le communiqué du parquet relayé par La Dépêche. Repère communal.","source_url":"https://www.ladepeche.fr/2026/11/17/trois-departements-300-metres-de-cables-voles-en-tarn-et-garonne-des-armes-dans-la-maison-la-traque-des-gendarmes-sacheve-ce-mardi-au-tribunal-13656552.php"},
  {"id":-415,"type":"Menaces","incident_date":null,"address":"Le Raincy (93)","latitude":48.89916,"longitude":2.52298,"description":"Des menaces de mort visant un chef d’établissement ont été découvertes le 16 novembre lors d’une enquête. Une plainte a été déposée et la police recherche leurs auteurs, selon le parquet cité par Le Parisien. La date d’envoi des messages n’est pas précisée. Repère communal.","source_url":"https://www.leparisien.fr/seine-saint-denis-93/le-buter-ainsi-que-son-chien-le-proviseur-du-lycee-rene-cassin-au-raincy-porte-plainte-apres-des-menaces-de-mort-sur-snapchat-17-11-2026-JOLGPDWTTJDHDB6KDZRJKV3G4U.php"},
  {"id":-380,"type":"Cambriolage","incident_date":"2026-09-10","address":"26 rue des Champs-Élysées, Grenoble (38)","latitude":45.178833,"longitude":5.707973,"description":"Une entrée par effraction dans un appartement a été suivie de l’interpellation de deux suspects porteurs de stupéfiants, selon Le Dauphiné Libéré. Le logement est soupçonné de servir au stockage de drogue. Repère à l’adresse publiée, sans indication du logement dans l’immeuble.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/09/11/grenoble-deux-suspects-arretes-en-possession-de-drogue-apres-avoir-fracture-l-entree-d-un-appartement","incident_time":"20:30"},
  {"id":-381,"type":"Agression physique","incident_date":"2026-09-16","address":"Boulevard Gambetta, Grenoble (38)","latitude":45.186756,"longitude":5.724237,"description":"Un automobiliste a été frappé et aspergé de gaz lacrymogène ; une chaîne et ses clés ont été dérobées, selon Le Dauphiné Libéré. Repère de la rue : le point exact de l’agression n’est pas précisé.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/09/16/le-proprietaire-d-une-porsche-agresse-en-pleine-rue","incident_time":"00:30"},
  {"id":-382,"type":"Agression physique","incident_date":"2026-09-20","address":"Carrefour des avenues Edmond-Esmonin et Marie-Reynoard, Grenoble (38)","latitude":45.159143,"longitude":5.728824,"description":"Un adolescent a été blessé par balle à une jambe après des tirs signalés à ce carrefour, selon Le Dauphiné Libéré. Un étui de munition a été découvert sur place. Repère du carrefour indiqué par la source.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/09/20/un-blesse-par-balle-dans-le-quartier-de-la-villeneuve","incident_time":"17:30"},
  {"id":-383,"type":"Trafic de stupéfiants","incident_date":"2026-09-22","address":"60 rue Léon-Jouhaux, quartier Abbaye-Jouhaux, Grenoble (38)","latitude":45.17769,"longitude":5.742786,"description":"La police a saisi près de 11 kg de stupéfiants et de l’argent dans un appartement de stockage, selon Le Dauphiné Libéré. Deux suspects ont été interpellés. Repère à l’adresse publiée : il s’agit du lieu de perquisition, sans localisation précise d’un point de vente.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/09/25/isere-grenoble-pres-de-11-kilos-de-produits-stupefiants-saisis-dans-un-appartement-nourrice-a-l-abbaye-jouhaux"},
  {"id":-384,"type":"Vol simple","incident_date":"2026-09-28","address":"Grenoble — lieu initial non précisé, Grenoble (38)","latitude":45.1885,"longitude":5.7245,"description":"Un camping-car volé a été localisé grâce à son traceur, puis intercepté après sa fuite vers Champ-sur-Drac, selon Radio ISA. Le lieu du vol n’est pas précisé. Repère communal approximatif, qui ne correspond pas au lieu d’interception.","source_url":"https://www.radioisa.com/news/grenoble-il-essaie-de-voler-un-camping-car-mais-est-rattrape-par-la-police-4182"},
  {"id":-385,"type":"Trafic de stupéfiants","incident_date":"2026-10-05","address":"Quartier Mistral — repère de secteur, Grenoble (38)","latitude":45.170644,"longitude":5.702499,"description":"Une opération visant le réseau du quartier Mistral a abouti à onze interpellations et à la saisie de plus de 150 kg de produits dans l’agglomération, selon Le Dauphiné Libéré. Ce bilan concerne plusieurs communes. Repère approximatif du quartier ; les adresses des saisies ne sont pas établies par la source accessible.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/06/isere-metropole-de-grenoble-trafic-de-drogue-gros-coup-de-filet-dans-le-reseau-mistral-38-avec-le-renfort-du-raid"},
  {"id":-386,"type":"Dégradation","incident_date":"2026-10-06","address":"Tribunal administratif, 2 place de Verdun, Grenoble (38)","latitude":45.188662,"longitude":5.73108,"description":"Une caméra a été détériorée, une fenêtre brisée et une inscription portée sur la porte du tribunal, selon un arrêté préfectoral reproduit par Pappers. Repère de l’établissement, sans identification de chaque élément endommagé.","source_url":"https://politique.pappers.fr/commune/document/dff5ca629ac9553e2ccb17ee7ce6f8d2"},
  {"id":-387,"type":"Agression physique","incident_date":"2026-10-07","address":"Abords du lycée Champollion, 1 cours La Fontaine, Grenoble (38)","latitude":45.187793,"longitude":5.725087,"description":"Un homme est poursuivi pour un tir de mortier présumé sur un policier et participation à un attroupement avec une arme, selon Le Dauphiné Libéré. Les responsabilités restent soumises à la justice. Repère des abords du lycée, emplacement exact non précisé.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/09/suspecte-d-un-tir-de-mortier-sur-un-policier-un-homme-renvoye-devant-le-tribunal"},
  {"id":-388,"type":"Agression physique","incident_date":"2026-10-09","address":"Abords du lycée André-Argouges, 61 rue Léon-Jouhaux, Grenoble (38)","latitude":45.175462,"longitude":5.744568,"description":"Des tirs de mortiers ont visé un véhicule de police près du lycée, selon un arrêté préfectoral reproduit par Pappers. Repère de l’établissement ; point exact des tirs non précisé.","source_url":"https://politique.pappers.fr/commune/document/ea64daffd6284a32bb44ca6113322916"},
  {"id":-389,"type":"Incendie volontaire","incident_date":"2026-10-09","address":"Abords du lycée Vaucanson, 27 rue Anatole-France, Grenoble (38)","latitude":45.172245,"longitude":5.708461,"description":"Des feux de poubelles aux abords du lycée ont nécessité une intervention et un confinement, selon un arrêté préfectoral reproduit par Pappers. Repère de l’établissement ; emplacement précis des départs de feu non indiqué.","source_url":"https://politique.pappers.fr/commune/document/ea64daffd6284a32bb44ca6113322916"},
  {"id":-390,"type":"Agression physique","incident_date":"2026-10-09","address":"Abords du lycée Champollion, 1 cours La Fontaine, Grenoble (38)","latitude":45.187793,"longitude":5.725087,"description":"Des tirs de mortiers d’artifice ont été signalés aux abords du lycée, selon un arrêté préfectoral reproduit par Pappers. Repère de l’établissement, sans localisation précise des tirs ni victime établie dans cet extrait.","source_url":"https://politique.pappers.fr/commune/document/ea64daffd6284a32bb44ca6113322916"},
  {"id":-391,"type":"Agression physique","incident_date":"2026-10-09","address":"Abords du lycée Guynemer, 56 avenue Marcelin-Berthelot, Grenoble (38)","latitude":45.170749,"longitude":5.731966,"description":"Une assistante d’éducation au portail a été visée par des tirs de mortiers ; une poubelle a été incendiée, selon un arrêté préfectoral reproduit par Pappers. Repère de l’établissement.","source_url":"https://politique.pappers.fr/commune/document/ea64daffd6284a32bb44ca6113322916"},
  {"id":-392,"type":"Agression physique","incident_date":"2026-10-12","address":"Abords du lycée Louise-Michel, 30 rue Louise-Michel, Grenoble (38)","latitude":45.16861,"longitude":5.707773,"description":"Des tirs de mortiers ont visé la direction et des personnels ; un agent a été atteint sans être blessé, selon un arrêté préfectoral reproduit par Pappers. Des feux de poubelles sont également rapportés. Repère des abords de l’établissement.","source_url":"https://politique.pappers.fr/commune/document/8a42842505c5d72bdabc6fde93979c27"},
  {"id":-393,"type":"Agression physique","incident_date":"2026-10-12","address":"Abords du lycée Vaucanson, 27 rue Anatole-France, Grenoble (38)","latitude":45.172245,"longitude":5.708461,"description":"Des affrontements et tirs de mortiers visant les forces de l’ordre ont nécessité l’intervention des CRS et le confinement des élèves, selon un arrêté préfectoral reproduit par Pappers. Repère des abords de l’établissement.","source_url":"https://politique.pappers.fr/commune/document/8a42842505c5d72bdabc6fde93979c27"},
  {"id":-394,"type":"Agression physique","incident_date":"2026-10-14","address":"Rue Casimir-Brenier, Grenoble (38)","latitude":45.191796,"longitude":5.718198,"description":"Une jeune femme a subi un vol de sac à l’arraché ; son accompagnateur a été frappé. Trois suspects ont été interpellés, selon Le Dauphiné Libéré. Repère de la rue, point exact non précisé.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/14/trois-suspects-arretes-apres-une-agression","incident_time":"01:45"},
  {"id":-395,"type":"Dégradation","incident_date":"2026-10-17","address":"Hôtel de ville, boulevard Jean-Pain, Grenoble (38)","latitude":45.186785,"longitude":5.736167,"description":"Des vitres et accès de l’hôtel de ville ont été endommagés lors des violences du 17 octobre, selon la préfecture de l’Isère. Repère du bâtiment, éléments précis non localisés.","source_url":"https://www.isere.gouv.fr/Actualites/Espace-presse/Communiques-de-presse/Manifestations-du-17-octobre-La-prefete-de-l-Isere-condamne-fermement-les-violences-et-pillages/%28theme%29/125"},
  {"id":-396,"type":"Dégradation","incident_date":"2026-10-17","address":"Rectorat, place Bir-Hakeim, Grenoble (38)","latitude":45.188607,"longitude":5.736728,"description":"Le rectorat a été pris pour cible et a subi des dégradations de vitres et d’accès, selon la préfecture de l’Isère. Repère du bâtiment.","source_url":"https://www.isere.gouv.fr/Actualites/Espace-presse/Communiques-de-presse/Manifestations-du-17-octobre-La-prefete-de-l-Isere-condamne-fermement-les-violences-et-pillages/%28theme%29/125"},
  {"id":-397,"type":"Incendie volontaire","incident_date":"2026-10-17","address":"Secteur de l’arrêt de tram Alsace-Lorraine, Grenoble (38)","latitude":45.189526,"longitude":5.719387,"description":"La préfecture rapporte un important incendie de bâtiment au niveau de l’arrêt de tram Alsace-Lorraine dans son bilan des feux d’origine criminelle. Repère du secteur de l’arrêt ; le bâtiment exact n’est pas désigné dans le communiqué.","source_url":"https://www.isere.gouv.fr/Actualites/Espace-presse/Communiques-de-presse/Manifestations-du-17-octobre-La-prefete-de-l-Isere-condamne-fermement-les-violences-et-pillages/%28theme%29/125"},
  {"id":-398,"type":"Cambriolage","incident_date":"2026-10-17","address":"Librairie Momie Mangas, 12 Grande Rue, Grenoble (38)","latitude":45.19207,"longitude":5.728606,"description":"La librairie a été pillée le 17 octobre. Grenoble Mag rapporte la condamnation, le 4 novembre, d’un participant à dix-huit mois de prison dont six avec sursis probatoire. La date de cette fiche est celle du pillage. Repère à l’adresse du commerce publiée.","source_url":"https://www.grenoblemag.com/article/3593/grenoble-un-homme-condamne-a-18-mois-de-prison-apres-le-pillage-de-momie-manga"},
  {"id":-399,"type":"Agression physique","incident_date":"2026-10-21","address":"Rue de Narvik, près du jardin Hoche, Grenoble (38)","latitude":45.18301,"longitude":5.728042,"description":"Un homme aurait été extrait de sa voiture et frappé à coups de crosse par plusieurs individus ; le véhicule a ensuite été incendié, selon Le Dauphiné Libéré. Repère de la rue, lieu exact non précisé.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/21/ils-l-assomment-a-coups-de-crosse-avant-d-incendier-sa-voiture","incident_time":"04:30"},
  {"id":-400,"type":"Dégradation","incident_date":"2026-10-24","address":"Carrefour City, 31 cours Jean-Jaurès, Grenoble (38)","latitude":45.187485,"longitude":5.719116,"description":"Des individus ont tenté de pénétrer dans le commerce pendant des dégradations et tentatives de pillage. Un homme a brandi une arme, possiblement factice, pour les repousser. Grenoble Mag rapporte l’ouverture d’une enquête préliminaire. Repère du commerce ; la nature de l’arme et les responsabilités ne sont pas établies.","source_url":"https://www.grenoblemag.com/article/3522/grenoble-il-brandit-une-arme-pour-empecher-des-casseurs-d-entrer-dans-un-carrefour-city-une-enquete-ouverte"},
  {"id":-401,"type":"Dégradation","incident_date":"2026-10-25","address":"Gare routière, place de la Gare, Grenoble (38)","latitude":45.192845,"longitude":5.714029,"description":"Un car transportant des militants RN a été attaqué par des individus cagoulés et ses vitres brisées, sans blessé signalé. Le parquet a confirmé une enquête pour violences aggravées et destruction de bien, selon Grenoble Mag. Repère de la gare routière, emplacement précis du car non indiqué.","source_url":"https://www.grenoblemag.com/article/3523/grenoble-un-car-de-militants-rn-attaque-avant-le-depart-pour-le-congres-d-orleans","incident_time":"05:00"},
  {"id":-402,"type":"Vol à main armée","incident_date":"2026-10-27","address":"Rue Général-Rambaud, Grenoble (38)","latitude":45.182236,"longitude":5.720483,"description":"Un passant a été frappé et blessé aux poignets avec un couteau pour lui dérober son sac, qui contenait son téléphone et ses moyens de paiement, selon les informations policières relayées par Le Dauphiné Libéré. Repère de la rue, point exact non précisé.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/27/un-passant-roue-de-coups-et-blesse-a-coups-de-couteau-par-des-voleurs","incident_time":"02:30"},
  {"id":-403,"type":"Dégradation","incident_date":"2026-10-31","address":"Secteur place Gustave-Rivet et grands boulevards, Grenoble (38)","latitude":45.182001,"longitude":5.727936,"description":"Grenoble Mag rapporte des jets de projectiles, tirs de mortiers, feux de poubelles et dégradations de banques, assurances et caméras dans plusieurs rues. Repère du secteur où les tensions ont commencé ; cette fiche regroupe la journée, sans attribuer toutes les dégradations à la place.","source_url":"https://www.grenoblemag.com/article/3560/grenoble-19-interpellations-11-policiers-blesses-et-de-nouvelles-violences-apres-la-manifestation"},
  {"id":-404,"type":"Incendie volontaire","incident_date":"2026-11-04","address":"Portail du lycée Vaucanson, 27 rue Anatole-France, Grenoble (38)","latitude":45.172245,"longitude":5.708461,"description":"Des poubelles ont été incendiées contre le portail entre 7 h et 9 h, entraînant l’évacuation puis la fermeture de l’établissement, selon Le Dauphiné Libéré. Repère de l’établissement, à proximité de son accès.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/04/feux-de-poubelles-tirs-de-mortiers-sur-des-etablissements-interpellations-nouvelle-matinee-agitee-devant-les-lycees"},
  {"id":-405,"type":"Agression physique","incident_date":"2026-11-04","address":"Abords du lycée Louise-Michel, 30 rue Louise-Michel, Grenoble (38)","latitude":45.16861,"longitude":5.707773,"description":"Des tirs de mortiers et jets de pierres ont suivi un incendie de poubelles. Une interpellation pour des tirs présumés sur des CRS est rapportée par Le Dauphiné Libéré. Repère des abords du lycée.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/04/feux-de-poubelles-tirs-de-mortiers-sur-des-etablissements-interpellations-nouvelle-matinee-agitee-devant-les-lycees"},
  {"id":-406,"type":"Incendie volontaire","incident_date":"2026-11-04","address":"Abords du lycée Champollion, 1 cours La Fontaine, Grenoble (38)","latitude":45.187793,"longitude":5.725087,"description":"Un feu de poubelle allumé devant le lycée a été éteint par un membre du personnel, selon Le Dauphiné Libéré. Repère des abords de l’établissement, point exact du feu non précisé.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/04/feux-de-poubelles-tirs-de-mortiers-sur-des-etablissements-interpellations-nouvelle-matinee-agitee-devant-les-lycees"},
  {"id":-407,"type":"Dégradation","incident_date":"2026-11-05","address":"Grenoble — lieux des dégradations non précisés, Grenoble (38)","latitude":45.1885,"longitude":5.7245,"description":"La préfecture rapporte une vitrine bancaire et une caméra dégradées, ainsi que des tirs de mortiers vers les forces de l’ordre en marge de la manifestation. Le communiqué ne situe pas les établissements visés. Repère communal approximatif ; ce point n’identifie aucun commerce particulier.","source_url":"https://www.isere.gouv.fr/index.php/Actualites/Espace-presse/Communiques-de-presse/Journee-nationale-d-action-du-jeudi-5-novembre-2026"},
  {"id":-408,"type":"Agression physique","incident_date":"2026-11-06","address":"Foire d’automne, Alpexpo, avenue d’Innsbruck, Grenoble (38)","latitude":45.15511,"longitude":5.73633,"description":"Un homme a été blessé à la tête avec une bouteille en verre après être intervenu dans un différend à la Foire d’automne, selon Grenoble Mag. Repère du site Alpexpo ; le stand ou bar exact n’est pas localisé.","source_url":"https://www.grenoblemag.com/article/3604/grenoble-un-homme-blesse-a-coups-de-bouteille-a-la-foire-d-automne-d-alpexpo"},
  {"id":-409,"type":"Dégradation","incident_date":"2026-11-07","address":"Grenoble — parcours de manifestation et grands boulevards, Grenoble (38)","latitude":45.1885,"longitude":5.7245,"description":"La préfecture rapporte des vitrines brisées et des tirs de mortiers visant notamment un commerce, une agence notariale, un bar-tabac, des policiers et des riverains. Repère communal approximatif : les établissements et les points de tir ne sont pas précisément situés dans le communiqué.","source_url":"https://www.isere.gouv.fr/index.php/Actualites/Espace-presse/Communiques-de-presse/Bilan-des-manifestations-du-samedi-7-novembre-2026"},
  {"id":-410,"type":"Dégradation","incident_date":"2026-11-09","address":"Muséum, 1 rue Dolomieu, Grenoble (38)","latitude":45.188075,"longitude":5.735159,"description":"Deux vitres ont été brisées à l’aide d’une pierre, déclenchant l’alarme, selon Grenoble Mag. Aucun vol n’a été constaté ; l’intention de cambrioler reste indéterminée. Repère du muséum, sans localisation des fenêtres endommagées.","source_url":"https://www.grenoblemag.com/article/3615/grenoble-deux-vitres-brisees-au-museum-la-police-intervient-en-pleine-nuit","incident_time":"22:45"},
  {"id":-411,"type":"Agression physique","incident_date":"2026-11-16","address":"Lycée Vaucanson, 27 rue Anatole-France, Grenoble (38)","latitude":45.172245,"longitude":5.708461,"description":"Des tirs de mortiers ont été déclenchés dans les locaux du lycée ; cinq élèves ont été touchés selon Grenoble Mag, qui relaie Actu.fr. La direction a annoncé un dépôt de plainte. Les responsabilités restent à établir. Repère de l’établissement, salle exacte non précisée.","source_url":"https://www.grenoblemag.com/article/3692/grenoble-cinq-eleves-touches-par-des-tirs-de-mortiers-au-lycee-vaucanson","incident_time":"10:00"},
  {"id":-412,"type":"Vol simple","incident_date":null,"address":"Fontaine des Enfants du Drac, parc Paul-Mistral, Grenoble (38)","latitude":45.18528,"longitude":5.73833,"description":"Le vol d’une couronne métallique de la fontaine a été découvert début novembre et rendu public le 9 novembre 2026. La Ville annonce une plainte et le retrait provisoire de l’ouvrage, selon Grenoble Actualité. Date du vol inconnue. Repère approximatif du parc : l’emplacement exact de la fontaine n’a pas été confirmé.","source_url":"https://grenoble-actualite.fr/grenoble-fontaine-enfants-drac-vol/"},
  {"id":-413,"type":"Menaces","incident_date":null,"address":"Grenoble — établissement non confirmé, Grenoble (38)","latitude":45.1885,"longitude":5.7245,"description":"Le parquet a annoncé le 13 novembre 2026 une enquête pour menace et intimidation après le signalement d’une proviseure. La date exacte des propos n’est pas établie et leur auteur n’est pas identifié, selon Grenoble Mag. Repère communal approximatif ; aucun établissement ni auteur n’est désigné par ce point.","source_url":"https://www.grenoblemag.com/article/3671/menaces-contre-une-proviseure-a-grenoble-l-auteur-n-est-pas-identifie-l-accusation-visant-un-elu-lfi-s-effrite"},
  {"id":-375,"type":"Trafic de stupéfiants","incident_date":"2026-11-09","address":"Patio du centre commercial des Époisses, Besançon (25)","latitude":47.22241,"longitude":5.97491,"description":"Des ventes de stupéfiants ont été observées sous le patio du centre commercial des Époisses, selon les informations policières relayées par maCommune.info. Une personne interpellée a reconnu les ventes. Repère du centre commercial ; le point précis sous le patio n’est pas indiqué.","source_url":"https://www.macommune.info/besancon-un-jeune-vendeur-de-cocaine-interpelle-a-planoise/"},
  {"id":-376,"type":"Trafic de stupéfiants","incident_date":"2026-11-08","address":"Rue du Refuge, Besançon (25)","latitude":47.25536,"longitude":6.023051,"description":"La police a observé des échanges de stupéfiants sur un parking derrière une résidence de la rue du Refuge, puis procédé à une interpellation, selon maCommune.info. Repère de la rue : la résidence et le parking exacts ne sont pas précisés par la source.","source_url":"https://www.macommune.info/un-adolescent-de-17-ans-interpelle-en-flagrant-delit-de-vente-de-stupefiants-a-besancon/"},
  {"id":-377,"type":"Trafic de stupéfiants","incident_date":"2026-09-14","address":"Rue Professeur Haag, Besançon (25)","latitude":47.246205,"longitude":6.004881,"description":"À la suite de renseignements de riverains, une perquisition dans les caves d’un immeuble de la rue Professeur Haag a permis de découvrir des stupéfiants, selon L’Est Républicain. Il s’agit d’un lieu de stockage signalé dans une enquête sur un trafic, sans point de vente établi à cette adresse. Repère de la rue, immeuble non précisé.","source_url":"https://www.estrepublicain.fr/faits-divers-justice/2026/09/21/plus-de-4-kg-de-drogue-saisis-suite-a-des-renseignements-transmis-par-des-riverains"},
  {"id":-378,"type":"Trafic de stupéfiants","incident_date":"2026-10-12","address":"Rue des Fossés, Melun (77)","latitude":48.540884,"longitude":2.659009,"description":"Une perquisition dans un logement de la rue des Fossés a permis de saisir du cannabis, du matériel de conditionnement et de l’argent liquide dans une affaire de revente, selon Le Parisien. La source situe la perquisition dans cette rue, sans établir le lieu exact des ventes. Repère de la rue, logement non précisé.","source_url":"https://www.leparisien.fr/seine-et-marne-77/trafic-de-cannabis-en-plein-centre-ville-de-melun-a-21-ans-il-cachait-15-200-euros-en-liquide-chez-lui-15-10-2026-IJJB65DO3BHMBD3QPLLA47KSYY.php"},
  {"id":-379,"type":"Trafic de stupéfiants","incident_date":"2026-09-08","address":"Secteur place Saint-Clément, Mâcon (71)","latitude":46.297913,"longitude":4.821496,"description":"Des ventes de cannabis ont été constatées près de l’aire de jeux derrière l’église Saint-Clément, selon Mâcon Infos. La surveillance, commencée le 4 août, s’est poursuivie jusqu’au 8 septembre 2026 ; la date retenue correspond à ce dernier jour. Deux personnes ont été condamnées le 27 octobre. Repère du secteur de la place, emplacement précis des transactions non établi.","source_url":"https://www.macon-infos.com/fr/faits-divers/94-macon/51267-macon-trafic-de-drogue-des-milliers-de-transactions-a-st-clement-pendant-un-mois-deux-dealers-condamnes"},
  {"id":-372,"type":"Agression physique","incident_date":"2026-11-16","address":"Lyon (69)","latitude":45.764,"longitude":4.8357,"description":"Un agent de sécurité a été blessé à la gare de la Part-Dieu et transporté à l’hôpital. La SNCF confirme une plainte. Une enquête cherche à identifier l’auteur présumé. Repère communal.","source_url":"https://www.lyonmag.com/article/154967/lyon-un-agent-de-securite-agresse-a-la-gare-de-la-part-dieu-son-agresseur-en-fuite"},
  {"id":-373,"type":"Cambriolage","incident_date":"2026-11-16","incident_time":"19:00","address":"Les Fins (25)","latitude":47.077,"longitude":6.631,"description":"Une habitation a fait l’objet d’une effraction en l’absence de son occupant, selon Radio Plein Air. Le cambriolage a été signalé vers 19 h. Repère communal.","source_url":"https://pleinair.net/actualites/item/22229-les-fins-cambriolage-dans-une-habitation"},
  {"id":-374,"type":"Cambriolage","incident_date":"2026-11-14","address":"La Seyne-sur-Mer (83)","latitude":43.103,"longitude":5.879,"description":"La BAC est intervenue pour un cambriolage au cours de la nuit du 14 novembre, selon le bilan syndical relayé par Var Actu. L’article ne précise pas le bilan des interpellations pour cette seule affaire. Repère communal.","source_url":"https://www.varactu.fr/nuit-tendue-pour-les-policiers-a-la-seyne-sur-mer-quatre-personnes-interpellees/"},
  {"id":-360,"type":"Homicide","incident_date":"2026-11-15","address":"Les Abymes (971)","latitude":16.271,"longitude":-61.505,"description":"Une fusillade dans la nuit du 14 au 15 novembre a fait un mort et plusieurs blessés. Le parquet a confirmé les faits. Repère communal.","source_url":"https://www.leparisien.fr/guadeloupe-971/guadeloupe-fusillade-en-marge-dune-soiree-privee-un-mort-et-au-moins-trois-blesses-15-11-2026-UTKQMVTM3BAPXPOAIVE52IKVSI.php"},
  {"id":-361,"type":"Homicide","incident_date":"2026-11-14","address":"La Courneuve (93)","latitude":48.932,"longitude":2.397,"description":"Le parquet de Bobigny a ouvert une enquête pour homicide volontaire aggravé après la découverte du corps d’une femme. Le 14 novembre correspond à la découverte. La date du décès reste à établir. Repère communal.","source_url":"https://www.ladepeche.fr/2026/11/15/seine-saint-denis-trois-personnes-placees-en-garde-a-vue-apres-la-decouverte-du-cadavre-dune-femme-dune-cinquantaine-dannees-dans-un-garage-automobile-13653790.php"},
  {"id":-362,"type":"Agression physique","incident_date":"2026-11-13","address":"Saint-Joseph (974)","latitude":-21.378,"longitude":55.619,"description":"Un conducteur de bus a été blessé lors d’une agression. L’intercommunalité a confirmé les faits et annoncé le dépôt d’une plainte par le transporteur. Repère communal.","source_url":"https://www.linfo.re/la-reunion/faits-divers/saint-joseph-un-chauffeur-de-bus-violemment-agresse-apres-avoir-demande-a-un-passager-d-arreter-de-fumer"},
  {"id":-365,"type":"Agression physique","incident_date":"2026-11-16","address":"Toulouse (31)","latitude":43.581,"longitude":1.416,"description":"Un homme a été grièvement blessé par balle dans le quartier de Papus. Le mobile reste à établir. Repère approximatif dans la commune.","source_url":"https://www.ladepeche.fr/2026/11/16/un-homme-grievement-blesse-par-quatre-balles-quatrieme-fusillade-en-trois-jours-a-toulouse-13655914.php"},
  {"id":-366,"type":"Agression physique","incident_date":"2026-11-15","address":"Toulouse (31)","latitude":43.622,"longitude":1.416,"description":"Un homme blessé par balle dans le quartier des Sept-Deniers a été hospitalisé. Les enquêteurs cherchent à établir le mobile. Repère approximatif dans la commune.","source_url":"https://www.ladepeche.fr/2026/11/16/il-gare-son-scooter-devant-chez-lui-et-se-fait-tirer-dessus-a-toulouse-un-homme-blesse-par-balles-apres-un-week-end-marque-par-les-fusillades-13654913.php"},
  {"id":-367,"type":"Agression physique","incident_date":"2026-11-15","address":"Rennes (35)","latitude":48.111,"longitude":-1.68,"description":"Plusieurs personnes ont été blessées à l’arme blanche le même après-midi dans le quartier du Blosne. Deux victimes ont déposé plainte. Le lien entre les faits reste à établir. Repère communal.","source_url":"https://www.leparisien.fr/faits-divers/trois-agressions-au-couteau-en-quelques-heures-a-rennes-les-enqueteurs-explorent-la-piste-dun-reglement-de-comptes-sur-fond-de-narcotrafic-16-11-2026-5NHTCLLN3FCSDLZJTLD4QS4YMA.php"},
  {"id":-368,"type":"Agression physique","incident_date":"2026-11-14","address":"Toulouse (31)","latitude":43.572,"longitude":1.405,"description":"Un homme a été frappé puis blessé par balle dans le quartier de Bellefontaine. Une enquête distincte a été ouverte. Repère approximatif dans la commune.","source_url":"https://www.ladepeche.fr/2026/11/15/un-jeune-homme-tue-par-balles-a-toulouse-ses-amis-lont-conduit-a-purpan-dans-une-voiture-criblee-dimpacts-le-ou-les-tireurs-en-fuite-13653523.php"},
  {"id":-371,"type":"Dégradation","incident_date":"2026-11-15","address":"Valros (34)","latitude":43.421,"longitude":3.365,"description":"Une explosion a provoqué un incendie et des dégâts matériels sur un site professionnel. Aucun blessé n’a été signalé. La gendarmerie est intervenue. Repère communal.","source_url":"https://www.leparisien.fr/herault-34/un-negociant-en-vins-vise-par-un-engin-explosif-dans-lherault-un-groupe-radical-de-producteurs-revendique-laction-16-11-2026-RMTLKRSKBFE3HHWDHUJ6277UBQ.php"},
  {"id":-369,"type":"Homicide","incident_date":"2026-11-13","address":"Narbonne (11)","latitude":43.184,"longitude":3.004,"description":"Un homme est décédé après avoir été retrouvé grièvement blessé. Le parquet a annoncé une garde à vue pour meurtre. Une autopsie doit préciser les circonstances du décès. Repère communal.","source_url":"https://www.leparisien.fr/faits-divers/narbonne-un-homme-retrouve-lacere-a-la-gorge-dans-une-voiture-une-femme-de-26-ans-placee-en-garde-a-vue-16-11-2026-2XMU244W3NFDRBHFYEHA6CM2BQ.php"},
  {"id":-370,"type":"Homicide","incident_date":"2026-11-13","address":"La Rochelle (17)","latitude":46.16,"longitude":-1.15,"description":"Un homme est décédé à l’hôpital après une agression dans la nuit du 12 au 13 novembre. Deux personnes ont été mises en examen, respectivement pour meurtre et complicité de meurtre. Repère communal.","source_url":"https://www.ouest-france.fr/nouvelle-aquitaine/la-rochelle-17000/un-homme-succombe-a-ses-blessures-a-lhopital-apres-une-agression-a-la-rochelle-deux-suspects-interpelles-47be0bc2-e1b1-11f1-8a68-1e9f9f2c4ff6"},
  {"id":-357,"type":"Agression physique","incident_date":"2026-11-11","address":"Avignon (84)","latitude":43.936,"longitude":4.806,"description":"Deux hommes ont été blessés lors d’une fusillade dans le quartier Monclar. Repère communal.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/11/fusillade-a-avignon-deux-hommes-blesses-par-balles-l-un-d-eux-hospitalise-en-urgence-absolue"},
  {"id":-358,"type":"Homicide","incident_date":"2026-10-28","address":"Saint-François (971)","latitude":16.253,"longitude":-61.277,"description":"Un homme a été tué. Une mise en examen a été annoncée dans la presse locale. Repère communal.","source_url":"https://rci.fm/guadeloupe/infos/Justice/Meurtre-dEnzo-Saint-Francois-un-suspect-mis-en-examen-et-place-en-detention"},
  {"id":-359,"type":"Cambriolage","incident_date":"2026-11-09","address":"Sioniac (19)","latitude":44.979,"longitude":1.815,"description":"Une habitante a été retenue dans son logement lors d’un cambriolage dans la nuit du 8 au 9 novembre. Repère communal.","source_url":"https://correzeactu.com/actualites/sioniac-une-femme-de-87-ans-sequestree-lors-d-un-cambriolage"},
  {"id":-355,"type":"Agression physique","incident_date":"2026-11-13","address":"Versailles (78)","latitude":48.803,"longitude":2.126,"description":"Un vice-président d’université a été agressé dans les locaux de la présidence. Le parquet a ouvert une enquête pour violences avec arme. Repère communal.","source_url":"https://www.uvsq.fr/communique-du-professeur-loic-josseran-president-de-luniversite-de-versailles-saint-quentin-en-yvelines"},
  {"id":-356,"type":"Agression physique","incident_date":"2026-11-14","address":"Rougé (44)","latitude":47.782,"longitude":-1.446,"description":"Un homme a été grièvement blessé par balle lors d’une altercation. Les circonstances font l’objet d’investigations. Repère communal.","source_url":"https://www.ouest-france.fr/societe/faits-divers/la-descente-en-pleine-nuit-vire-au-reglement-de-compte-un-blesse-par-arme-a-feu-a-rouge-pres-de-chateaubriant-90d01536-e052-11f1-9a29-f4bab172af08"},
  {"id":-353,"type":"Alerte communale","incident_date":"2026-10-29","address":"Brézilhac (11)","latitude":43.154,"longitude":2.111,"description":"La mairie signale des tentatives d’intrusion dans des logements et appelle à la vigilance.","source_url":"https://app.panneaupocket.com/ville/887267225-brezilhac-11270"},
  {"id":-354,"type":"Alerte communale","incident_date":"2026-10-13","address":"Darnieulles (88)","latitude":48.199,"longitude":6.348,"description":"La mairie appelle à la vigilance après un vol signalé dans le véhicule d’un artisan.","source_url":"https://app.panneaupocket.com/ville/1587576406-darnieulles-88390?panneau=1568552053"},
  {"id":-343,"type":"Alerte communale","incident_date":"2026-11-02","address":"Vosne-Romanée (21)","latitude":47.161,"longitude":4.954,"description":"La mairie appelle à la vigilance après plusieurs cambriolages signalés dans la commune. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/173623280-vosne-romanee-21700?panneau=742225624"},
  {"id":-344,"type":"Alerte communale","incident_date":"2026-11-06","address":"Maraye-en-Othe (10)","latitude":48.16,"longitude":3.871,"description":"Un avis appelle à la vigilance après des cambriolages récents dans le secteur. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/1161130801-maraye-en-othe-10160?panneau=1328336347"},
  {"id":-345,"type":"Alerte communale","incident_date":"2026-11-12","address":"Bard-lès-Époisses (21)","latitude":47.517,"longitude":4.209,"description":"La commune relaie une alerte après un vol par ruse signalé dans le secteur de Semur-en-Auxois. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/1075341472-bard-les-epoisses-21460?panneau=1171548882"},
  {"id":-346,"type":"Alerte communale","incident_date":"2026-11-03","address":"Savigny-lès-Beaune (21)","latitude":47.063,"longitude":4.819,"description":"La commune relaie une alerte de la gendarmerie sur une hausse des cambriolages en Côte-d’Or et dans le secteur. Date de mise à jour de l’avis. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/1698947022-savigny-les-beaune-21420?panneau=748459722"},
  {"id":-347,"type":"Alerte communale","incident_date":"2026-11-08","address":"Moulins-le-Carbonnel (72)","latitude":48.374,"longitude":-0.024,"description":"La mairie signale des tentatives de cambriolage et des vols de véhicules dans la commune. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/1447884592-moulins-le-carbonnel-72130"},
  {"id":-348,"type":"Alerte communale","incident_date":"2026-11-04","address":"Brézilhac (11)","latitude":43.154,"longitude":2.111,"description":"La mairie signale plusieurs tentatives de cambriolage et un cambriolage survenu le 3 novembre. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/887267225-brezilhac-11270?panneau=2133648527"},
  {"id":-349,"type":"Alerte communale","incident_date":"2026-11-09","address":"Dammartin-Marpain (39)","latitude":47.279,"longitude":5.519,"description":"La mairie appelle à la vigilance après plusieurs cambriolages signalés par la gendarmerie dans les communes voisines. Repère de la commune qui diffuse l’alerte.","source_url":"https://app.panneaupocket.com/ville/1204241229-dammartin-marpain-39290?panneau=1290596776"},
  {"id":-350,"type":"Alerte communale","incident_date":"2026-11-09","address":"Dunières (43)","latitude":45.215,"longitude":4.345,"description":"La mairie relaie un appel à la vigilance de la gendarmerie après des cambriolages dans le secteur. Repère de la commune qui diffuse l’alerte.","source_url":"https://station.illiwap.com/index.php/fr/public/43087/actu/gendarmerie-nationale-appel-a-la-vigilance-3-2"},
  {"id":-351,"type":"Alerte communale","incident_date":"2026-11-04","address":"Archigny (86)","latitude":46.674,"longitude":0.652,"description":"La mairie appelle à la vigilance après des signalements locaux et des cambriolages dans les communes voisines. Repère de la commune qui diffuse l’alerte.","source_url":"https://www.mairie-archigny.fr/actualites/1042866"},
  {"id":-352,"type":"Alerte communale","incident_date":"2026-10-30","address":"Salles-sur-Mer (17)","latitude":46.105,"longitude":-1.058,"description":"La mairie appelle à la vigilance après des signalements de repérages et de cambriolages dans le secteur. Repère de la commune qui diffuse l’alerte.","source_url":"https://www.salles-sur-mer.fr/vigilance-reperages-et-cambriolages/"},
  {"id":-335,"type":"Homicide","incident_date":"2026-11-08","address":"Brosses (89)","latitude":47.526,"longitude":3.691,"description":"Une femme a été tuée. Son ancien compagnon est mis en cause dans les informations publiées. Repère communal.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/09/un-psychanalyste-tue-son-ex-compagne-dans-l-yonne-puis-se-suicide-dans-son-cabinet-a-paris"},
  {"id":-336,"type":"Homicide","incident_date":"2026-11-10","address":"Die (26)","latitude":44.754,"longitude":5.371,"description":"Deux personnes ont été retrouvées mortes. Selon les résultats d’autopsie rapportés par la presse, l’hypothèse d’un homicide suivi d’un suicide est privilégiée. Date de découverte. Repère communal.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/12/couple-de-retraites-retrouves-morts-a-die-les-autopsies-confortent-l-hypothese-d-un-homicide-suivi-d-un-suicide"},
  {"id":-337,"type":"Homicide","incident_date":"2026-11-07","address":"Capesterre-Belle-Eau (971)","latitude":16.045,"longitude":-61.565,"description":"Un homme est décédé après une agression. Un suspect a été placé en garde à vue, selon RCI. Repère communal.","source_url":"https://rci.fm/guadeloupe/infos/Faits-divers/Un-homme-dune-quarantaine-dannees-tue-par-arme-blanche-Capesterre-Belle-Eau"},
  {"id":-338,"type":"Homicide","incident_date":"2026-11-07","address":"Fort-de-France (972)","latitude":14.605,"longitude":-61.072,"description":"Une fusillade dans le quartier des Terres-Sainville a fait une morte et une blessée. Repère communal.","source_url":"https://rci.fm/martinique/infos/fais-divers?ak=1_378_4&ile=martinique&page=26&pg=2"},
  {"id":-339,"type":"Homicide","incident_date":"2026-11-02","address":"Le Lamentin (972)","latitude":14.614,"longitude":-61.001,"description":"Un homme a été tué au Lamentin après avoir été enlevé à Fort-de-France, selon RCI. Affaire rendue publique le 2 novembre. Repère communal.","source_url":"https://rci.fm/martinique/infos/fais-divers?ak=1_378_4&ile=martinique&page=26&pg=2"},
  {"id":-340,"type":"Tentative de cambriolage","incident_date":"2026-10-09","address":"Champagne-au-Mont-d’Or (69)","latitude":45.794,"longitude":4.79,"description":"Tentative de cambriolage d’une bijouterie. La gendarmerie a annoncé trois interpellations. Repère communal.","source_url":"https://www.gendarmerie.interieur.gouv.fr/gendinfo/criminalite-organisee-et-enquetes/2026/rhone-trois-individus-interpelles-apres-avoir-tente-de-cambrioler-une-bijouterie-a-l-aide-d-un-outil-derobe-dans-une-caserne-de-sapeurs-pompiers"},
  {"id":-341,"type":"Tentative de cambriolage","incident_date":"2026-10-15","address":"Eydoche (38)","latitude":45.418,"longitude":5.335,"description":"L’agence postale a été ciblée dans la nuit du 14 au 15 octobre. Des dégâts ont été signalés. Repère communal.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/15/c-est-la-deuxieme-fois-en-quatre-mois-que-nous-sommes-cambrioles-le-casse-de-l-agence-postale-avorte"},
  {"id":-342,"type":"Cambriolage","incident_date":"2026-11-13","address":"Saint-Varent (79)","latitude":46.89,"longitude":-0.234,"description":"Cambriolage d’un bar-tabac dans la nuit du 12 au 13 novembre. Repère communal.","source_url":"https://www.ouest-france.fr/faits-divers/cambriolage/"},
  {"id":-324,"type":"Homicide","incident_date":"2026-01-01","address":"Les Arnavaux, Marseille 14e","latitude":43.34,"longitude":5.38,"description":"Un homme a été retrouvé mort dans un véhicule incendié. Date de découverte. Repère approximatif.","source_url":"https://www.tf1info.fr/justice-faits-divers/marseille-narchomicide-un-corps-retrouve-dans-le-coffre-d-une-voiture-incendiee-2416263.html"},
  {"id":-325,"type":"Homicide","incident_date":"2026-01-04","address":"Belsunce, Marseille 1er","latitude":43.299,"longitude":5.377,"description":"Des tirs ont fait un mort et un blessé. Repère approximatif.","source_url":"https://www.leparisien.fr/faits-divers/marseille-des-tirs-en-plein-centre-ville-font-un-mort-et-un-blesse-les-auteurs-en-fuite-04-01-2026-OC5QGBAQONBFDJFPPVU7IW2SKA.php"},
  {"id":-326,"type":"Agression physique","incident_date":"2026-04-01","address":"Quartiers nord, Marseille","latitude":43.348,"longitude":5.373,"description":"Des policiers municipaux ont été visés par des jets de projectiles. Les faits remontent au début d’avril. Le premier du mois sert de date indicative. Repère approximatif.","source_url":"https://www.tf1info.fr/justice-faits-divers/video-tf1-ca-me-fait-mal-au-coeur-des-habitants-de-marseille-decouvrent-les-images-de-policiers-municipaux-caillasses-2438037.html"},
  {"id":-327,"type":"Agression physique","incident_date":"2026-07-01","address":"Marseille","latitude":43.2965,"longitude":5.37,"description":"Un homme a été hospitalisé après une agression lors d’une altercation. Date de publication affichée. Repère approximatif.","source_url":"https://www.leparisien.fr/faits-divers/un-homme-hospitalise-apres-avoir-recu-une-douzaine-de-coups-de-couteau-lors-dune-bagarre-a-marseille-un-suspect-interpelle-01-07-2026-ZQGIPVZW5VAZBNEKWSOJPGPAKE.php"},
  {"id":-328,"type":"Homicide","incident_date":"2026-08-30","address":"Marseille 3e","latitude":43.311,"longitude":5.38,"description":"Une fusillade a fait un mort et quatre blessés. Repère approximatif.","source_url":"https://www.tf1info.fr/justice-faits-divers/marseille-un-homme-ouvre-le-feu-sur-la-terrasse-d-un-bar-a-chicha-rue-d-amiens-un-mort-et-quatre-blesses-2461239.html"},
  {"id":-329,"type":"Tentative de cambriolage","incident_date":"2026-08-31","address":"Campus Orange Massalia, Marseille","latitude":43.309,"longitude":5.369,"description":"Une tentative d’effraction a été signalée dans des locaux d’Orange. Repère approximatif.","source_url":"https://www.leparisien.fr/bouches-du-rhone-13/marseille-un-homme-interpelle-apres-un-vol-par-effraction-dans-les-locaux-dorange-01-09-2026-XKJ2R4IHBJCN7HCOP5XVC2AAJ4.php"},
  {"id":-330,"type":"Homicide","incident_date":"2026-09-10","address":"Marseille 9e","latitude":43.246,"longitude":5.405,"description":"Un homme est décédé après une agression. Une enquête pour homicide volontaire a été ouverte. Repère approximatif.","source_url":"https://www.leparisien.fr/faits-divers/marseille-un-homme-de-27-ans-succombe-a-deux-coups-de-couteau-une-enquete-pour-homicide-volontaire-ouverte-11-09-2026-P5FRSRPUWZC7RP256Q7MXJGZZA.php"},
  {"id":-331,"type":"Agression physique","incident_date":"2026-09-23","address":"Marseille 12e","latitude":43.307,"longitude":5.434,"description":"Un homme a été grièvement blessé par balle. Repère approximatif.","source_url":"https://www.leparisien.fr/bouches-du-rhone-13/il-venait-de-deposer-son-fils-au-stade-un-pere-de-famille-de-27-ans-blesse-par-balle-a-la-tete-a-marseille-23-09-2026-FRKZLV4VQRFZRH6KRULY6CMC44.php"},
  {"id":-332,"type":"Agression physique","incident_date":"2026-10-01","address":"Marseille","latitude":43.2965,"longitude":5.37,"description":"Une femme a été agressée en marge de la mobilisation lycéenne. Elle a porté plainte le lendemain. Repère approximatif.","source_url":"https://www.leparisien.fr/faits-divers/marseille-une-femme-visee-par-un-spray-transforme-en-lance-flammes-artisanal-en-marge-de-la-mobilisation-lyceenne-02-10-2026-G7VCMXIURNGLTPN4HC23YKZT6M.php"},
  {"id":-333,"type":"Homicide","incident_date":"2026-10-27","address":"Marseille 11e","latitude":43.295,"longitude":5.478,"description":"Un homme a été tué lors d’une fusillade. Repère approximatif.","source_url":"https://www.leparisien.fr/faits-divers/marseille-un-homme-de-21-ans-tue-par-des-tirs-de-kalachnikov-sur-un-point-de-deal-du-xie-arrondissement-28-10-2026-UL2ATB32MNC2TMJQBWNMX2PTAY.php"},
  {"id":-334,"type":"Homicide","incident_date":"2026-11-02","address":"La Cayolle, Marseille 9e","latitude":43.226,"longitude":5.416,"description":"Une fusillade lors du tournage d’un clip a fait un mort et un blessé grave. Repère approximatif.","source_url":"https://www.tf1info.fr/justice-faits-divers/marseille-un-mort-et-un-blesse-grave-au-cours-d-une-fusillade-lors-du-tournage-d-un-clip-2473614.html"},
  {"id":-313,"type":"Cambriolage","incident_date":"2026-11-12","address":"Rue de la Paix, Paris 2e (75)","latitude":48.869,"longitude":2.331,"description":"Braquage de la bijouterie De Beers vers 11 h 15. Le parquet a ouvert une enquête pour vol avec arme en bande organisée. Aucun blessé physique signalé.","source_url":"https://www.tf1info.fr/justice-faits-divers/paris-braquage-ce-jeudi-matin-dans-un-bijoutier-de-la-rue-de-la-paix-les-auteurs-en-fuite-2475438.html"},
  {"id":-314,"type":"Cambriolage","incident_date":"2026-09-03","address":"Pauillac (33)","latitude":45.2,"longitude":-0.748,"description":"Vol de matériel d’intervention dans une caserne de pompiers.","source_url":"https://www.gendarmerie.interieur.gouv.fr/gendinfo/criminalite-organisee-et-enquetes/2026/sept-interpellations-apres-une-serie-de-cambriolages-dans-plusieurs-casernes-de-sapeurs-pompiers-en-gironde"},
  {"id":-315,"type":"Cambriolage","incident_date":"2026-09-08","address":"Cagnes-sur-Mer (06)","latitude":43.663,"longitude":7.148,"description":"Vol d’œuvres au musée Auguste-Renoir, rendu public le 8 septembre.","source_url":"https://www.leparisien.fr/faits-divers/cagnes-sur-mer-cambriolage-au-musee-auguste-renoir-au-moins-quatre-oeuvres-volees-08-09-2026-AMU64IHAUFBSNKBEF7EYJXM6QE.php"},
  {"id":-316,"type":"Cambriolage","incident_date":"2026-09-26","address":"Yenne (73)","latitude":45.704,"longitude":5.761,"description":"Vol de matériel dans une caserne de pompiers, dans la nuit du 25 au 26 septembre.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/09/30/plusieurs-dizaines-de-milliers-d-euros-de-prejudice-la-caserne-des-pompiers-de-yenne-cambriolee"},
  {"id":-317,"type":"Cambriolage","incident_date":"2026-10-01","address":"Brest (29)","latitude":48.39,"longitude":-4.49,"description":"Cambriolage de locaux de gendarmerie mobile début octobre. Le jour affiché marque le début du mois à titre indicatif.","source_url":"https://www.ouest-france.fr/faits-divers/cambriolage/"},
  {"id":-318,"type":"Cambriolage","incident_date":"2026-10-22","address":"Valence (26)","latitude":44.933,"longitude":4.892,"description":"Cambriolage d’une bijouterie dans la nuit du 21 au 22 octobre.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/22/la-bijouterie-diamantor-a-ete-frappee-par-un-casse-nocturne-spectaculaire"},
  {"id":-319,"type":"Cambriolage","incident_date":"2026-10-29","address":"Annecy, secteur de Seynod (74)","latitude":45.884,"longitude":6.088,"description":"Plusieurs garages d’une résidence ont été cambriolés dans la nuit du 28 au 29 octobre.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/10/30/garages-fractures-et-velos-voles-dans-la-nuit"},
  {"id":-320,"type":"Cambriolage","incident_date":"2026-11-04","address":"Bressuire, secteur de Noirterre (79)","latitude":46.88,"longitude":-0.411,"description":"Cambriolage d’une épicerie le 4 novembre. Une nouvelle intrusion a été déjouée le 13 novembre.","source_url":"https://www.ouest-france.fr/faits-divers/cambriolage/"},
  {"id":-321,"type":"Cambriolage","incident_date":"2026-11-08","address":"Bernède (32)","latitude":43.674,"longitude":-0.248,"description":"Cambriolage d’un logement entre le 4 et le 8 novembre. Le 8 marque la fin de la période rapportée.","source_url":"https://www.ladepeche.fr/2026/11/09/ils-profitent-de-labsence-des-occupants-pour-derober-des-bijoux-deux-cambriolages-signales-dans-le-gers-13643688.php"},
  {"id":-322,"type":"Cambriolage","incident_date":"2026-11-08","address":"Fourcès (32)","latitude":43.993,"longitude":0.231,"description":"Cambriolage d’un logement et vol de bijoux.","source_url":"https://www.ladepeche.fr/2026/11/09/ils-profitent-de-labsence-des-occupants-pour-derober-des-bijoux-deux-cambriolages-signales-dans-le-gers-13643688.php"},
  {"id":-323,"type":"Cambriolage","incident_date":"2026-11-12","address":"Plaine du Forez (42)","latitude":45.59,"longitude":4.235,"description":"Six cambriolages signalés à Saint-Galmier, Andrézieux-Bouthéon et Saint-Just-Saint-Rambert. Repère de secteur, répartition par commune inconnue.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/13/six-cambriolages-dans-la-plaine-du-forez-les-gendarmes-tirent-la-sonnette-d-alarme"},
  {"id":-309,"type":"Homicide","incident_date":"2026-11-15","address":"Toulouse (31)","latitude":43.6045,"longitude":1.444,"description":"Un homme est décédé après avoir été mortellement blessé. Le parquet a saisi les enquêteurs. Le lieu précis des faits restait à confirmer. Repère communal.","source_url":"https://www.ladepeche.fr/2026/11/15/un-jeune-homme-tue-par-balles-a-toulouse-ses-amis-lont-conduit-a-purpan-dans-une-voiture-criblee-dimpacts-le-ou-les-tireurs-en-fuite-13653523.php"},
  {"id":-310,"type":"Homicide","incident_date":"2026-11-13","address":"Saint-Benoît (974)","latitude":-21.033,"longitude":55.713,"description":"Le parquet a annoncé une enquête pour meurtre après la découverte d’un corps le 13 novembre. La date affichée correspond à la découverte. Repère communal.","source_url":"https://www.zinfos974.com/saint-benoit-un-corps-decouvert-une-enquete-ouverte-pour-meurtre/"},
  {"id":-311,"type":"Homicide","incident_date":"2026-11-11","address":"La Tour-du-Crieu (09)","latitude":43.104,"longitude":1.652,"description":"Une femme a été tuée le 11 novembre. Le parquet de Foix a annoncé l’ouverture d’une enquête pour meurtre aggravé. Repère communal.","source_url":"https://www.ladepeche.fr/2026/11/12/une-femme-de-75-ans-tuee-en-ariege-le-principal-suspect-reconnait-avoir-frappe-la-victime-une-enquete-judiciaire-en-flagrance-ouverte-du-chef-de-13649711.php"},
  {"id":-312,"type":"Homicide","incident_date":"2026-11-02","address":"La Turballe (44)","latitude":47.347,"longitude":-2.508,"description":"Un homme a été retrouvé mort le 2 novembre. Une information judiciaire a été ouverte contre X pour assassinat. La date affichée correspond à la découverte. Repère communal.","source_url":"https://www.leparisien.fr/faits-divers/loire-atlantique-un-homme-de-40-ans-tue-par-arme-a-feu-pres-dune-plage-de-la-turballe-son-corps-decouvert-par-des-promeneurs-04-11-2026-JFYOETNALVEA3AN2BN3HPETIOU.php"},
  {"id":-301,"type":"Homicide","incident_date":"2026-11-13","address":"Charleville-Mézières (08)","latitude":49.77,"longitude":4.72,"description":"Une femme a été tuée. Le parquet a ouvert une enquête pour homicide volontaire. Repère communal.","source_url":"https://www.tf1info.fr/justice-faits-divers/ardennes-une-femme-tuee-dans-un-appartement-de-charleville-mezieres-son-ex-compagnon-en-garde-a-vue-2475851.html"},
  {"id":-302,"type":"Homicide","incident_date":"2026-11-01","address":"Tremblay-en-France (93)","latitude":48.95,"longitude":2.57,"description":"Un homme a été tué. Une enquête pour homicide volontaire a été ouverte. Repère communal.","source_url":"https://www.tf1info.fr/justice-faits-divers/seine-saint-denis-un-homme-de-24-ans-abattu-dans-une-voiture-en-pleine-rue-une-enquete-ouverte-2473351.html"},
  {"id":-303,"type":"Homicide","incident_date":"2026-11-13","address":"Secteur de Largentière (07)","latitude":44.54,"longitude":4.29,"description":"Un homme a été mortellement agressé après un vol présumé. Repère approximatif à l’échelle du secteur.","source_url":"https://www.ledauphine.com/faits-divers-justice/2026/11/13/un-patissier-perd-la-vie-apres-avoir-ete-poignarde-lors-d-un-vol-a-l-arrache-a-largentiere"},
  {"id":-304,"type":"Agression physique","incident_date":"2026-11-01","address":"Lyon (69)","latitude":45.767,"longitude":4.834,"description":"Une personne a été grièvement blessée lors d’une agression rapportée près de l’hôtel de ville. Repère approximatif.","source_url":"https://www.lyonmag.com/article/154672/lyon-une-violente-agression-au-couteau-pres-de-l-hotel-de-ville-une-victime-entre-la-vie-et-la-mort"},
  {"id":-305,"type":"Cambriolage","incident_date":"2026-11-05","address":"Auray (56)","latitude":47.67,"longitude":-2.98,"description":"Cambriolage d’un commerce dans la nuit du 4 au 5 novembre. Repère communal.","source_url":"https://www.ouest-france.fr/faits-divers/cambriolage/"},
  {"id":-306,"type":"Cambriolage","incident_date":"2026-11-12","address":"La Mézière (35)","latitude":48.22,"longitude":-1.75,"description":"Cambriolage d’un magasin de vélos dans la nuit du 11 au 12 novembre. Repère communal.","source_url":"https://www.ouest-france.fr/faits-divers/cambriolage/"},
  {"id":-307,"type":"Car-jacking","incident_date":"2026-10-22","address":"Saint-Romain-en-Gal (69)","latitude":45.53,"longitude":4.86,"description":"Tentative de vol de véhicule avec violences rapportée dans la nuit du 21 au 22 octobre. Repère communal.","source_url":"https://uat-cdn-s-www.leprogres.fr/faits-divers-justice/2026/10/22/tentative-de-car-jacking-violences-et-coups-de-feu-nuit-agitee-dans-le-village-de-saint-romain-en-gal"},
  {"id":-308,"type":"Rodéo urbain","incident_date":"2026-11-08","address":"Chanteloup-les-Vignes (78)","latitude":48.98,"longitude":2.03,"description":"Rodéo motorisé suivi de heurts avec la police, selon la presse locale. Repère communal.","source_url":"https://www.infosyvelines.fr/articles/chanteloup-les-vignes-heurts-police-apres-rodeo-urbain"},
  {"id":-201,"type":"Agression physique","incident_date":"2026-11-04","address":"Évry-Courcouronnes (91)","latitude":48.63,"longitude":2.44,"description":"Agression rapportée dans la nuit. Repère communal, lieu précis de l’agression non établi.","source_url":"https://www.leparisien.fr/essonne-91/evry-un-homme-agresse-a-larme-blanche-dans-la-nuit-son-agresseur-interpelle-04-11-2026-W44IJG2KYVBH7OBNX5SV4W4HTQ.php"},
  {"id":-202,"type":"Alerte communale","incident_date":"2026-09-12","address":"Cursan (33)","latitude":44.8,"longitude":-0.36,"description":"Alerte publiée par la mairie concernant des tentatives de cambriolage dans le secteur.","source_url":"https://www.intramuros.org/cursan/actualites/988416"},
  {"id":-203,"type":"Alerte communale","incident_date":"2026-09-24","address":"Bazougers (53)","latitude":48.02,"longitude":-0.58,"description":"Alerte communale signalant plusieurs cambriolages dans le secteur, sans localisation individuelle.","source_url":"https://www.intramuros.org/bazougers/actualites/999524"},
  {"id":-204,"type":"Cambriolage","incident_date":"2026-11-12","address":"Roanne (42)","latitude":46.04,"longitude":4.07,"description":"Cambriolage rapporté dans l’annexe d’une habitation. Repère communal.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/11/14/un-duo-de-cambrioleurs-interpelle-tous-les-objets-voles-retrouves"},
  {"id":-205,"type":"Car-jacking","incident_date":"2026-03-17","address":"Pont-Évêque (38)","latitude":45.53,"longitude":4.91,"description":"Vol de véhicule sous la menace rapporté par la presse locale. Repère communal.","source_url":"https://www.leprogres.fr/faits-divers-justice/2026/04/05/car-jacking-au-fusil-a-canon-scie-un-quatuor-interpelle"},
  {"id":-206,"type":"Incendie volontaire","incident_date":"2026-11-10","address":"Gymnase Langevin, Étupes (25)","latitude":47.50207,"longitude":6.85425,"description":"Incendie du gymnase. Origine volontaire suspectée dans le cadre de l’enquête.","source_url":"https://www.leparisien.fr/faits-divers/doubs-un-collegien-place-en-garde-a-vue-suspecte-davoir-incendie-un-gymnase-pour-eviter-une-reunion-parents-profs-12-11-2026-CW5FFUCDHZFNZDB66INQJH4X34.php"},
  {"id":-207,"type":"Rodéo urbain","incident_date":"2026-10-29","address":"Les Mureaux (78)","latitude":48.99,"longitude":1.91,"description":"Rodéo motorisé rapporté par la presse locale. Repère communal.","source_url":"https://www.infosyvelines.fr/articles/les-mureaux-rodeo-urbain-interpellation-policiers-2026"},
  {"id":-208,"type":"Trafic de stupéfiants","incident_date":"2026-11-02","address":"Gisors (27)","latitude":49.28,"longitude":1.77,"description":"Opération judiciaire annoncée par la Gendarmerie nationale. La date et la commune correspondent à l’intervention.","source_url":"https://www.gendarmerie.interieur.gouv.fr/gendinfo/criminalite-organisee-et-enquetes/2026/demantelement-d-un-trafic-de-stupefiants-par-les-gendarmes-de-la-compagnie-des-andelys-dans-l-eure"},
  {"id":-209,"type":"Vol simple","incident_date":"2026-11-11","address":"Tarbes (65)","latitude":43.23,"longitude":0.08,"description":"Vol à l’étalage rapporté par la presse locale. Repère communal.","source_url":"https://www.ladepeche.fr/2026/11/13/21-euros-de-nourriture-voles-dans-un-commerce-a-tarbes-lun-des-deux-jeunes-interpelles-avoue-lautre-accuse-son-ami-13650843.php"},
  {
    id: -101,
    type: "Alerte communale",
    incident_date: "2026-11-10",
    address: "Corcieux (88430) · Repère à l’échelle de la commune",
    latitude: 48.1722,
    longitude: 6.87846,
    description: "Vigilance : cambriolages et vols de véhicules après intrusion dans un domicile. La commune relaie un message de la brigade locale de gendarmerie signalant une recrudescence de ces faits dans plusieurs secteurs des Vosges. Le repère ne localise aucun cambriolage individuel.",
    source_url: "https://www.intramuros.org/corcieux/actualites",
  },
  {
    "id": -1,
    "type": "Incendie volontaire",
    "incident_date": "2026-03-19",
    "address": "École élémentaire Pressoir-Prompt, boulevard Kennedy, 91100 Corbeil-Essonnes",
    "latitude": 48.586128,
    "longitude": 2.476928,
    "description": "Incendie criminel rapporté dans la nuit du 18 au 19 mars.",
    "source_url": "https://www.leparisien.fr/essonne-91/corbeil-essonnes-trois-adolescents-arretes-apres-avoir-allume-un-feu-dans-une-ecole-20-03-2026-F5VJVFZE65B4PFTX5MLUMG2WME.php"
  },
  {
    "id": -2,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-01",
    "address": "Lycée Nelson-Mandela, 10 rue Pierre-Vidal-Naquet, Nantes",
    "latitude": 47.208394,
    "longitude": -1.532911,
    "description": "Incendie du hall en marge des manifestations.",
    "source_url": "https://www.tf1info.fr/justice-faits-divers/nantes-trois-personnes-interpellees-apres-l-incendie-du-lycee-nelson-mandela-en-marge-des-manifestations-2473615.html"
  },
  {
    "id": -3,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-02",
    "address": "Complexe sportif Salvador-Allende, rue du Bois-l’Évêque, 77380 Combs-la-Ville",
    "latitude": 48.65733,
    "longitude": 2.57952,
    "description": "Incendie volontaire rapporté vers 3 h 30. Aucun lien établi avec les violences au lycée voisin.",
    "source_url": "https://www.leparisien.fr/seine-et-marne-77/gymnase-incendie-volontairement-a-combs-la-ville-y-a-t-il-un-lien-avec-les-violences-au-lycee-02-10-2026-K3HRRGA3FVHJPP3SFIWQG3TPRQ.php"
  },
  {
    "id": -4,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-02",
    "address": "Collège François-Rabelais, 29 rue Saint-Bernard, 57000 Metz",
    "latitude": 49.09748,
    "longitude": 6.17161,
    "description": "Incendie signalé en soirée. Piste volontaire privilégiée par le parquet.",
    "source_url": "https://www.tf1info.fr/justice-faits-divers/metz-un-college-touche-par-un-incendie-le-preau-et-des-sanitaires-brules-2467796.html"
  },
  {
    "id": -5,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-17",
    "address": "Faculté de lettres, bâtiment B4 – Michel Serres, boulevard André-Siegfried, 76130 Mont-Saint-Aignan",
    "latitude": 49.459531,
    "longitude": 1.064317,
    "description": "Pompiers alertés peu après 2 h 30. Origine volontaire privilégiée. Le repère situe le site de la faculté.",
    "source_url": "https://www.univ-rouen.fr/actualites/communique-suite-a-lincendie-dun-batiment-sur-le-campus-de-mont-saint-aignan/"
  },
  {
    "id": -6,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-17",
    "address": "Hôtel de ville, 9 place Léon-Bétoulle, Limoges",
    "latitude": 45.82642,
    "longitude": 1.26031,
    "description": "Incendie criminel en soirée, en marge des violences du 17 octobre.",
    "source_url": "https://www.info.gouv.fr/actualite/incendie-a-limoges-point-presse-du-premier-ministre"
  },
  {
    "id": -7,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-28",
    "address": "Mairie du 6e arrondissement, 58 rue de Sèze, 69006 Lyon",
    "latitude": 45.7682981,
    "longitude": 4.8494225,
    "description": "Origine volontaire rapportée par la presse. Incendie signalé vers 17 h 30.",
    "source_url": "https://www.lyoncapitale.fr/actualite/un-feu-volontairement-allume-dans-la-mairie-du-6e-arrondissement-de-lyon"
  },
  {
    "id": -8,
    "type": "Incendie volontaire",
    "incident_date": "2026-11-05",
    "address": "Lycée Marie-Louise Dissard Françoise, 5 boulevard Alain-Savary, 31170 Tournefeuille",
    "latitude": 43.57669,
    "longitude": 1.31268,
    "description": "Incendie provoqué en début de journée, selon la préfecture, dans le contexte de la journée nationale d’action.",
    "source_url": "https://www.haute-garonne.gouv.fr/sites/default/files/2026-11/20261105_cp_manif%20bilan_0.pdf"
  },
  {
    "id": -9,
    "type": "Incendie volontaire",
    "incident_date": "2026-06-11",
    "address": "École Jean-de-la-Fontaine, plateau de la Croix-Vernailles, 91150 Étampes",
    "latitude": 48.4482,
    "longitude": 2.16942,
    "description": "Incendie volontaire rapporté dans la nuit du 10 au 11 juin. La façade a été endommagée et la mairie a déposé plainte.",
    "source_url": "https://www.leparisien.fr/essonne-91/ces-actes-sont-intolerables-a-etampes-lecole-jean-de-la-fontaine-une-nouvelle-fois-visee-par-un-incendie-12-06-2026-JUWPLV4GKBB25H2U7RKUDMM6UQ.php"
  },
  {
    "id": -10,
    "type": "Incendie volontaire",
    "incident_date": "2026-10-17",
    "address": "Pavillon d’accueil de l’Office de tourisme, place Bellecour, 69002 Lyon",
    "latitude": 45.75694,
    "longitude": 4.83278,
    "description": "Incendie volontaire confirmé par la Ville de Lyon, en début d’après-midi, en marge de la mobilisation du 17 octobre.",
    "source_url": "https://www.lyon.fr/actualite/action-municipale/violences-du-17-octobre-la-ville-mobilisee"
  },
  {
    "id": -11,
    "type": "Incendie volontaire",
    "incident_date": "2026-11-06",
    "address": "Lycée Édouard-Herriot, 6 place Edgar-Quinet, 69006 Lyon",
    "latitude": 45.7657,
    "longitude": 4.84511,
    "description": "Vers 10 h, un feu volontaire allumé devant le lycée a atteint la porte d’entrée et endommagé la façade durant la mobilisation lycéenne.",
    "source_url": "https://www.tf1info.fr/justice-faits-divers/video-une-stupeur-assez-extraordinaire-l-entree-du-lycee-edouard-herriot-en-flammes-a-lyon-le-maire-du-6-arrondissement-reagit-sur-lci-2474356.html"
  },
  {
    "id": -12,
    "type": "Incendie volontaire",
    "incident_date": "2026-11-10",
    "address": "Lycée Émile-Zola, avenue de l’Arc-de-Meyran, Aix-en-Provence",
    "latitude": 43.511291,
    "longitude": 5.460387,
    "description": "Incendie tôt le matin. Piste volontaire privilégiée selon les informations publiées, sans lien établi avec le mouvement lycéen.",
    "source_url": "https://www.leparisien.fr/faits-divers/des-individus-se-sont-introduits-et-ont-mis-le-feu-un-lycee-daix-en-provence-incendie-dans-la-nuit-la-piste-volontaire-privilegiee-10-11-2026-6T5MHPQPLJHLFE5SXLI4BFDCSA.php"
  }
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const TURNSTILE_SITE_KEY = "0x4AAAAAADOpg7umNlyQBlo-";

export default function Home() {
  const [showNotices, setShowNotices] = useState(false);
  const [openCategory, setOpenCategory] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchError, setSearchError] = useState(false);
  const [appliedSearch, setAppliedSearch] = useState({ type: "", sector: "", from: "", to: "" });
  const searchRequest = useRef(0);
  const [showForm, setShowForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);

  const [reporterEmail, setReporterEmail] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Vol simple");
  const [incidentDate, setIncidentDate] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const captchaRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberNumber, setSubscriberNumber] = useState("");
  const [subscriberStreet, setSubscriberStreet] = useState("");
  const [subscriberPostcode, setSubscriberPostcode] = useState("");
  const [subscriberCity, setSubscriberCity] = useState("");
  const [subscriberCities, setSubscriberCities] = useState<string[]>([]);
  const [cityLookupMessage, setCityLookupMessage] = useState("");
  const [subscriberRadius, setSubscriberRadius] = useState(10);
  const subscriberAddress = [subscriberNumber.trim(), subscriberStreet.trim(), subscriberPostcode, subscriberCity.trim()].filter(Boolean).join(" ");

  useEffect(() => {
    setSubscriberCities([]);
    setSubscriberCity("");
    setCityLookupMessage("");
    if (!/^\d{5}$/.test(subscriberPostcode)) return;
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(async () => {
      setCityLookupMessage("Recherche des communes…");
      try {
        const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${subscriberPostcode}&fields=nom&format=json`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error();
        if (!active) return;
        const names = [...new Set<string>(data.map((city: { nom: string }) => city.nom))].sort((a, b) => a.localeCompare(b, "fr"));
        setSubscriberCities(names);
        if (names.length === 1) setSubscriberCity(names[0]);
        setCityLookupMessage(names.length > 1 ? "Plusieurs communes : choisissez votre ville." : names.length ? "" : "Commune non trouvée : saisissez votre ville.");
      } catch {
        if (active) setCityLookupMessage("Recherche indisponible : saisissez votre ville.");
      }
    }, 300);
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [subscriberPostcode]);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");

  const [searchSector, setSearchSector] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const cutoff = oldestVisibleDate();
  const [today, setToday] = useState(parisDay);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(parisDay()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const recentFrom = new Date(today - 86_400_000).toISOString().slice(0, 10);
  const recentTo = new Date(today).toISOString().slice(0, 10);
  const visibleReports = publicReports.filter((incident) =>
    (!appliedSearch.sector || normalizeSearch(incident.address).includes(normalizeSearch(appliedSearch.sector))) &&
    (!appliedSearch.from || incident.incident_date! >= appliedSearch.from) &&
    (!appliedSearch.to || incident.incident_date! <= appliedSearch.to)
  );
  const filteredIncidents = [...incidents, ...visibleReports].filter(
    (incident) => isRecentIncident(incident, cutoff) && (!appliedSearch.type || incident.type === appliedSearch.type)
  );
  function markerAppearance(incident: Incident, availableIcons: IncidentIcons) {
    const date = incident.incident_date?.slice(0, 10);
    if (date && date >= recentFrom && date <= recentTo && !recentCrimeExcludedTypes.has(incident.type)) {
      const recentIcon = availableIcons[recentIconKey(incident.type)];
      if (recentIcon) return { icon: recentIcon, zIndexOffset: 10000 };
    }
    return { icon: availableIcons[incident.type] || availableIcons.Autre, zIndexOffset: 0 };
  }

  const categoryTypes = new Set(legendCategories.map((category) => category.type));
  const extraCategories = [...new Set([...reportTypes, ...incidents.map((incident) => incident.type)])]
    .filter((type) => type !== "Accident" && !categoryTypes.has(type))
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((type) => ({ type, label: type }));
  const categories = [...legendCategories, ...extraCategories].sort((a, b) => a.label.localeCompare(b.label, "fr"));
  // Avis consultés le 15 novembre. Une nouvelle vérification est requise après le 21.
  const mapCategory = showNotices && openCategory ? openCategory : appliedSearch.type;
  const notices = (!appliedSearch.type || appliedSearch.type === missingPersonType)
    && Date.now() < Date.parse("2026-11-22T00:00:00+01:00")
    ? researchNotices.filter((notice) => noticeMatches(notice, appliedSearch.sector, appliedSearch.from, appliedSearch.to))
    : [];
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
    const request = ++searchRequest.current;
    const response = await fetch(`${API_URL}/incidents`);
    const data = await response.json();
    if (request === searchRequest.current && Array.isArray(data)) setIncidents(data);
  }

  async function searchIncidents() {
    const request = ++searchRequest.current;
    const criteria = { type: searchType, sector: searchSector.trim(), from: dateFrom, to: dateTo };
    const params = new URLSearchParams();
    if (criteria.sector) params.set("sector", criteria.sector);
    if (criteria.from) params.set("date_from", criteria.from);
    if (criteria.to) params.set("date_to", criteria.to);

    setAppliedSearch(criteria);
    setShowNotices(true);
    setOpenCategory(criteria.type);
    setSearchError(false);
    setIncidents([]);
    const firstNotice = criteria.type === missingPersonType && Date.now() < Date.parse("2026-11-22T00:00:00+01:00")
      ? researchNotices.find((notice) => notice.center && noticeMatches(notice, criteria.sector, criteria.from, criteria.to))
      : undefined;
    const searchCutoff = oldestVisibleDate();
    const firstReport = publicReports.find((incident) =>
          isRecentIncident(incident, searchCutoff) &&
          (!criteria.type || criteria.type === incident.type) &&
          (!criteria.sector || normalizeSearch(incident.address).includes(normalizeSearch(criteria.sector))) &&
          (!criteria.from || incident.incident_date! >= criteria.from) &&
          (!criteria.to || incident.incident_date! <= criteria.to));
    if (firstNotice?.center && map) map.flyTo(firstNotice.center, 12);
    if (firstReport && !firstNotice) setSelectedPosition([firstReport.latitude, firstReport.longitude]);

    try {
      const response = await fetch(`${API_URL}/incidents?${params.toString()}`);
      if (!response.ok) throw new Error("Signalements indisponibles");
      const data: Incident[] = await response.json();
      if (!Array.isArray(data)) throw new Error("Réponse de recherche invalide");
      if (request !== searchRequest.current) return;
      setIncidents(data);
      const firstIncident = data.find((incident) => isRecentIncident(incident, searchCutoff) && (!criteria.type || incident.type === criteria.type));
      if (!firstNotice && !firstReport && firstIncident) setSelectedPosition([firstIncident.latitude, firstIncident.longitude]);
    } catch {
      if (request === searchRequest.current) setSearchError(true);
    }
  }

  async function resetSearch() {
    setSearchSector("");
    setSearchType("");
    setSearchError(false);
    setAppliedSearch({ type: "", sector: "", from: "", to: "" });
    setOpenCategory("");
    setSelectedPosition(null);
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

    const videoLink = videoUrl.trim();
    if (videoLink) {
      try {
        const url = new URL(videoLink);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        alert("Saisissez un lien vidéo commençant par https:// ou http://.");
        return;
      }
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
      incident_date: incidentDate || null,
      video_url: videoLink || null,
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

    if (!response.ok) {
      alert("Le signalement n’a pas pu être enregistré. Vérifiez les champs saisis.");
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
    setIncidentDate("");
    setVideoUrl("");
    setIncidentTime("");
    setMediaFile(null);
    setCaptchaToken("");
    setAcceptTerms(false);
    setShowForm(false);

    await loadIncidents();
  }

  async function subscribeToAlerts() {
    if (subscribing) return;
    setSubscriptionMessage("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subscriberEmail.trim()) || !subscriberStreet.trim() || !/^\d{5}$/.test(subscriberPostcode) || !subscriberCity.trim()) {
      setSubscriptionMessage("Veuillez renseigner un email valide, la rue, un code postal à 5 chiffres et la ville.");
      return;
    }
    setSubscribing(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const geocode = await fetch(
        `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(subscriberAddress.trim())}&limit=1`,
        { signal: controller.signal }
      );
      if (!geocode.ok) throw new Error("La recherche d’adresse est indisponible. Réessayez dans quelques instants.");
      const data = await geocode.json();
      const feature = data.features?.[0];
      const coordinates = feature?.geometry?.coordinates;
      if (!coordinates || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
        throw new Error("Adresse introuvable. Précisez la rue, le code postal et la commune.");
      }
      const response = await fetch(`${API_URL}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          email: subscriberEmail.trim(),
          radius_km: subscriberRadius,
          address: feature.properties?.label || subscriberAddress.trim(),
          latitude: coordinates[1],
          longitude: coordinates[0],
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.error || result?.detail) {
        const detail = result?.error || result?.detail;
        throw new Error(typeof detail === "string" ? detail : "L’inscription n’a pas pu être enregistrée. Réessayez dans quelques instants.");
      }
      if (!result) throw new Error("Réponse du serveur invalide. Impossible de confirmer l’inscription.");
      setSubscriptionMessage("Votre demande a été enregistrée. Consultez votre messagerie et vos courriers indésirables pour la confirmation.");
      setSubscriberEmail("");
      setSubscriberNumber("");
      setSubscriberStreet("");
      setSubscriberPostcode("");
      setSubscriberCity("");
    } catch (error) {
      setSubscriptionMessage(error instanceof Error && error.name === "AbortError"
        ? "Le service met trop de temps à répondre. Réessayez dans quelques instants."
        : error instanceof TypeError
          ? "Connexion au service impossible. Réessayez dans quelques instants."
          : error instanceof Error ? error.message : "L’inscription a échoué. Veuillez réessayer.");
    } finally {
      window.clearTimeout(timeout);
      setSubscribing(false);
    }
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
    <main className="min-h-screen w-full bg-black text-white flex flex-col md:h-screen md:overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
      />

      <header className="order-2 md:order-none bg-gradient-to-r from-black via-[#111] to-black border-b border-gray-800 px-4 py-4 z-[2000] relative md:shrink-0 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <div className="w-full md:w-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-blue-500">Mapping</span>
              <span className="text-white">Crime</span>
              <span className="text-red-500">France</span>
            </h1>

            <hr className="border-white my-3 w-full" />

            <p className="text-white text-base md:text-lg">
              Cartographie des crimes et délits en France
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-3 md:hidden">
              <button
                onClick={() => setShowForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg"
              >
                Déclarer un délit ou un crime
              </button>

              <button
                onClick={() => setShowAlertForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg"
              >
                Inscription pour recevoir des alertes autour de chez vous
              </button>
            </div>
          </div>

          <div className="order-last grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:items-end xl:grid-cols-[1.5fr_1fr_1fr_1.45fr_1fr_1fr_1.2fr]">
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
              <label className="block text-sm font-semibold mb-2">Date début</label>
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

            <div>
              <label htmlFor="search-type" className="mb-2 block text-sm font-semibold">Type de délit</label>
              <select id="search-type" value={searchType} onChange={(event) => setSearchType(event.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border border-gray-700 bg-[#111] px-3 text-white">
                <option value="">Tous les types</option>
                {categories.map(({ type, label }) => <option key={type} value={type}>{label}</option>)}
              </select>
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
              <label className="block text-sm font-semibold mb-2">Affichage carte</label>
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value as "street" | "satellite")}
                className="w-full h-11 px-4 rounded-lg bg-[#111] border border-gray-700 text-white"
              >
                <option value="street">Carte classique</option>
                <option value="satellite">Satellite</option>
              </select>
            </div>
          </div>

          <div className="hidden md:flex flex-wrap gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg whitespace-nowrap"
            >
              Déclarer un délit ou un crime
            </button>

            <button
              onClick={() => setShowAlertForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg whitespace-nowrap"
            >
              Inscription pour recevoir des alertes autour de chez vous
            </button>
          </div>
        </div>
      </header>

      <div className="contents md:flex md:min-h-0 md:flex-1 md:flex-row">
        <aside className="order-3 md:order-1 w-full md:w-[410px] bg-black border-t md:border-t-0 md:border-r border-gray-800 p-4 max-h-[320px] md:max-h-none overflow-y-auto z-[1000]">
          <section className="mb-4 rounded-lg border border-gray-700 p-3">
            <button type="button" aria-expanded={showNotices} aria-controls="search-notices"
              className="w-full rounded-md bg-violet-800 px-3 py-2 text-left font-bold"
              onClick={() => setShowNotices((open) => !open)}>
              Toutes catégories
            </button>
            <div id="search-notices" hidden={!showNotices} className="mt-3 space-y-3 text-sm">
              {searchError && <p role="status" className="text-amber-200">Les signalements citoyens sont momentanément indisponibles.</p>}
              {categories.filter(({ type }) => !appliedSearch.type || type === appliedSearch.type).map(({ type, label }) => {
                const categoryIncidents = filteredIncidents.filter((incident) => incident.type === type);
                const expanded = openCategory === type;
                const count = categoryIncidents.length + (type === missingPersonType ? notices.length : 0);
                return (
                  <div key={type} className="rounded-md border border-gray-800">
                    <button type="button" aria-expanded={expanded}
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-900"
                      onClick={() => setOpenCategory(expanded ? "" : type)}>
                      <span>{label}</span>
                      <span className="text-gray-400" aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                    {expanded && (
                      <div className="space-y-2 px-2 pb-2">
                        {count === 0 && (!searchError || type === missingPersonType) && <p className="px-1 text-gray-300">Aucun avis ou signalement trouvé.</p>}
                        {categoryIncidents.map((incident) => (
                          <button
                            key={incident.id}
                            onClick={() =>
                              setSelectedPosition([incident.latitude, incident.longitude])
                            }
                            className="w-full text-left bg-[#111] p-3 rounded-lg border border-gray-800 hover:border-red-500 transition"
                          >
                            <div className="flex gap-3">
                              <div className="h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center font-bold shrink-0">
                                !
                              </div>

                              <div className="flex-1">
                                <div className="text-red-400 font-bold text-lg">
                                  {incident.type}
                                </div>

                                {incident.incident_date && <div>Date : {incident.incident_date.split("-").reverse().join("/")}</div>}
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
                                    {incident.video_url && <span className="mt-2 block text-sm text-gray-300">Lien vidéo disponible sur la carte</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                        {type === missingPersonType && (
                          <div className="space-y-2">
                            <p className="text-gray-300">Consultez l’avis d’origine pour connaître l’état de la recherche.</p>
                            {notices.map((notice) => (
                              <article key={notice.slug} className="space-y-1 rounded-md bg-gray-900 p-3">
                                <NoticeDetails notice={notice} />
                                {notice.center && <button type="button" className="block text-violet-300 underline" onClick={() => {
                                  if (!map || !notice.center) return;
                                  map.getContainer().scrollIntoView({ block: "nearest" });
                                  map.flyTo(notice.center, 12);
                                }}>Voir sur la carte</button>}
                              </article>
                            ))}
                            <p className="flex flex-wrap gap-3">
                              <a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.arpd.fr/fr/recherche-disparition-accueil">Avis de l’ARPD</a>
                              <a className="underline" target="_blank" rel="noopener noreferrer" href="https://www.116000enfantsdisparus.fr/avis-de-recherche/">116 000 Enfants Disparus</a>
                            </p>

                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <section id="carte" className="order-1 md:order-2 relative h-[75svh] min-h-[320px] shrink-0 md:h-full md:min-h-0 md:flex-1">
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
              filteredIncidents.filter((incident) => !mapCategory || incident.type === mapCategory).map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.latitude, incident.longitude]}
                  {...markerAppearance(incident, icons)}
                >
                  <Popup>
                    <strong>{incident.type}</strong>
                    <br />
                    {incident.incident_date && <div>Date : {incident.incident_date.split("-").reverse().join("/")}</div>}
                    {incident.video_url && /^https?:\/\//i.test(incident.video_url) && (
                      <div><a href={incident.video_url} target="_blank" rel="noopener noreferrer">Voir la vidéo</a></div>
                    )}
                    {incident.incident_time && (
                      <>
                        Horaire : {incident.incident_time}
                        <br />
                      </>
                    )}
                    {incident.address}
                    <br />
                    {incident.description}
                    {incident.source_url && <div><a href={incident.source_url} target="_blank" rel="noopener noreferrer">Source publique</a></div>}
                    {incident.media_url && (
                      <>
                        <br />
                        Média joint disponible
                      </>
                    )}
                  </Popup>
                </Marker>
              ))}
            {icons && (!mapCategory || mapCategory === missingPersonType) && notices.map((notice) => notice.center && (
              <Marker key={notice.slug} position={notice.center} icon={icons["Disparition inquiétante"]}>
                <Popup><NoticeDetails notice={notice} /></Popup>
              </Marker>
            ))}
          </MapContainer>
          <DepartmentStatistics map={map} />

          {/* Légende desktop */}
<div className="hidden md:block absolute top-6 right-6 z-[1000] bg-black/90 border border-gray-700 rounded-xl p-3 shadow-xl w-[220px]">
  <h3 className="font-bold mb-3 text-base">Légende</h3>
  <RecentIncidentLegend />
  <div className="space-y-2 text-xs">
    {icons && (
      legendCategories.map(({ type, label }) => <LegendItem key={type} icon={icons[type]} label={label} />)
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
      <RecentIncidentLegend />
        <button onClick={() => setShowLegend(false)} className="text-2xl">
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {icons && (
          legendCategories.map(({ type, label }) => <LegendItem key={type} icon={icons[type]} label={label} />)
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

              {reportTypes.map((type) => <option key={type}>{type}</option>)}
            </select>

            <label htmlFor="incident-date" className="block mb-2">Date de l’incident</label>
            <input id="incident-date" type="date" value={incidentDate}
              onChange={(event) => setIncidentDate(event.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4" />

            <label htmlFor="incident-time" className="block mb-2">Horaire de l’incident</label>
            <input
              id="incident-time"
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

            <label htmlFor="incident-video-url" className="block mb-2">Lien vers une vidéo (facultatif)</label>
            <input id="incident-video-url" type="url" value={videoUrl}
              placeholder="https://..."
              onChange={(event) => setVideoUrl(event.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4" />

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
          <div className="bg-gray-950 border border-gray-700 rounded-xl w-full max-w-lg p-4 md:p-6 max-h-[90dvh] overflow-y-auto">
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
              de 1 à 10 km autour de votre adresse, selon votre choix.
            </p>

            <input
              type="email"
              placeholder="votre@email.fr"
              value={subscriberEmail}
              onChange={(e) => setSubscriberEmail(e.target.value)}
              className="w-full p-3 rounded bg-black border border-gray-700 mb-4"
            />

            <label className="block mb-3">Numéro de rue
              <input value={subscriberNumber} onChange={(e) => setSubscriberNumber(e.target.value)} autoComplete="address-line2" placeholder="Ex. 12 bis" className="w-full p-3 rounded bg-black border border-gray-700 mt-1" />
            </label>
            <label className="block mb-3">Rue
              <input value={subscriberStreet} onChange={(e) => setSubscriberStreet(e.target.value)} autoComplete="address-line1" placeholder="Nom de la rue" className="w-full p-3 rounded bg-black border border-gray-700 mt-1" />
            </label>
            <label className="block mb-3">Code postal
              <input value={subscriberPostcode} onChange={(e) => { setSubscriberPostcode(e.target.value.replace(/\D/g, "").slice(0, 5)); setSubscriberCity(""); setSubscriberCities([]); }} inputMode="numeric" maxLength={5} autoComplete="postal-code" placeholder="Ex. 05000" className="w-full p-3 rounded bg-black border border-gray-700 mt-1" />
            </label>
            <label className="block mb-3">Ville
              {subscriberCities.length > 1 ? (
                <select value={subscriberCity} onChange={(e) => setSubscriberCity(e.target.value)} autoComplete="address-level2" className="w-full p-3 rounded bg-black border border-gray-700 mt-1">
                  <option value="">Choisissez votre ville</option>
                  {subscriberCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              ) : (
                <input value={subscriberCity} onChange={(e) => setSubscriberCity(e.target.value)} autoComplete="address-level2" placeholder="Votre ville" className="w-full p-3 rounded bg-black border border-gray-700 mt-1" />
              )}
            </label>
            <p role="status" className="text-sm text-gray-300 mb-3">{cityLookupMessage}</p>
            <label className="block mb-4">Rayon d’alerte
              <select value={subscriberRadius} onChange={(e) => setSubscriberRadius(Number(e.target.value))} className="w-full p-3 rounded bg-black border border-gray-700 mt-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
              </select>
            </label>

            <button
              onClick={subscribeToAlerts}
              disabled={subscribing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 p-3 rounded-lg font-bold"
            >
              {subscribing ? "Inscription en cours…" : "M’inscrire aux alertes"}
            </button>
            <p role="status" aria-live="polite" className="mt-3 text-sm text-white">{subscriptionMessage}</p>
          </div>
        </div>
      )}
    </main>
  );
}

function RecentIncidentLegend() {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs">
      <svg aria-hidden="true" viewBox="0 0 76 36" className="recent-crime-marker w-12 shrink-0">
        <path
          d="M9 2h58a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H46l-8 8-8-8H9a7 7 0 0 1-7-7V9a7 7 0 0 1 7-7Z"
          fill="#45515f"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <span>Fait de moins de deux jours</span>
    </div>
  );
}

function LegendItem({ icon, label }: { icon: any; label: string }) {
  if (!icon) return null;

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <img
        src={icon.options.iconUrl}
        alt={label}
        className="h-auto w-12 shrink-0 object-contain"
      />
      <span>{label}</span>
    </div>
  );
}