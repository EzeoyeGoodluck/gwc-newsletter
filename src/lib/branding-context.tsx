"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface ChurchBranding {
  name: string;
  subtitle: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
}

interface BrandingContextValue {
  branding: ChurchBranding;
  setBranding: (update: Partial<ChurchBranding>) => void;
}

export const defaultBranding: ChurchBranding = {
  name: "Glory Worship Church",
  subtitle: "Sanctuary CMS",
  logoUrl: "/church-logo.svg",
  primaryColor: "#06385B",
  accentColor: "#F6C84C",
};

const BrandingContext = createContext<BrandingContextValue | undefined>(
  undefined
);

export function BrandingProvider({
  initial,
  children,
}: {
  initial?: Partial<ChurchBranding>;
  children: ReactNode;
}) {
  const [branding, setState] = useState<ChurchBranding>({
    ...defaultBranding,
    ...initial,
    logoUrl: initial?.logoUrl || defaultBranding.logoUrl,
  });

  const setBranding = (update: Partial<ChurchBranding>) =>
    setState((current) => ({
      ...current,
      ...update,
      logoUrl:
        "logoUrl" in update
          ? update.logoUrl || defaultBranding.logoUrl
          : current.logoUrl,
    }));

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
