import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDocument, getClinic } from '../firebase/db';
import { loadTenantConfig } from '../config/tenantLoader';
import * as firestore from 'firebase/firestore';

// Manual window/location mock for Node environment
global.window = {
  location: {
    hostname: 'localhost',
    search: '',
  }
};

// Mock Firebase drivers
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, col, id) => ({ _path: `${col}/${id}` })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn((db, col) => ({ _col: col })),
  query: vi.fn((col) => col),
  where: vi.fn((field, op, value) => ({ field, value })),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

// Mock the clinic config update function to avoid side effects
vi.mock('@/config/clinicConfig', () => ({
  updateClinicConfig: vi.fn(),
}));

// Mock Firebase config to avoid initialization errors
vi.mock('@/firebase/config', () => ({
  db: { type: 'mock-db' },
}));

describe('Integration: Database & Routing', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Database Write Logic
  it('should format clinic data correctly on write', async () => {
    const testData = { clinicName: 'Health First' };
    await setDocument('clinics', 'health-123', testData);
    
    // Verify it calls setDoc with merge: true and the timestamp
    expect(firestore.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        clinicName: 'Health First',
        updatedAt: 'mock-timestamp'
      }),
      { merge: true }
    );
  });

  // Test 2: Database Read Logic
  it('should fetch the correct clinic by slug', async () => {
    firestore.getDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'dentals-r-us',
      data: () => ({ clinicName: 'Dentals R Us' })
    });

    const clinic = await getClinic('dentals-r-us');
    expect(clinic.id).toBe('dentals-r-us');
    expect(clinic.clinicName).toBe('Dentals R Us');
    expect(firestore.doc).toHaveBeenCalledWith(expect.anything(), 'clinics', 'dentals-r-us');
  });

  // Test 3: Subdomain Routing
  it('should map subdomain amit.onlinept.in to the "amit" clinic record', async () => {
    // Set mock hostname
    global.window.location.hostname = 'amit.onlinept.in';

    // Mock getDocs to return empty for the first call (domain match)
    // and a real clinic for the second call (subdomain match)
    firestore.getDocs
      .mockResolvedValueOnce({ empty: true }) 
      .mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'amit', data: () => ({ clinicName: 'Amit Physio' }) }]
      });

    await loadTenantConfig();

    // Verify the query was constructed for both domain and subdomain using the extracted 'amit' segment
    expect(firestore.where).toHaveBeenCalledWith('domain', '==', 'amit');
    expect(firestore.where).toHaveBeenCalledWith('subdomain', '==', 'amit');
    expect(firestore.getDocs).toHaveBeenCalledTimes(2);

    // Reset for other tests
    global.window.location.hostname = 'localhost';
  });
});
