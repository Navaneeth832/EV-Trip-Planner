
import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

interface DarkModeToggleProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ darkMode, setDarkMode }) => {
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <SunIcon className="h-6 w-6 text-yellow-400" />
      ) : (
        <MoonIcon className="h-6 w-6 text-gray-700" />
      )}
    </button>
  );
};
