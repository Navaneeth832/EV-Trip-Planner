
import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { InputForm } from './components/InputForm';
import { TripDisplay } from './components/TripDisplay';
import { DarkModeToggle } from './components/DarkModeToggle';
// import { MapSelector } from './components/MapSelector'; // REMOVED
import { GeminiService } from './services/GeminiService';
import { OpenRouteService } from './services/OpenRouteService';
import type { NewTripPlan, ChargingStopDetail, UserPreferences, RouteSummary, OsmRouteDetails, GeocodeResult } from './types';
import { MOCK_KM_PER_KWH, MOCK_CHARGING_RATE_KW, MIN_BATTERY_PERCENT_AT_DESTINATION, TARGET_BATTERY_PERCENT_AT_CHARGER_ARRIVAL, DEFAULT_CHARGE_UP_TO_PERCENT, AVG_SPEED_KMH } from './constants';
import { LoadingIcon, AlertIcon } from './components/Icons';

const formatDuration = (duration: ReturnType<typeof dayjs.duration>): string => {
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (parts.length === 0 && duration.asMilliseconds() > 0) return `${Math.ceil(duration.asSeconds()/60)} min`;
  if (parts.length === 0) return "0 min";
  return parts.join(' ');
};

const getDisplayWaypoints = (osmWaypoints: string[], sourceDisplayName: string, destDisplayName: string, distance: number): string[] => {
    if (osmWaypoints && osmWaypoints.length > 0) {
        return osmWaypoints;
    }
    const waypoints: string[] = [];
    if (distance > 50 && distance <= 150) {
         waypoints.push(`Towards ${destDisplayName.split(',')[0]}`);
    } else if (distance > 150) {
        waypoints.push(`General direction of ${destDisplayName.split(',')[0]}`);
    }
    return waypoints;
};


