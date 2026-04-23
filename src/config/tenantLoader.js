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
  // Strip www. prefix: www.abcefgh.onlinept.in → abcefgh.onlinept.in
  const cleanHostname = hostname.replace(/^www\./, '');
  const isProdDomain = cleanHostname.endsWith('onlinept.in') || cleanHostname.endsWith('stackstaging.com');
  
  if (isProdDomain && !testTenant) {
    if (cleanHostname.includes('stackstaging.com')) {
      // For the staging URL 'onlinept-in.stackstaging.com', we treat it as the main domain
      searchDomain = 'onlinept.in';
    } else {
      const parts = cleanHostname.split('.');
      // If hostname is x.onlinept.in, length is 3. The first part is the subdomain.
      if (parts.length >= 3) {
        searchDomain = parts[0];
      }
    }
  }

  // ── Localhost Support & Default Tenant ────────────────────────────────────
  if ((hostname.includes('localhost') || hostname.includes('127.0.0.1')) && !testTenant) {
    searchDomain = 'demo';
    // We don't return here anymore; we'll attempt to fetch a 'default' or first clinic
    // to provide a "flowless" offline experience where components have real data.
    searchDomain = 'demo'; // Fallback to demo config if nothing else found
  }

  try {
    // 5s timeout promise
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection to Clinical Database timed out. Please check your internet or refresh.')), 15000)
    );

    const fetchTask = (async () => {

      // BYPASS FOR DEMO
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
        return null;
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
      const status = tenantData.subscriptionStatus || 'active'; // Fallback to active for legacy
      
      if (status === 'pending_approval') {
        throw new Error('This clinical portal is currently awaiting Super Admin approval. Please check back soon.');
      }
      
      if (status === 'suspended') {
        throw new Error('This clinical portal has been suspended. Please contact platform support.');
      }

      if (status === 'rejected') {
        throw new Error('This clinical enrollment was not approved. Access denied.');
      }

      updateClinicConfig(tenantData);
    } else {
      // No clinic found for domain
    }
  } catch (error) {
    throw error;
  }
}
