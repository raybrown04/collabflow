"use client"

import { useState, useEffect } from 'react';
import { GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';

export interface LocationData {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface LocationInputProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
}

export function LocationInput({ 
  value, 
  onChange, 
  placeholder = "Enter location", 
  className = "" 
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value?.address || '');

  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value?.address]);

  const handlePlaceSelect = (place: any) => {
    if (place) {
      onChange({
        address: place.properties.formatted,
        coordinates: {
          lat: place.properties.lat,
          lng: place.properties.lon
        }
      });
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!value) {
      onChange({ address: '' });
    }
  };

  // We're using a simpler approach for now due to React 19 compatibility issues
  // with the Geoapify components
  return (
    <div className={className}>
      <input 
        type="text" 
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange({ address: e.target.value });
        }}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 h-10 bg-background text-foreground"
      />
      <small className="text-xs text-muted-foreground">
        Enter a location address (geocoding integration coming soon)
      </small>
    </div>
  );
}
