import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeocodeResult } from '../types';
import { OpenRouteService } from '../services/OpenRouteService';
import { LoadingIcon } from './Icons'; // Assuming you have a loading icon

interface LocationInputProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onInputChange: (value: string) => void;
  onLocationSelect: (location: GeocodeResult) => void;
  onClearSelection: () => void; // To notify App.tsx to clear selected location
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  value,
  placeholder,
  onInputChange,
  onLocationSelect,
  onClearSelection,
}) => {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const openRouteService = OpenRouteService.getInstance();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.length < 2) { // Don't search for very short strings
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const results = await openRouteService.searchLocations(query, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setActiveIndex(-1); // Reset active index when new suggestions are loaded
      } catch (error) {
        console.error(`Failed to fetch suggestions for ${query}:`, error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    },
    [openRouteService]
  );

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => resolve(func(...args)), delay);
      });
    };
  };

  const debouncedFetchSuggestions = useCallback(debounce(fetchSuggestions, 300), [fetchSuggestions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onInputChange(newValue);
    if (newValue === '') {
      onClearSelection(); // Notify App to clear selected location if input is blanked
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      debouncedFetchSuggestions(newValue);
    }
  };

  const handleSelectSuggestion = (location: GeocodeResult) => {
    onLocationSelect(location);
    setShowSuggestions(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prevIndex) => (prevIndex - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }
  };
  
  useEffect(() => {
    if (activeIndex !== -1 && suggestionsRef.current) {
      const activeItem = suggestionsRef.current.children[activeIndex] as HTMLLIElement;
      activeItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding suggestions to allow click on suggestion item
    setTimeout(() => {
        // Check if the new focused element is part of the suggestions list
        if (!suggestionsRef.current?.contains(document.activeElement)) {
             setShowSuggestions(false);
        }
    }, 100);
  };


  const inputClass = "flex-1 min-w-0 block w-full px-3 py-2 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="relative">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => value.length > 1 && suggestions.length > 0 && setShowSuggestions(true)}
          required
          className={inputClass}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isLoadingSuggestions && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <LoadingIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.osm_id ? `${suggestion.osm_type}-${suggestion.osm_id}` : `${suggestion.lat}-${suggestion.lon}-${index}`}
              className={`px-3 py-2 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-700 ${
                index === activeIndex ? 'bg-primary-100 dark:bg-primary-700' : ''
              }`}
              onClick={() => handleSelectSuggestion(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click
              role="option"
              aria-selected={index === activeIndex}
            >
              <span className="block text-sm text-gray-900 dark:text-gray-100">{suggestion.displayName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};