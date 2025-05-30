// EV Simulation Constants
export const MOCK_KM_PER_KWH = 6; // Average EV efficiency: km per kWh
export const MOCK_CHARGING_RATE_KW = 50; // Average DC fast charger speed in kW

// Trip Planning Logic Constants
export const MIN_BATTERY_PERCENT_AT_DESTINATION = 20; // Minimum battery percentage desired upon arrival at final destination
export const TARGET_BATTERY_PERCENT_AT_CHARGER_ARRIVAL = 15; // Target battery percentage when arriving at a charging station (can be lower now with more accurate distances)
export const DEFAULT_CHARGE_UP_TO_PERCENT = 80; // Default target battery percentage after charging at a station

// Route Simulation Constants (Less critical now, but used for some internal logic or fallback)
export const AVG_SPEED_KMH = 80; // Average driving speed in km/h, can be overridden by Google Maps data. Used for intra-leg estimations.
export const MOCK_DISTANCE_FACTOR = 1; // Reduced: No longer primary source for distance
export const MOCK_MIN_DISTANCE = 10; // Minimum mock distance in km
export const MOCK_MAX_DISTANCE = 3000; // Maximum mock distance in km
