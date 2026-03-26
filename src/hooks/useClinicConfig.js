import clinicConfig, { derivedConfig } from '@/config/clinicConfig';

/**
 * useClinicConfig — provides white-label config values throughout the app.
 *
 * Usage:
 *   const config = useClinicConfig();
 *   config.clinicName   // → "Nijanand Fitness Centre"
 *   config.primaryColor // → "#39A900"
 */
export default function useClinicConfig() {
  return {
    ...clinicConfig,
    ...derivedConfig,
    cssVariables: derivedConfig.cssVariables,
    whatsappLink: derivedConfig.whatsappLink,
  };
}
