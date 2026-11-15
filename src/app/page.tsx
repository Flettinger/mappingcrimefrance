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
  { city: "Montauban (82)", date: "26 juin 2026", center: [44.02, 1.36], slug: "merlin-collot-20-ans-disparu-depuis-le-26-juin-2026-montauban-82" },
  { city: "Caen (14)", date: "20 janvier 2026", center: [49.18, -0.37], slug: "maxime-bruno-30-ans-disparu-le-20-janvier-2026-caen-14" },
  { city: "Pau (64)", date: "06 novembre 2026", center: [43.3, -0.37], slug: "tiya-kouassi-daron-16-ans-disparue-pau-64-le-06-novembre-2026" },
  { city: "Paris, Porte Maillot (75)", date: "15 octobre 2026", center: [48.88, 2.28], slug: "octave-31-ans-disparu-paris-porte-maillot-75-le-15-octobre-2026" },
  { city: "Secteur de Segré-en-Anjou Bleu (49)", date: "10 novembre 2026", center: [47.69, -0.87], slug: "yannick-robert-55-ans-disparu-le-10-novembre-secteur-segre-en-anjou-bleu-49" },
  { city: "Paris 15e (75)", date: "11 octobre 2026", center: [48.84, 2.3], slug: "pierre-tomeselli-35-ans-disparu-le-11-octobre-2026-apres-avoir-quitte-paris-15eme" },
  { city: "Lieu non précisé dans l’annuaire", date: "02 octobre 2026", slug: "nena-stevic-37-ans-disparue-depuis-le-02-octobre-2026" },
  { city: "Roquebrune-sur-Argens (83)", date: "20 octobre 2026", center: [43.44, 6.64], slug: "michael-amsallem-disparu-roquebrune-sur-argens-83-le-20-octobre-2026" },
  { city: "Genève (Suisse)", date: "21 juin 2026", slug: "jean-philippe-s-disparu-geneve-suisse-le-21-juin-2026" },
  { city: "Fouesnant (29)", date: "14 juin 2026", center: [47.89, -4.01], slug: "yvonne-jestin-76-ans-disparu-le-14-juin-2026-fouesnant-29" },
  { city: "Oberhoffen-sur-Moder (67)", date: "04 octobre 2026", center: [48.78, 7.86], slug: "leo-raeppel-14-ans-disparu-oberhoffen-sur-moder-67-le-04-octobre-2026" },
  { city: "Strasbourg, Koenigshoffen (67)", date: "20 juillet 2026", center: [48.58, 7.7], slug: "amar-megat-51-ans-disparu-strasbourg-koenigshoffen-67-le-20-juillet-2026" },
  { city: "Marne (51)", date: "12 septembre 2026", slug: "frederic-ricci-50-ans-disparu-depuis-le-12-septembre-2026-dans-la-marne-51" },
  { city: "Saint-Nazaire (44)", date: "28 août 2026", center: [47.27, -2.21], slug: "tahis-16-ans-disparu-le-28-aout-2026-saint-nazaire-44" },
  { city: "Poitiers (84)", date: "30 avril 2026", center: [46.58, 0.34], slug: "dylan-16-ans-en-fugue-depuis-le-30-avril-2026-poitiers-84" },
  { city: "Plougasnou (29)", date: "23 juin 2026", center: [48.7, -3.79], slug: "guy-fouquet-71-ans-disparu-plougasnou-29-le-23-juin-2026" },
  { city: "Caen (14)", date: "mars 2026", center: [49.18, -0.37], slug: "florian-aubry-39-ans-disparu-mars-2026-caen-14" },
  { city: "Clamart (92)", date: "8 juillet 2026", center: [48.8, 2.26], slug: "ilian-ben-hammou-19-ans-disparu-le-8-juillet-2026-clamart-92" },
  { city: "Herblay-sur-Seine (95)", date: "15 septembre 2026", center: [49, 2.16], slug: "marie-chognard-epouse-ferret-85-ans-disparue-herblay-95-le-15-septembre-2026" },
  { city: "Londres (Royaume-Uni)", date: "25 mai 2026", slug: "marlon-marcus-morgan-46-ans-disparu-le-25-mai-2026-londres-royaume-uni" },
  { city: "Le Mené (22)", date: "11 septembre 2026", center: [48.3, -2.52], slug: "yves-clement-63-ans-disparu-le-11-septembre-2026-le-mene-22" },
  { city: "Étréaupont (02)", date: "09 septembre 2026", center: [49.91, 3.92], slug: "sullivan-couvreur-46-ans-disparu-etreaupont-02-le-09-septembre-2026" },
  { city: "Paris 20e (75)", date: "08 juin 2026", center: [48.86, 2.4], slug: "claudia-cutillo-59-ans-disparu-le-08-juin-2026-paris-20eme" },
  { city: "Sète (34)", date: "25 juillet 2026", center: [43.4, 3.7], slug: "georges-schmid-86-ans-disparu-sete-34-le-25-juillet-2026" },
  { city: "Nouméa (Nouvelle-Calédonie)", date: "31 août 2026", center: [-22.27, 166.46], slug: "mailys-perriolat-16-ans-disparue-noumea-le-31-aout-2026" },
  { city: "Tonneins (47)", date: "04 septembre 2026", center: [44.39, 0.31], slug: "daniel-pourtier-disparu-tonneins-47-le-04-septembre-2026" },
  { city: "Saint-Joseph (La Réunion)", date: "18 avril 2026", center: [-21.38, 55.62], slug: "denis-duhamel-59-ans-disparu-saint-joseph-depuis-le-18-avril-2026" },
  { city: "Aurillac (15)", date: "26 juin 2026", center: [44.93, 2.44], slug: "jalwa-safi-19-ans-disparue-depuis-le-26-juin-2026-aurillac-15" },
  { city: "Bruville (54)", date: "22 août 2026", center: [49.14, 5.88], slug: "chloe-ledu-17-ans-disparu-le-22-aout-2026-bruville-54" },
  { city: "Secteur de Vénosc / La Bérarde (38)", date: "25 août 2026", center: [44.99, 6.12], slug: "claire-tardy-45-ans-disparue-secteur-venosc-la-berarde-38-le-25-aout-2026" },
  { city: "Flers-en-Escrebieux (59)", date: "24 août 2026", center: [50.4, 3.06], slug: "bruno-daubricourt-58-ans-disparu-flers-en-escrebieux-59-le-24-aout-2026" },
  { city: "Melun (77)", date: "20 juin 2026", center: [48.54, 2.66], slug: "bernard-bidart-77-ans-disparu-depuis-le-20-juin-2026-melun-77" },
  { city: "Grimaud (83)", date: "07 août 2026", center: [43.27, 6.52], slug: "siarguei-siarmiajka-41-ans-disparu-grimaud-83-le-07-aout-2026" },
  { city: "Issoire (63)", date: "06 mai 2026", center: [45.54, 3.25], slug: "sylvie-bergougnoux-56-ans-disparue-issoire-63-le-06-mai-2026" },
  { city: "Almaty (Kazakhstan)", date: "28 avril 2026", slug: "maximilien-alihan-garreau-disparu-almaty-kazakhstan-le-28-avril-2026" },
  { city: "Orthez (64)", date: "12 août 2026", center: [43.49, -0.77], slug: "jean-lahitte-disparu-orthez-64-le-12-aout-2026" },
  { city: "Strasbourg (67)", date: "09 août 2026", center: [48.58, 7.75], slug: "karim-ouelaa-52-ans-disparu-strasbourg-67-le-09-aout-2026" },
  { city: "Capesterre-Belle-Eau (Guadeloupe)", date: "21 juin 2026", center: [16.04, -61.57], slug: "rozanne-bruny-epouse-gauthier-67-ans-disparue-capesterre-belle-eau-le-21-juin-2026" },
  { city: "Saint-Denis (La Réunion)", date: "19 juillet 2026", center: [-20.88, 55.45], slug: "dominique-lizy-59-ans-disparu-saint-denis-la-reunion-le-19-juillet-2026" },
  { city: "Chimay (Belgique)", date: "19 juillet 2026", slug: "michel-marion-86-ans-disparu-chimay-le-19-juillet-2026" },
  { city: "Argelès-sur-Mer (66)", date: "14 juin 2026", center: [42.55, 3.02], slug: "anne-marie-morin-85-ans-disparue-argeles-sur-mer-66-le-14-juin-2026" },
  { city: "Strasbourg (67)", date: "05 août 2026", center: [48.58, 7.75], slug: "miloiud-khalid-72-ans-disparu-strasbourg-67-le-05-aout-2026" },
  { city: "Baixas (66)", date: "05 juillet 2026", center: [42.75, 2.81], slug: "aurore-nicolau-56-ans-disparue-baixas-66-le-05-juillet-2026" },
  { city: "Les Abymes (Guadeloupe)", date: "20 juillet 2026", center: [16.27, -61.5], slug: "didier-jactar-58-ans-disparu-aux-abymes-le-20-juillet-2026" },
  { city: "Roanne (42)", date: "17 juin 2026", center: [46.04, 4.07], slug: "gwen-girard-44-ans-disparu-roanne-42-le-17-juin-2026" },
  { city: "Saint-Étienne (42)", date: "30 juin 2026", center: [45.44, 4.39], slug: "yihe-jin-40-ans-disparu-saint-etienne-42-le-30-juin-2026" },
  { city: "Fécamp (76)", date: "17 juillet 2026", center: [49.76, 0.38], slug: "david-surble-52-ans-disparu-le-17-juillet-2026-fecamp-76" },
  { city: "Frouzins (31)", date: "11 juillet 2026", center: [43.52, 1.33], slug: "dominique-barthe-disparue-frouzins-31-le-11-juillet-2026" },
  { city: "L’Arbresle (69)", date: "01 juillet 2026", center: [45.83, 4.62], slug: "fode-kote-23-ans-disparu-l-arbresle-69-le-01-juillet-2026" },
  { city: "Bégard (22)", date: "8 juillet 2026", center: [48.63, -3.3], slug: "veronique-briand-rouzic-57-ans-disparue-le-8-juillet-2026-begard-22" },
  { city: "Plabennec (29)", date: "25 juin 2026", center: [48.5, -4.43], slug: "alan-creignou-54-ans-disparu-le-25-juin-2026-plabennec-29" },
  { city: "Saint-Pierre (La Réunion)", date: "7 juillet 2026", center: [-21.34, 55.48], slug: "jean-antoine-severin-62-ans-disparu-le-7-juillet-2026-saint-pierre-ile-de-la-reunion" },
  { city: "Thieu (Belgique)", date: "6 juillet 2026", slug: "michel-gaspard-61-ans-disparu-le-6-juillet-2026-thieu-belgique" },
  { city: "La Guérinière (85)", date: "15 juin 2026", center: [46.97, -2.23], slug: "agathe-pin-nee-stephann-61-ans-disparu-le-15-juin-2026-la-gueriniere-85" },
  { city: "Saint-Denis (93)", date: "20 mai 2026", center: [48.94, 2.36], slug: "roxane-andrieux-31-ans-disparue-saint-denis-93-le-20-mai-2026" },
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
  const [subscriberAddress, setSubscriberAddress] = useState("");

  const [searchSector, setSearchSector] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const visibleReports = publicReports.filter((incident) =>
    (!appliedSearch.sector || normalizeSearch(incident.address).includes(normalizeSearch(appliedSearch.sector))) &&
    (!appliedSearch.from || incident.incident_date! >= appliedSearch.from) &&
    (!appliedSearch.to || incident.incident_date! <= appliedSearch.to)
  );
  const filteredIncidents = [...incidents, ...visibleReports].filter(
    (incident) => !appliedSearch.type || incident.type === appliedSearch.type
  );
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
    const firstReport = publicReports.find((incident) =>
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
      const firstIncident = data.find((incident) => !criteria.type || incident.type === criteria.type);
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
    <main className="min-h-screen w-full bg-black text-white md:flex md:h-screen md:flex-col md:overflow-hidden">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setTurnstileLoaded(true)}
      />

      <header className="bg-gradient-to-r from-black via-[#111] to-black border-b border-gray-800 px-4 py-4 z-[2000] relative md:shrink-0 md:px-6">
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

      <div className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
        <aside className="order-2 md:order-1 w-full md:w-[410px] bg-black border-t md:border-t-0 md:border-r border-gray-800 p-4 max-h-[320px] md:max-h-none overflow-y-auto z-[1000]">
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
              filteredIncidents.filter((incident) => !mapCategory || incident.type === mapCategory).map((incident) => (
                <Marker
                  key={incident.id}
                  position={[incident.latitude, incident.longitude]}
                  icon={icons[incident.type] || icons["Autre"]}
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
        className="h-auto w-12 shrink-0 object-contain"
      />
      <span>{label}</span>
    </div>
  );
}