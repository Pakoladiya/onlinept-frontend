import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateClinicConfig } from '@/config/clinicConfig';

/**
 * Bootstraps the application by fetching the correct tenant (clinic) configuration
 * based on the current hostname. Falls back to local config if not found or if on localhost.
 */
export async function loadTenantConfig() {
  const hostname = window.location.hostname;
  
  // Optional: Allow testing a specific tenant locally via URL param ?tenant=demo
  const urlParams = new URLSearchParams(window.location.search);
  const testTenant = urlParams.get('tenant');
  
  const searchDomain = testTenant || hostname;

  if ((hostname.includes('localhost') || hostname.includes('127.0.0.1')) && !testTenant) {
    console.log('[TenantLoader] Localhost detected, using fallback local clinicConfig.');
    return;
  }

  try {
    console.log(`[TenantLoader] Fetching config for domain: ${searchDomain}`);
    
    // 🛑 BYPASS FOR DEMO: If the user is trying to load the demo tenant, short-circuit
    // the Firestore network call and instantly provide a mock configuration.
    // This prevents any silent Firebase connection hangs from blocking the trial.
    if (searchDomain === 'demo') {
      console.log('[TenantLoader] Demo tenant detected! Bypassing Firestore for instant demo.');
      updateClinicConfig({
        id: 'demo',
        domain: 'demo',
        clinicId: 'demo_clinic',
        clinicName: 'Dr. Demo SaaS',
        primaryColor: '#8b5cf6', // Purple
        secondaryColor: '#ec4899', // Pink
        physioName: 'Dr. Sarah Jenkins',
        tagline: 'Premium White-Labeled online care'
      });
      return;
    }

    // In a real multi-tenant app, domains could be an array to support multiple custom domains 
    // per clinic (e.g. 'nfc.com', 'nfc.onlinept.in'). We query where array contains, or exact match.
    // Assuming 'domain' string field for now.
    const q = query(collection(db, 'clinics'), where('domain', '==', searchDomain));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const tenantData = querySnapshot.docs[0].data();
      const tenantId = querySnapshot.docs[0].id;
      
      console.log(`[TenantLoader] Loaded tenant config for ID: ${tenantId}`);
      
      // Mutate the local singletons with the fetched database config
      updateClinicConfig({ id: tenantId, ...tenantData });
    } else {
      console.warn(`[TenantLoader] No tenant found for domain ${searchDomain}. Using default local fallback.`);
    }
  } catch (error) {
    console.error('[TenantLoader] Failed to load tenant config from Firebase:', error);
    // Silent fail -> app continues with local hardcoded config
  }
}