const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [tripPlanResult, setTripPlanResult] = useState<NewTripPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [geminiApiKeyError, setGeminiApiKeyError] = useState<string | null>(null);

  // State for location inputs and selected locations
  const [sourceInputText, setSourceInputText] = useState<string>('');
  const [destinationInputText, setDestinationInputText] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<GeocodeResult | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<GeocodeResult | null>(null);

  const geminiService = GeminiService.getInstance();
  const openRouteService = OpenRouteService.getInstance();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    }
  }, [darkMode]);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setGeminiApiKeyError("Gemini API Key is missing (process.env.API_KEY). Activity suggestions will be disabled.");
      console.warn("Gemini API Key (process.env.API_KEY) is not set.");
    }
  }, []);

  const handleSourceInputChange = (value: string) => {
    setSourceInputText(value);
    if (selectedSource && value !== selectedSource.displayName) {
      setSelectedSource(null); // Clear selection if text changes manually
    }
     setTripPlanResult(null); setError(null);
  };

  const handleDestinationInputChange = (value: string) => {
    setDestinationInputText(value);
    if (selectedDestination && value !== selectedDestination.displayName) {
      setSelectedDestination(null); // Clear selection if text changes manually
    }
    setTripPlanResult(null); setError(null);
  };

  const handleSourceLocationSelect = (location: GeocodeResult) => {
    setSelectedSource(location);
    setSourceInputText(location.displayName); // Update input text to match selection
    setError(null); setTripPlanResult(null);
  };

  const handleDestinationLocationSelect = (location: GeocodeResult) => {
    setSelectedDestination(location);
    setDestinationInputText(location.displayName); // Update input text to match selection
    setError(null); setTripPlanResult(null);
  };
  
  const handleClearSourceSelection = () => {
    setSelectedSource(null);
  }
  const handleClearDestinationSelection = () => {
    setSelectedDestination(null);
  }

  const handlePlanTrip = useCallback(async (
    batteryPercent: number,
    totalEvRangeKm: number,
    departureTime: string, 
    preferences: UserPreferences
  ) => {
    setIsLoading(true);
    setError(null);
    setTripPlanResult(null);

    if (!process.env.API_KEY && !geminiApiKeyError) {
        setGeminiApiKeyError("Gemini API Key is missing. Activity suggestions will be disabled.");
    }

    if (!selectedSource) {
      setError("Please select a valid source location from the suggestions.");
      setIsLoading(false);
      return;
    }
    if (!selectedDestination) {
      setError("Please select a valid destination location from the suggestions.");
      setIsLoading(false);
      return;
    }
    
    const finalSourceCoords = { lat: selectedSource.lat, lon: selectedSource.lon };
    const finalDestinationCoords = { lat: selectedDestination.lat, lon: selectedDestination.lon };
    const finalSourceDisplayName = selectedSource.displayName;
    const finalDestinationDisplayName = selectedDestination.displayName;

    try {
      let routeDetailsFromOsm: Omit<OsmRouteDetails, 'actualSourceAddress' | 'actualDestinationAddress'>;
      try {
        routeDetailsFromOsm = await openRouteService.getRoute(finalSourceCoords, finalDestinationCoords);
      } catch (routeError: any) {
        setError(`Failed to get route from ${finalSourceDisplayName} to ${finalDestinationDisplayName}: ${routeError.message}. The locations might be unreachable by road or too far apart.`);
        setIsLoading(false);
        return;
      }
      
      const { distanceKm: totalDistanceKm, durationSeconds: totalDurationSeconds, waypoints: osmWaypoints } = routeDetailsFromOsm;
      
      const routeSummary: RouteSummary = {
        distance_km: totalDistanceKm,
        duration: formatDuration(dayjs.duration(totalDurationSeconds, 'seconds')),
        major_waypoints: getDisplayWaypoints(osmWaypoints, finalSourceDisplayName, finalDestinationDisplayName, totalDistanceKm),
        actual_source_address: finalSourceDisplayName,
        actual_destination_address: finalDestinationDisplayName,
      };

      const timeline: string[] = [];
      const chargingStopsList: ChargingStopDetail[] = [];
      let chargingLogicRequiredThisTrip = false;

      const totalCapacityKm = totalEvRangeKm;
      let currentBatteryKm = totalCapacityKm * (batteryPercent / 100);
      const departureDateTime = dayjs(departureTime, "HH:mm");
      let currentTime = departureDateTime.clone();
      
      timeline.push(`${currentTime.format('h:mm A')} - Depart from ${routeSummary.actual_source_address}`);
      
      let distanceTravelled = 0;
      const MIN_BATTERY_KM_AT_DEST = totalCapacityKm * (MIN_BATTERY_PERCENT_AT_DESTINATION / 100);

      while (distanceTravelled < totalDistanceKm) {
        const remainingDistanceToDestination = totalDistanceKm - distanceTravelled;
        const currentAvgSpeed = totalDistanceKm > 0 && totalDurationSeconds > 0 ? (totalDistanceKm / (totalDurationSeconds / 3600)) : AVG_SPEED_KMH;

        const effectiveRangeToDestinationWithBuffer = currentBatteryKm - MIN_BATTERY_KM_AT_DEST;

        if (effectiveRangeToDestinationWithBuffer >= remainingDistanceToDestination) {
          const drivingTimeToDestination = remainingDistanceToDestination / currentAvgSpeed; 
          currentTime = currentTime.add(dayjs.duration(drivingTimeToDestination, 'hours'));
          currentBatteryKm -= remainingDistanceToDestination;
          distanceTravelled += remainingDistanceToDestination;
          
          timeline.push(`${currentTime.format('h:mm A')} - Arrive at ${routeSummary.actual_destination_address}`);
          break; 
        } else {
          chargingLogicRequiredThisTrip = true;
          const TARGET_BATTERY_KM_AT_CHARGER = totalCapacityKm * (TARGET_BATTERY_PERCENT_AT_CHARGER_ARRIVAL / 100);
          let driveDistanceToCharger = currentBatteryKm - TARGET_BATTERY_KM_AT_CHARGER;

          if (driveDistanceToCharger <= 0) { 
            driveDistanceToCharger = Math.min(currentBatteryKm * 0.9, remainingDistanceToDestination * 0.5, 70);
            driveDistanceToCharger = Math.max(10, driveDistanceToCharger); 

            if (currentBatteryKm < driveDistanceToCharger + (totalCapacityKm * 0.05)) { 
              setError(`Battery critically low (${(currentBatteryKm/totalCapacityKm*100).toFixed(0)}%). Cannot safely reach the next closest charging station from current location. Please charge your EV before attempting this leg.`);
              setIsLoading(false);
              return;
            }
          } else {
             driveDistanceToCharger = Math.min(driveDistanceToCharger, remainingDistanceToDestination * 0.9, 300); 
          }
          driveDistanceToCharger = Math.max(10, driveDistanceToCharger); 

          if (distanceTravelled + driveDistanceToCharger >= totalDistanceKm) {
             driveDistanceToCharger = remainingDistanceToDestination * 0.95; 
             if (driveDistanceToCharger < 10 && remainingDistanceToDestination > 0) driveDistanceToCharger = remainingDistanceToDestination; 
          }
          
          if (currentBatteryKm < driveDistanceToCharger) {
              setError("Insufficient battery to reach the next calculated charging station. Trip may not be feasible as planned.");
              setIsLoading(false);
              return;
          }

          const drivingTimeToCharger = driveDistanceToCharger / currentAvgSpeed; 
          currentTime = currentTime.add(dayjs.duration(drivingTimeToCharger, 'hours'));
          currentBatteryKm -= driveDistanceToCharger;
          distanceTravelled += driveDistanceToCharger;

          if (distanceTravelled >= totalDistanceKm) { 
             timeline.push(`${currentTime.format('h:mm A')} - Arrive at ${routeSummary.actual_destination_address}`);
             break;
          }

          const chargerName = `SimuCharge Station #${chargingStopsList.length + 1} (near ${routeSummary.major_waypoints.length > chargingStopsList.length && routeSummary.major_waypoints[chargingStopsList.length] ? routeSummary.major_waypoints[chargingStopsList.length] : routeSummary.actual_destination_address?.split(',')[0] || 'next stop'})`;
          const etaAtCharger = currentTime.format('h:mm A');
          
          timeline.push(`${etaAtCharger} - Stop at ${chargerName} (Charge & Explore)`);
          
          let chargeUpToKm = totalCapacityKm * (DEFAULT_CHARGE_UP_TO_PERCENT / 100);
          const kmNeededForNextLegOrDest = (totalDistanceKm - distanceTravelled) + MIN_BATTERY_KM_AT_DEST;
          
          if (chargeUpToKm < kmNeededForNextLegOrDest) {
            chargeUpToKm = Math.min(totalCapacityKm, kmNeededForNextLegOrDest + (totalCapacityKm * 0.05)); 
          }
          chargeUpToKm = Math.max(chargeUpToKm, currentBatteryKm + (totalCapacityKm * 0.1));
          chargeUpToKm = Math.min(chargeUpToKm, totalCapacityKm); 

          let actualKmToCharge = chargeUpToKm - currentBatteryKm;
          if (actualKmToCharge <=0) actualKmToCharge = totalCapacityKm * 0.1; 
          
          const kWhToCharge = actualKmToCharge / MOCK_KM_PER_KWH;
          let chargingDurationMinutes = (kWhToCharge / MOCK_CHARGING_RATE_KW) * 60;
          chargingDurationMinutes = Math.max(15, chargingDurationMinutes); 

          let nearbyActivities: string[] = ["Take a short break."];
          if (process.env.API_KEY) {
            try {
                nearbyActivities = await geminiService.getNearbyActivities(chargerName, chargingDurationMinutes, preferences);
            } catch (geminiError) {
                console.error("Gemini API error:", geminiError);
                nearbyActivities = ["Error suggesting activities. Enjoy your break."];
            }
          } else {
             nearbyActivities = ["Activity suggestions disabled (API key missing). Enjoy the charge!"];
          }

          chargingStopsList.push({
            station: chargerName,
            eta: etaAtCharger,
            charging_time: `${Math.round(chargingDurationMinutes)} min`,
            activities_nearby: nearbyActivities,
          });

          currentTime = currentTime.add(dayjs.duration(chargingDurationMinutes, 'minutes'));
          timeline.push(`${currentTime.format('h:mm A')} - Resume drive from ${chargerName}`);
          currentBatteryKm += actualKmToCharge;
          currentBatteryKm = Math.min(currentBatteryKm, totalCapacityKm); 
        }
      }
      
      const lastTimelineEvent = timeline[timeline.length -1];
      if (distanceTravelled < totalDistanceKm && (!lastTimelineEvent || !lastTimelineEvent.toLowerCase().includes(`arrive at ${routeSummary.actual_destination_address?.toLowerCase()}`))) {
         setError("Could not complete the trip plan. The destination might be unreachable with the provided parameters or simulated charging network. The calculated distance might be too high for the battery capacity and charging stops.");
         setIsLoading(false);
         return;
      }
      
      const finalPlan: NewTripPlan = {
        source: finalSourceDisplayName, 
        destination: finalDestinationDisplayName,
        route_summary: routeSummary,
        charging_required: chargingLogicRequiredThisTrip,
        charging_stops: chargingStopsList,
        timeline: timeline,
      };
      setTripPlanResult(finalPlan);

    } catch (e: any) {
      console.error("Error planning trip:", e);
      setError(e.message || "An unknown error occurred while planning the trip.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geminiService, openRouteService, geminiApiKeyError, selectedSource, selectedDestination ]); 

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-4xl">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">EV Travel Assistant</h1>
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
        </header>

        {geminiApiKeyError && (
          <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-700 border-l-4 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-200 rounded-md flex items-center">
            <AlertIcon className="h-6 w-6 mr-3 text-yellow-600 dark:text-yellow-300" />
            <p>{geminiApiKeyError}</p>
          </div>
        )}
        
        {/* MapSelector removed */}

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 sm:p-8 mb-8">
          <InputForm
            onPlanTrip={handlePlanTrip}
            isLoading={isLoading}
            sourceInputText={sourceInputText}
            destinationInputText={destinationInputText}
            onSourceInputChange={handleSourceInputChange}
            onDestinationInputChange={handleDestinationInputChange}
            onSourceLocationSelect={handleSourceLocationSelect}
            onDestinationLocationSelect={handleDestinationLocationSelect}
            onClearSourceSelection={handleClearSourceSelection}
            onClearDestinationSelection={handleClearDestinationSelection}
          />
        </div>
        
        {isLoading && ( 
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <LoadingIcon className="h-12 w-12 mb-4 text-primary-500" />
            <p className="text-xl font-semibold">Calculating your electrifying journey...</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fetching route from OpenStreetMap, seeking cosmic wisdom for activities...</p>
          </div>
        )}
        {error && (
           <div className="mb-4 p-4 bg-red-100 dark:bg-red-700 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 rounded-md flex items-center">
            <AlertIcon className="h-6 w-6 mr-3 text-red-600 dark:text-red-300" />
            <p>{error}</p>
          </div>
        )}
        {tripPlanResult && !isLoading && !error && (
          <TripDisplay tripPlan={tripPlanResult} />
        )}
        
        <footer className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} EV Travel Assistant. Route data by OpenStreetMap contributors. Waypoints and charging stops are simulated.</p>
          {/* Removed Leaflet/GeoSearch attribution */}
        </footer>
      </div>
    </div>
  );
};

export default App;