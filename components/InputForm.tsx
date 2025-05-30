import React, { useState } from 'react';
import type { UserPreferences, GeocodeResult } from '../types';
import { BatteryIcon, RouteIcon, ClockIcon, SparklesIcon, CoffeeIcon } from './Icons'; 
import { LocationInput } from './LocationInput';

interface InputFormProps {
  onPlanTrip: (
    batteryPercent: number,
    totalEvRangeKm: number,
    departureTime: string,
    preferences: UserPreferences
  ) => void;
  isLoading: boolean;
  sourceInputText: string;
  destinationInputText: string;
  onSourceInputChange: (value: string) => void;
  onDestinationInputChange: (value: string) => void;
  onSourceLocationSelect: (location: GeocodeResult) => void;
  onDestinationLocationSelect: (location: GeocodeResult) => void;
  onClearSourceSelection: () => void;
  onClearDestinationSelection: () => void;
}

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
const FormButton: React.FC<FormButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export const InputForm: React.FC<InputFormProps> = ({
  onPlanTrip,
  isLoading,
  sourceInputText,
  destinationInputText,
  onSourceInputChange,
  onDestinationInputChange,
  onSourceLocationSelect,
  onDestinationLocationSelect,
  onClearSourceSelection,
  onClearDestinationSelection,
}) => {
  const [batteryPercent, setBatteryPercent] = useState<string>('80');
  const [totalEvRangeKm, setTotalEvRangeKm] = useState<string>('300'); 
  const [departureTime, setDepartureTime] = useState<string>(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    avoidSlowChargers: false,
    preferFoodOptions: true,
    petFriendlySpots: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation for selected locations will be handled in App.tsx based on selectedSource/Destination
    if (!batteryPercent || !totalEvRangeKm || !departureTime) {
      alert("Please fill in battery, range, and departure time.");
      return;
    }
    onPlanTrip(
      parseFloat(batteryPercent),
      parseFloat(totalEvRangeKm),
      departureTime,
      preferences
    );
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPreferences(prev => ({ ...prev, [name]: checked }));
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Plan Your Journey</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="batteryPercent" className={labelClass}>
            <BatteryIcon className="inline h-5 w-5 mr-1" /> Current Battery (%)
          </label>
          <input
            type="number"
            id="batteryPercent"
            value={batteryPercent}
            onChange={(e) => setBatteryPercent(e.target.value)}
            min="0"
            max="100"
            required
            className={inputClass}
            placeholder="e.g., 80"
          />
        </div>
        <div>
          <label htmlFor="totalEvRangeKm" className={labelClass}>
            <RouteIcon className="inline h-5 w-5 mr-1" /> EV's Max Range (km at 100%)
          </label>
          <input
            type="number"
            id="totalEvRangeKm"
            value={totalEvRangeKm}
            onChange={(e) => setTotalEvRangeKm(e.target.value)}
            min="1"
            required
            className={inputClass}
            placeholder="e.g., 300"
          />
        </div>
      </div>

      <LocationInput
        id="source"
        label="Source Location"
        value={sourceInputText}
        onInputChange={onSourceInputChange}
        onLocationSelect={onSourceLocationSelect}
        onClearSelection={onClearSourceSelection}
        placeholder="Type to search for source..."
      />

      <LocationInput
        id="destination"
        label="Destination Location"
        value={destinationInputText}
        onInputChange={onDestinationInputChange}
        onLocationSelect={onDestinationLocationSelect}
        onClearSelection={onClearDestinationSelection}
        placeholder="Type to search for destination..."
      />
      
      <div>
        <label htmlFor="departureTime" className={labelClass}>
          <ClockIcon className="inline h-5 w-5 mr-1" /> Estimated Departure Time
        </label>
        <input
          type="time"
          id="departureTime"
          value={departureTime}
          onChange={(e) => setDepartureTime(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <h3 className={`${labelClass} mb-2`}><SparklesIcon className="inline h-5 w-5 mr-1" /> Activity Preferences</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input id="preferFoodOptions" name="preferFoodOptions" type="checkbox" checked={preferences.preferFoodOptions} onChange={handlePreferenceChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
            <label htmlFor="preferFoodOptions" className="ml-2 block text-sm text-gray-900 dark:text-gray-300"><CoffeeIcon className="inline h-4 w-4 mr-1" /> Prefer Food Options</label>
          </div>
           <div className="flex items-center">
            <input id="avoidSlowChargers" name="avoidSlowChargers" type="checkbox" checked={preferences.avoidSlowChargers} onChange={handlePreferenceChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
            <label htmlFor="avoidSlowChargers" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Avoid Slow Chargers (Simulated)</label>
          </div>
          <div className="flex items-center">
            <input id="petFriendlySpots" name="petFriendlySpots" type="checkbox" checked={preferences.petFriendlySpots} onChange={handlePreferenceChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
            <label htmlFor="petFriendlySpots" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Pet-Friendly Spots</label>
          </div>
        </div>
      </div>

      <div>
        <FormButton type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Planning...' : 'Plan My EV Trip'}
        </FormButton>
      </div>
    </form>
  );
};