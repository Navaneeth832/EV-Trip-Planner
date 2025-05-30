import type { PluginFunc } from 'dayjs';

// Augment the Window interface to include Day.js plugins if they are loaded globally
declare global {
  interface Window {
    dayjs_plugin_duration?: PluginFunc;
    dayjs_plugin_customParseFormat?: PluginFunc;
    // L?: any; // Leaflet's L object - REMOVED
    // GeoSearch?: any; // leaflet-geosearch exports - REMOVED
  }
}

export interface UserPreferences {
  avoidSlowChargers: boolean;
  preferFoodOptions: boolean;
  petFriendlySpots: boolean;
}

export interface RouteSummary {
  distance_km: number;
  duration: string; // e.g., "6 hr 40 min"
  major_waypoints: string[]; // Intermediate points
  actual_source_address?: string; // Formatted address from Geocoding
  actual_destination_address?: string; // Formatted address from Geocoding
}

export interface ChargingStopDetail {
  station: string; // Name and location
  eta: string; // e.g., "10:45 AM"
  charging_time: string; // e.g., "40 min"
  activities_nearby: string[];
}

export interface NewTripPlan {
  source: string; // Display name from selected GeocodeResult
  destination: string; // Display name from selected GeocodeResult
  route_summary: RouteSummary;
  charging_required: boolean;
  charging_stops: ChargingStopDetail[];
  timeline: string[];
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodeResult extends Coordinates {
  displayName: string;
  // Add original Nominatim data if needed for more details, e.g., address components
  osm_id?: number; 
  osm_type?: string;
}


export interface OsmRouteDetails {
  distanceKm: number;
  durationSeconds: number;
  actualSourceAddress: string; // Display name from geocoding source
  actualDestinationAddress: string; // Display name from geocoding destination
  waypoints: string[]; // Simplified waypoints from OSRM steps
}

export interface NominatimResponseItem {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: { [key: string]: string }; 
}

export interface OsrmRoute {
  distance: number; 
  duration: number; 
  legs: {
    steps: {
      name: string; 
      maneuver: {
        location: [number, number]; 
      };
    }[];
  }[];
}

export interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
  waypoints: {
    hint: string;
    distance: number;
    name: string;
    location: [number, number]; 
  }[];
}
