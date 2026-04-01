import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateClinicConfig } from '@/config/clinicConfig';

/**
 * Bootstraps the application by fetching the correct tenant (clinic) configuration
 * based on the current hostname. Falls back to local config if not found or if on localhost.
 */
export async function loadTenantConfig() {
  const hostname = window.location.hostname;
  const urlParams = new URLSearchParams(window.location.search);
  const testTenant = urlParams.get('tenant');
  
  let searchDomain = testTenant || hostname;

  // ── Subdomain Parsing Strategy ──────────────────────────────────────────
  // If we're on a real domain like 'amit.onlinept.in', we should extract 'amit'
  // so we can look it up in Firestore as the 'subdomain' field.
  const isProdDomain = hostname.endsWith('onlinept.in');
  
  if (isProdDomain && !testTenant) {
    const parts = hostname.split('.');
    // If hostname is x.onlinept.in, length is 3. The first part is the subdomain.
    if (parts.length >= 3) {
      searchDomain = parts[0]; 
      console.log(`[TenantLoader] Subdomain detected: ${searchDomain}`);
    }
  }

  // Localhost fallback
  if ((hostname.includes('localhost') || hostname.includes('127.0.0.1')) && !testTenant) {
    console.log('[TenantLoader] Localhost detected, using fallback local clinicConfig.');
    return;
  }

  try {
    // 5s timeout promise
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firebase timeout')), 5000)
    );

    const fetchTask = (async () => {
      console.log(`[TenantLoader] Fetching config for: ${searchDomain}`);
      
      // 🛑 BYPASS FOR DEMO
      if (searchDomain === 'demo' || searchDomain === 'test') {
         return {
          id: 'demo',
          clinicName: 'Test Physio Clinic',
          physioName: 'Dr. Test Physio',
          primaryColor: '#0066FF',
          secondaryColor: '#3B82F6',
          tagline: 'Your premium white-labeled dashboard is ready.'
        };
      }

      if (!db) {
        console.warn('[TenantLoader] DB not initialized. Check your Firebase config.');
        return null;
      }

      const clinicsRef = collection(db, 'clinics');
      
      // Try exact domain match
      let q = query(clinicsRef, where('domain', '==', searchDomain));
      let querySnapshot = await getDocs(q);

      // Try subdomain match
      if (querySnapshot.empty) {
        q = query(clinicsRef, where('subdomain', '==', searchDomain));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
      return null;
    })();

    // Race the fetch against the timeout
    const tenantData = await Promise.race([fetchTask, timeout]);

    if (tenantData) {
      updateClinicConfig(tenantData);
      console.log(`[TenantLoader] Successfully loaded clinic: ${tenantData.clinicName}`);
    } else {
      console.warn(`[TenantLoader] No clinic matches for: ${searchDomain}`);
    }
  } catch (error) {
    console.error('[TenantLoader] Error loading tenant:', error.message || error);
  }
}
