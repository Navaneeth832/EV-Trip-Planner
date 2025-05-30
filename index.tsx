import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extend Day.js with necessary plugins
// Check if plugins are already loaded globally (e.g., via <script> in index.html)
if (typeof window !== 'undefined' && window.dayjs_plugin_duration) {
  dayjs.extend(window.dayjs_plugin_duration);
} else {
  dayjs.extend(duration); // Fallback if global plugin not found
}

if (typeof window !== 'undefined' && window.dayjs_plugin_customParseFormat) {
  dayjs.extend(window.dayjs_plugin_customParseFormat);
} else {
  dayjs.extend(customParseFormat); // Fallback if global plugin not found
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
