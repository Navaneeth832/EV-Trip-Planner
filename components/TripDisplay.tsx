import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewTripPlan, ChargingStopDetail, RouteSummary } from '../types';
import { CalendarIcon, LocationMarkerIcon, ClockIcon, LightningBoltIcon, SparklesIcon, InformationCircleIcon, MapIcon, FlagIcon } from './Icons';

interface TripDisplayProps {
  tripPlan: NewTripPlan;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const ActivityItem: React.FC<{ activity: string; index: number }> = ({ activity, index }) => {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start text-sm text-gray-700 dark:text-gray-300"
    >
      <SparklesIcon className="flex-shrink-0 h-4 w-4 text-primary-500 dark:text-primary-400 mr-2 mt-0.5" />
      <span>{activity}</span>
    </motion.li>
  );
};

const RouteSummaryDisplay: React.FC<{ summary: RouteSummary; sourceName: string; destinationName: string }> = ({ summary, sourceName, destinationName }) => {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mb-6 p-4 glass-morphism rounded-lg"
    >
      <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-3 flex items-center">
        <MapIcon className="h-5 w-5 mr-2" />
        Route Summary
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">From:</p>
          <p className="text-gray-800 dark:text-gray-200">{summary.actual_source_address || sourceName}</p>
        </div>
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">To:</p>
          <p className="text-gray-800 dark:text-gray-200">{summary.actual_destination_address || destinationName}</p>
        </div>
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">Total Distance:</p>
          <p className="text-gray-800 dark:text-gray-200">{summary.distance_km} km</p>
        </div>
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">Est. Driving Duration:</p>
          <p className="text-gray-800 dark:text-gray-200">{summary.duration}</p>
        </div>
        {summary.major_waypoints && summary.major_waypoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="sm:col-span-2 mt-2"
          >
            <p className="font-medium text-gray-600 dark:text-gray-400 mb-1">Major Waypoints En Route:</p>
            <ul className="list-disc list-inside space-y-1">
              {summary.major_waypoints.map((wp, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-gray-700 dark:text-gray-300"
                >
                  {wp}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const ChargingStopCard: React.FC<{ stop: ChargingStopDetail; index: number }> = ({ stop, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.2 }}
      className="neumorphism p-4 rounded-lg"
    >
      <h4 className="font-semibold text-md text-primary-700 dark:text-primary-300 mb-2">
        <LightningBoltIcon className="inline h-5 w-5 mr-1 text-yellow-500" /> Stop {index + 1}: {stop.station}
      </h4>
      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <p><ClockIcon className="inline h-4 w-4 mr-1" /> Est. Arrival: {stop.eta}</p>
        <p><LightningBoltIcon className="inline h-4 w-4 mr-1" /> Charging Time: {stop.charging_time}</p>
      </div>
      {stop.activities_nearby && stop.activities_nearby.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">Nearby Activities:</h5>
          <ul className="space-y-1 pl-1">
            {stop.activities_nearby.map((activity, i) => (
              <ActivityItem key={i} activity={activity} index={i} />
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

const TimelineEvent: React.FC<{ event: string; actualDestination: string; index: number }> = ({ event, actualDestination, index }) => {
  let Icon = FlagIcon;
  const lowerEvent = event.toLowerCase();
  const lowerActualDest = actualDestination.toLowerCase();

  if (lowerEvent.includes("depart from")) Icon = LocationMarkerIcon;
  else if (lowerEvent.includes("arrive at") && lowerEvent.includes(lowerActualDest)) Icon = FlagIcon;
  else if (lowerEvent.includes("stop at")) Icon = LightningBoltIcon;
  else if (lowerEvent.includes("resume drive")) Icon = MapIcon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center space-x-3"
    >
      <Icon className="h-5 w-5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
      <span className="text-gray-700 dark:text-gray-300">{event}</span>
    </motion.li>
  );
};

export const TripDisplay: React.FC<TripDisplayProps> = ({ tripPlan }) => {
  const { source, destination, route_summary, charging_required, charging_stops, timeline } = tripPlan;

  const lastEvent = timeline && timeline.length > 0 ? timeline[timeline.length - 1] : "";
  const actualFinalDestinationName = route_summary.actual_destination_address || destination;
  const isFeasible = lastEvent.toLowerCase().includes(`arrive at ${actualFinalDestinationName.toLowerCase()}`);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass-morphism shadow-xl rounded-lg p-6 sm:p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
          <CalendarIcon className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" /> Your Trip Itinerary
        </h2>
        
        <RouteSummaryDisplay summary={route_summary} sourceName={source} destinationName={destination} />

        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-primary-700 dark:text-primary-300 mb-2 flex items-center">
            <InformationCircleIcon className={`h-5 w-5 mr-2 ${charging_required ? 'text-yellow-500' : 'text-green-500'}`} />
            Charging Status
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {charging_required ? "Charging stops are required for this trip." : "No charging stops are required. You can reach your destination directly!"}
          </p>
        </motion.div>

        {charging_required && charging_stops && charging_stops.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mb-8"
          >
            <h3 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-4">Recommended Charging Stops:</h3>
            <div className="space-y-4">
              {charging_stops.map((stop, index) => (
                <ChargingStopCard key={index} stop={stop} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {timeline && timeline.length > 0 && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <h3 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-4">Trip Timeline:</h3>
            <div className="timeline-scroll">
              <ol className="space-y-3 border-l-2 border-primary-200 dark:border-primary-700 pl-4">
                {timeline.map((event, index) => (
                  <TimelineEvent
                    key={index}
                    event={event}
                    actualDestination={actualFinalDestinationName}
                    index={index}
                  />
                ))}
              </ol>
            </div>
          </motion.div>
        )}
        
        {!isFeasible && tripPlan.timeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 text-yellow-700 dark:text-yellow-200 rounded-md"
          >
            <p className="font-medium">Note:</p>
            <p>The plan indicates potential issues reaching the final destination as stated (timeline does not end with arrival at "{actualFinalDestinationName}"). Please review parameters.</p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};