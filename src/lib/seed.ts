import { createCafeWithFloors, createAdminUser } from './firestore';
import { Cafe } from '@/types/cafe';

/**
 * Seeds a production-ready demo environment for DineFlow:
 * 1. "Artisan Roasters Cafe"
 * 2. Two floors: "Ground Floor" (4 tables) and "Rooftop Terrace" (4 tables)
 * 3. Pre-configured GST, tax, and UPI details
 * 4. Sample Cafe Admin account
 */
export async function seedDemoPlatformData(): Promise<{ cafe: Cafe; adminEmail: string }> {
  // Check if demo already exists
  const demoCafe = await createCafeWithFloors(
    {
      name: 'Artisan Roasters & Cafe',
      logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=160&auto=format&fit=crop&q=80',
      address: 'Plot 42, 100ft Road, Indiranagar, Bengaluru, KA 560038',
      phone: '+91 98765 43210',
      gstNumber: '29ABCDE1234F1Z5',
      taxPercent: 5.0,
      currency: 'INR',
      upiId: 'artisanroasters@okhdfcbank',
      status: 'active',
    },
    [
      { name: 'Ground Floor (Indoor)', tableCount: 4, prefix: 'G-' },
      { name: 'Rooftop Terrace', tableCount: 4, prefix: 'RT-' },
    ]
  );

  // Create demo admin user
  await createAdminUser({
    name: 'Rohan Sharma',
    email: 'admin@artisanroasters.com',
    role: 'admin',
    cafeId: demoCafe.id,
    active: true,
  });

  return {
    cafe: demoCafe,
    adminEmail: 'admin@artisanroasters.com',
  };
}

