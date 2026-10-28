/**
 * Preset route itineraries with realistic waypoints and known traffic patterns.
 */

import { LocationPoint } from './optimizer';

export interface RoutePreset {
  id: string;
  name: string;
  region: string;
  description: string;
  typicalTraffic: 'fluide' | 'modere' | 'dense' | 'bouchon';
  waypoints: LocationPoint[];
}

export const PRESET_ROUTES: RoutePreset[] = [
  {
    id: 'paris-livraison-idf',
    name: 'Tournée Logistique Île-de-France (Bouchons A86/Périph)',
    region: 'Île-de-France',
    description: '4 arrêts désordonnés à travers Paris, Créteil, Saint-Denis et Boulogne.',
    typicalTraffic: 'dense',
    waypoints: [
      {
        id: 'p1',
        name: 'Hub Logistique Rungis (Départ)',
        address: 'Rungis Marché International, 94150',
        lat: 48.7538,
        lng: 2.3524,
        isOrigin: true,
      },
      {
        id: 'p2',
        name: 'Client A - Saint-Denis',
        address: 'Stade de France, Saint-Denis',
        lat: 48.9244,
        lng: 2.3601,
      },
      {
        id: 'p3',
        name: 'Client B - Boulogne-Billancourt',
        address: 'Boulogne-Billancourt Centre',
        lat: 48.8396,
        lng: 2.2399,
      },
      {
        id: 'p4',
        name: 'Client C - Créteil Pompadour',
        address: 'Carrefour Pompadour, Créteil',
        lat: 48.7733,
        lng: 2.4542,
      },
      {
        id: 'p5',
        name: 'Entrepôt Nanterre (Arrivée)',
        address: 'Nanterre Préfecture',
        lat: 48.8989,
        lng: 2.2137,
        isDestination: true,
      },
    ],
  },
  {
    id: 'lyon-vallee-rhone',
    name: 'Couloir Rhodanien : Lyon - Saint-Étienne - Valence',
    region: 'Auvergne-Rhône-Alpes',
    description: 'Trajet autoroutier A7 et étapes de livraison avec goulet de Fourvière.',
    typicalTraffic: 'modere',
    waypoints: [
      {
        id: 'ly1',
        name: 'Lyon Part-Dieu (Départ)',
        address: 'Gare Part-Dieu, 69003 Lyon',
        lat: 45.7606,
        lng: 4.8596,
        isOrigin: true,
      },
      {
        id: 'ly2',
        name: 'Étape 1 : Vienne',
        address: 'Centre-ville Vienne, 38200',
        lat: 45.5255,
        lng: 4.8744,
      },
      {
        id: 'ly3',
        name: 'Étape 2 : Saint-Étienne',
        address: 'Place Jean Jaurès, Saint-Étienne',
        lat: 45.4396,
        lng: 4.3872,
      },
      {
        id: 'ly4',
        name: 'Valence Sud (Destination)',
        address: 'Plateforme Valence Sud, 26000',
        lat: 44.9124,
        lng: 4.8924,
        isDestination: true,
      },
    ],
  },
  {
    id: 'cote-azur-cannes-monaco',
    name: 'Côte d’Azur : Nice - Antibes - Cannes - Monaco',
    region: 'PACA',
    description: 'Littoral méditerranéen soumis aux forts ralentissements estivaux et urbains.',
    typicalTraffic: 'dense',
    waypoints: [
      {
        id: 'ca1',
        name: 'Aéroport Nice Côte d’Azur',
        address: 'Nice Airport',
        lat: 43.6653,
        lng: 7.215,
        isOrigin: true,
      },
      {
        id: 'ca2',
        name: 'Cannes Croisette',
        address: 'Palais des Festivals, Cannes',
        lat: 43.5518,
        lng: 7.0173,
      },
      {
        id: 'ca3',
        name: 'Antibes Juan-les-Pins',
        address: 'Port Vauban, Antibes',
        lat: 43.5855,
        lng: 7.1264,
      },
      {
        id: 'ca4',
        name: 'Monaco Port Hercule',
        address: 'Port Hercule, Monaco',
        lat: 43.7369,
        lng: 7.4244,
        isDestination: true,
      },
    ],
  },
];
