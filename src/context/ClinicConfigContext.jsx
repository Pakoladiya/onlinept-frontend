import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import clinicConfig from '@/config/clinicConfig';
import { updateClinicConfig } from '@/config/clinicConfig';

export const ClinicConfigContext = createContext(null);

export function ClinicConfigProvider({ children }) {
  const [config, setConfig] = useState(() => ({ ...clinicConfig }));
  const [renderKey, setRenderKey] = useState(0);

  const refreshConfig = useCallback(() => {
    setConfig({ ...clinicConfig });
    setRenderKey(k => k + 1);
  }, []);

  useEffect(() => {
    // Override updateClinicConfig to also trigger re-render
    const originalUpdate = window.__updateClinicConfig;
    window.__updateClinicConfig = (newConfig) => {
      updateClinicConfig(newConfig);
      refreshConfig();
    };
    return () => {
      if (originalUpdate !== undefined) {
        window.__updateClinicConfig = originalUpdate;
      }
    };
  }, [refreshConfig]);

  return (
    <ClinicConfigContext.Provider value={{ config, renderKey, refreshConfig }}>
      {children}
    </ClinicConfigContext.Provider>
  );
}

export function useClinicConfig() {
  const ctx = useContext(ClinicConfigContext);
  if (!ctx) {
    // Fallback: static import (app not yet mounted or outside provider)
    return { ...clinicConfig };
  }
  return ctx.config;
}

export function useClinicRenderKey() {
  const ctx = useContext(ClinicConfigContext);
  return ctx?.renderKey ?? 0;
}