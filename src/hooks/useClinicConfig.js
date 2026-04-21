import { useContext } from 'react';
import { ClinicConfigContext } from '@/context/ClinicConfigContext';
import clinicConfig from '@/config/clinicConfig';

/**
 * useClinicConfig — provides reactive white-label config values throughout the app.
 * Reads from ClinicConfigContext for live updates, with static fallback.
 */
export default function useClinicConfig() {
  const ctx = useContext(ClinicConfigContext);
  return ctx?.config ?? clinicConfig;
}
