import type { OsmRouteDetails, GeocodeResult, NominatimResponseItem, OsrmResponse, Coordinates } from '../types';

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const OSRM_BASE_URL = "https://router.project-osrm.org"; // Public OSRM demo server

export class OpenRouteService {
  private static instance: OpenRouteService;

  private constructor() {}

  public static getInstance(): OpenRouteService {
    if (!OpenRouteService.instance) {
      OpenRouteService.instance = new OpenRouteService();
    }
    return OpenRouteService.instance;
  }

  public async searchLocations(query: string, limit: number = 5): Promise<GeocodeResult[]> {
    if (!query.trim()) {
      return [];
    }
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`;
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }
      const data = await response.json() as NominatimResponseItem[];
      if (data && data.length > 0) {
        return data.map(item => ({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name,
          osm_id: item.osm_id,
          osm_type: item.osm_type,
        }));
      }
      return []; // Return empty array if no results, not an error for autocomplete
    } catch (error) {
      console.error("Location search error:", error);
      // For autocomplete, it might be better to return [] on error than to throw,
      // unless it's a critical issue like network down.
      // For now, re-throwing to see if App.tsx wants to handle it.
      // Or, could return Promise.reject(error)
      throw error; 
    }
  }
  
  public async reverseGeocode(coords: Coordinates): Promise<GeocodeResult> {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&addressdetails=1`;
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Nominatim Reverse API error: ${response.statusText}`);
      }
      const data = await response.json() as NominatimResponseItem;
      if (data && data.display_name) {
        return {
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
          displayName: data.display_name,
          osm_id: data.osm_id,
          osm_type: data.osm_type,
        };
      }
      throw new Error(`Could not determine address for coordinates: ${coords.lat}, ${coords.lon}`);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error; 
    }
  }


  public async getRoute(
    sourceCoords: Coordinates,
    destCoords: Coordinates
  ): Promise<Omit<OsmRouteDetails, 'actualSourceAddress' | 'actualDestinationAddress'>> {
    const coordinates = `${sourceCoords.lon},${sourceCoords.lat};${destCoords.lon},${destCoords.lat}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?steps=true&alternatives=false&overview=false`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`OSRM API error: ${errorData.message || response.statusText}`);
      }
      const data = await response.json() as OsrmResponse;

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        const waypoints: string[] = [];
        if (route.legs && route.legs.length > 0) {
            route.legs.forEach(leg => {
                leg.steps.forEach(step => {
                    if (step.name && step.name.length > 0) {
                        const potentialWaypoint = step.name.split(' (')[0]; 
                        if (potentialWaypoint.length > 3 && !waypoints.includes(potentialWaypoint) && isNaN(Number(potentialWaypoint.charAt(0)))) { 
                           if (waypoints.length < 10 && !/^(turn|continue|merge|exit|keep|use the)/i.test(potentialWaypoint)) { 
                             waypoints.push(potentialWaypoint);
                           }
                        }
                    }
                });
            });
        }
        const distinctWaypoints = Array.from(new Set(waypoints)).slice(0, 5);

        return {
          distanceKm: parseFloat((route.distance / 1000).toFixed(1)), 
          durationSeconds: Math.round(route.duration), 
          waypoints: distinctWaypoints,
        };
      }
      throw new Error(`OSRM could not find a route. Code: ${data.code}`);
    } catch (error) {
      console.error("OSRM Routing error:", error);
      throw error; 
    }
  }
}