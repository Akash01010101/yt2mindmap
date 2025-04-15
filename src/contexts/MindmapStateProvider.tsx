"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type MindmapStateContextType = {
  isVerified: boolean;
  setIsVerified: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  mode: 'youtube' | 'longtext';
  setMode: React.Dispatch<React.SetStateAction<'youtube' | 'longtext'>>;
  showPricing: boolean;
  setShowPricing: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

const MindmapStateContext = createContext<MindmapStateContextType | undefined>(undefined);

export function MindmapStateProvider({ children }: { children: ReactNode }) {
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'youtube' | 'longtext'>('youtube');
  const [showPricing, setShowPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <MindmapStateContext.Provider value={{
      isVerified, setIsVerified,
      loading, setLoading,
      inputValue, setInputValue,
      saving, setSaving,
      mode, setMode,
      showPricing, setShowPricing,
      error, setError
    }}>
      {children}
    </MindmapStateContext.Provider>
  );
}

export function useMindmapState() {
  const context = useContext(MindmapStateContext);
  if (!context) {
    throw new Error("useMindmapState must be used within a MindmapStateProvider");
  }
  return context;
}