"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChurchBranding {
  name: string;
  subtitle: string;
  logoUrl: string;
}

interface BrandingContextValue {
  branding: ChurchBranding;
  setBranding: (branding: ChurchBranding) => void;
}

const defaultBranding: ChurchBranding = {
  name: "Glory Worship Church",
  subtitle: "Sanctuary CMS",
  logoUrl: "/church-logo.svg",
};

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<ChurchBranding>(defaultBranding);
  return (
    <BrandingContext.Provider value={{ branding, setBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}