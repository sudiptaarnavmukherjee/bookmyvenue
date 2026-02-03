"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type CompareItem = {
  id: string;
  name: string;
  type: "venue" | "caterer";
};

type CompareContextType = {
  venueIds: string[];
  catererIds: string[];
  addVenue: (id: string, name: string) => void;
  removeVenue: (id: string) => void;
  addCaterer: (id: string, name: string) => void;
  removeCaterer: (id: string) => void;
  isVenueSelected: (id: string) => boolean;
  isCatererSelected: (id: string) => boolean;
  clearVenues: () => void;
  clearCaterers: () => void;
  venueItems: CompareItem[];
  catererItems: CompareItem[];
};

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [venueItems, setVenueItems] = useState<CompareItem[]>([]);
  const [catererItems, setCatererItems] = useState<CompareItem[]>([]);

  const addVenue = useCallback((id: string, name: string) => {
    setVenueItems(prev => {
      if (prev.length >= MAX_COMPARE) {
        alert(`You can compare up to ${MAX_COMPARE} venues at a time`);
        return prev;
      }
      if (prev.some(v => v.id === id)) return prev;
      return [...prev, { id, name, type: "venue" }];
    });
  }, []);

  const removeVenue = useCallback((id: string) => {
    setVenueItems(prev => prev.filter(v => v.id !== id));
  }, []);

  const addCaterer = useCallback((id: string, name: string) => {
    setCatererItems(prev => {
      if (prev.length >= MAX_COMPARE) {
        alert(`You can compare up to ${MAX_COMPARE} caterers at a time`);
        return prev;
      }
      if (prev.some(c => c.id === id)) return prev;
      return [...prev, { id, name, type: "caterer" }];
    });
  }, []);

  const removeCaterer = useCallback((id: string) => {
    setCatererItems(prev => prev.filter(c => c.id !== id));
  }, []);

  const isVenueSelected = useCallback((id: string) => {
    return venueItems.some(v => v.id === id);
  }, [venueItems]);

  const isCatererSelected = useCallback((id: string) => {
    return catererItems.some(c => c.id === id);
  }, [catererItems]);

  const clearVenues = useCallback(() => {
    setVenueItems([]);
  }, []);

  const clearCaterers = useCallback(() => {
    setCatererItems([]);
  }, []);

  return (
    <CompareContext.Provider
      value={{
        venueIds: venueItems.map(v => v.id),
        catererIds: catererItems.map(c => c.id),
        addVenue,
        removeVenue,
        addCaterer,
        removeCaterer,
        isVenueSelected,
        isCatererSelected,
        clearVenues,
        clearCaterers,
        venueItems,
        catererItems,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
