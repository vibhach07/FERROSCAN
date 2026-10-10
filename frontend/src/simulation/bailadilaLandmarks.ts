import { LatLng } from '../types/mission';

export interface BailadilaLandmark {
  id: string;
  name: string;
  category: 'mine_pit' | 'processing_plant' | 'peak' | 'town';
  center: LatLng;
  elevationM: number;
  description: string;
  nmdcDetails: string;
  pitBoundary?: LatLng[];
}

export const BAILADILA_LANDMARKS: BailadilaLandmark[] = [
  {
    id: 'deposit-14-pit',
    name: 'NMDC Deposit 14 Open-Cast Mine Pit',
    category: 'mine_pit',
    center: { lat: 18.6080, lng: 81.2275 },
    elevationM: 1050,
    description: 'Active open-cast iron ore quarry with terraced benches cut into the Bailadila western ridge.',
    nmdcDetails: 'India’s first mechanized iron ore mine (commissioned 1968 by NMDC). Produces lump and fine hematite ore (+66% Fe grade).',
    pitBoundary: [
      { lat: 18.6115, lng: 81.2245 },
      { lat: 18.6110, lng: 81.2305 },
      { lat: 18.6050, lng: 81.2315 },
      { lat: 18.6042, lng: 81.2275 },
      { lat: 18.6055, lng: 81.2238 },
    ],
  },
  {
    id: 'deposit-11c-pit',
    name: 'NMDC Deposit 11 / 11C Iron Mine',
    category: 'mine_pit',
    center: { lat: 18.6250, lng: 81.2310 },
    elevationM: 1180,
    description: 'Ridge-top open pit benches located ~2 km north of Deposit 14 along the strike.',
    nmdcDetails: 'High-grade hematite operations with dedicated downhill conveyor haulage systems to Kirandul processing plant.',
    pitBoundary: [
      { lat: 18.6285, lng: 81.2285 },
      { lat: 18.6280, lng: 81.2335 },
      { lat: 18.6220, lng: 81.2340 },
      { lat: 18.6215, lng: 81.2290 },
    ],
  },
  {
    id: 'deposit-5-pit',
    name: 'NMDC Deposit 5 Open Pit (Bacheli Complex)',
    category: 'mine_pit',
    center: { lat: 18.7000, lng: 81.2190 },
    elevationM: 1240,
    description: 'Massive open-cast iron ore mine on the northern Bailadila ridge crest (1200m+ MSL).',
    nmdcDetails: 'One of the highest grade iron ore deposits in the world (up to 67-68% Fe). Ore is transported downhill to Bacheli plant via long belt conveyors.',
    pitBoundary: [
      { lat: 18.7045, lng: 81.2155 },
      { lat: 18.7050, lng: 81.2225 },
      { lat: 18.6955, lng: 81.2230 },
      { lat: 18.6950, lng: 81.2160 },
    ],
  },
  {
    id: 'kirandul-plant',
    name: 'Kirandul NMDC Ore Processing & Railway Siding',
    category: 'processing_plant',
    center: { lat: 18.6260, lng: 81.2720 },
    elevationM: 575,
    description: 'Primary crushing, wet/dry screening, secondary beneficiation, and train loading yard.',
    nmdcDetails: 'Starting terminal of the historic Kottavalasa–Kirandul (KK) railway line operated by Indian Railways to transport ore to Visakhapatnam port.',
  },
  {
    id: 'bacheli-plant',
    name: 'Bacheli NMDC Screening & Loading Complex',
    category: 'processing_plant',
    center: { lat: 18.7200, lng: 81.2580 },
    elevationM: 590,
    description: 'Central receiving station, ore stockyard, and rapid train loading terminal for Deposit 5.',
    nmdcDetails: 'Receives crushed ore via downhill single-flight conveyor from 1200m ridge elevation.',
  },
  {
    id: 'aakash-nagar',
    name: 'Aakash Nagar / Bailadila High Ridge (1,276m MSL)',
    category: 'peak',
    center: { lat: 18.6500, lng: 81.2350 },
    elevationM: 1276,
    description: 'Highest peak of the Bailadila Iron Ore Range with panoramic views over the mining complexes.',
    nmdcDetails: 'Key geodetic survey reference station for the Dharwar Craton banded iron formation (BIF).',
  },
];
