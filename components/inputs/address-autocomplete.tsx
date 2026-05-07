'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface GooglePlace {
  formatted_address?: string;
  name?: string;
}

interface GoogleAutocomplete {
  getPlace: () => GooglePlace;
}

interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      event?: {
        clearInstanceListeners: (instance: GoogleAutocomplete) => void;
      };
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          options: {
            componentRestrictions?: { country: string };
            fields?: string[];
            types?: string[];
          },
        ) => GoogleAutocomplete & {
          addListener: (eventName: string, handler: () => void) => void;
        };
      };
    };
  };
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const googleWindow = window as GoogleMapsWindow;

    if (!scriptReady || !GOOGLE_MAPS_API_KEY || !inputRef.current || autocompleteRef.current) {
      return;
    }

    const Autocomplete = googleWindow.google?.maps?.places?.Autocomplete;
    if (!Autocomplete) return;

    const autocomplete = new Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['formatted_address', 'name'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name;
      if (address) onChangeRef.current(address);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        googleWindow.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [scriptReady]);

  return (
    <div className="mb-3">
      {GOOGLE_MAPS_API_KEY && (
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
        />
      )}
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-text-muted">{label}</label>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="street-address"
        className="w-full h-10 sm:h-8 bg-bg-base border border-border-default rounded-md text-sm sm:text-xs text-text-foreground px-2.5 outline-none transition-colors focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/30"
      />
      {!GOOGLE_MAPS_API_KEY && (
        <p className="mt-1 text-[10px] text-text-muted">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable address suggestions.
        </p>
      )}
    </div>
  );
}
