import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VehicleFuelData {
  vehicleId: string;
  assetId: string;
  monthlySpending: number;
  fillupCount: number;
}

export function useVehicleFuelData() {
  const [fuelData, setFuelData] = useState<Map<string, VehicleFuelData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFuelData();
  }, []);

  const fetchFuelData = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Fetch all fuel transactions for this month
      const { data: fuelTransactions, error } = await supabase
        .from('fuel_transactions_new')
        .select('vehicle_id, net_cost, gallons')
        .gte('transaction_date', firstDayOfMonth.toISOString())
        .lte('transaction_date', now.toISOString());

      if (error) throw error;

      // Group by vehicle and calculate totals
      const fuelMap = new Map<string, VehicleFuelData>();
      
      fuelTransactions?.forEach(transaction => {
        const vehicleId = transaction.vehicle_id;
        if (!vehicleId) return;

        const existing = fuelMap.get(vehicleId);
        if (existing) {
          existing.monthlySpending += transaction.net_cost || 0;
          existing.fillupCount += 1;
        } else {
          fuelMap.set(vehicleId, {
            vehicleId: vehicleId,
            assetId: vehicleId,
            monthlySpending: transaction.net_cost || 0,
            fillupCount: 1,
          });
        }
      });

      setFuelData(fuelMap);
    } catch (error) {
      console.error('Error fetching fuel data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { fuelData, loading, refetch: fetchFuelData };
}
