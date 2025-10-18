import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Vehicle {
  id: string;
  asset_id: string;
  vehicle_name: string;
  make: string;
  model: string;
  year: number;
  current_odometer: number;
}

interface Transaction {
  current_odometer: number | null;
  product_code: string;
  product_description: string;
  driver_first_name: string;
  driver_last_name: string;
  merchant_city: string;
  merchant_state: string;
  custom_vehicle_asset_id: string | null;
  vehicle_description: string | null;
}

interface MatchResult {
  vehicle_id: string | null;
  matched_vehicle_id: string | null;
  confidence: number;
  method: string;
  needs_review: boolean;
  review_reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction, vehicles } = await req.json();
    
    console.log('Matching vehicle for transaction:', {
      odometer: transaction.current_odometer,
      customId: transaction.custom_vehicle_asset_id,
      vehicleDesc: transaction.vehicle_description
    });

    const matchResult = await matchVehicleWithAI(transaction, vehicles);
    
    console.log('Match result:', matchResult);

    return new Response(JSON.stringify(matchResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in match-vehicle-ai:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function matchVehicleWithAI(transaction: Transaction, vehicles: Vehicle[]): Promise<MatchResult> {
  // Step 1: Check for direct asset ID match
  if (transaction.custom_vehicle_asset_id) {
    const directMatch = vehicles.find(v => 
      v.asset_id === transaction.custom_vehicle_asset_id
    );
    
    if (directMatch) {
      console.log('Direct asset ID match found:', directMatch.asset_id);
      return {
        vehicle_id: directMatch.asset_id,
        matched_vehicle_id: directMatch.id,
        confidence: 100,
        method: 'Direct ID Match',
        needs_review: false
      };
    }
  }

  // Step 2: If no odometer reading, flag for manual review
  if (!transaction.current_odometer || transaction.current_odometer === 0) {
    console.log('No odometer reading available');
    return {
      vehicle_id: null,
      matched_vehicle_id: null,
      confidence: 0,
      method: 'Unmatched',
      needs_review: true,
      review_reason: 'No odometer reading available'
    };
  }

  // Step 3: Find vehicles with similar odometer readings
  const candidates = vehicles
    .map(vehicle => ({
      ...vehicle,
      odometer_diff: Math.abs((vehicle.current_odometer || 0) - transaction.current_odometer!)
    }))
    .filter(v => v.odometer_diff < 10000) // Within 10k miles
    .sort((a, b) => a.odometer_diff - b.odometer_diff);

  console.log(`Found ${candidates.length} candidates within odometer range`);

  if (candidates.length === 0) {
    console.log('No candidates found within odometer range');
    return {
      vehicle_id: null,
      matched_vehicle_id: null,
      confidence: 0,
      method: 'Unmatched',
      needs_review: true,
      review_reason: 'No matching vehicle found based on odometer reading'
    };
  }

  // Step 4: Filter by fuel type compatibility
  const isDiesel = transaction.product_code?.toUpperCase().includes('DSL') || 
                   transaction.product_description?.toLowerCase().includes('diesel');
  
  const fuelCompatible = candidates.filter(vehicle => {
    const vehicleUsesDiesel = 
      vehicle.make?.toLowerCase().includes('diesel') || 
      vehicle.model?.toLowerCase().includes('diesel');
    return isDiesel === vehicleUsesDiesel;
  });

  console.log(`${fuelCompatible.length} fuel-compatible candidates`);

  // Step 5: If single match with close odometer, high confidence
  if (fuelCompatible.length === 1 && fuelCompatible[0].odometer_diff < 1000) {
    console.log('Single exact match found:', fuelCompatible[0].asset_id);
    return {
      vehicle_id: fuelCompatible[0].asset_id,
      matched_vehicle_id: fuelCompatible[0].id,
      confidence: 95,
      method: 'Odometer Match',
      needs_review: false
    };
  }

  // Step 6: Use OpenAI for multiple candidates
  if (fuelCompatible.length > 1) {
    console.log('Using AI to determine best match among candidates');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return {
        vehicle_id: fuelCompatible[0].asset_id,
        matched_vehicle_id: fuelCompatible[0].id,
        confidence: 60,
        method: 'Odometer Match',
        needs_review: true,
        review_reason: 'Multiple candidates, AI matching unavailable'
      };
    }

    try {
      const prompt = `Given this fuel transaction:
- Odometer: ${transaction.current_odometer}
- Fuel Type: ${transaction.product_description || 'Unknown'}
- Driver: ${transaction.driver_first_name || ''} ${transaction.driver_last_name || ''}
- Location: ${transaction.merchant_city || ''}, ${transaction.merchant_state || ''}
- Custom Vehicle ID: ${transaction.custom_vehicle_asset_id || 'none'}
- Vehicle Description: ${transaction.vehicle_description || 'none'}

Candidate vehicles:
${fuelCompatible.map((v, i) => `${i+1}. ${v.vehicle_name || v.asset_id} - ${v.year} ${v.make} ${v.model} - Current Odometer: ${v.current_odometer} (difference: ${v.odometer_diff} miles)`).join('\n')}

Which vehicle is the best match? Respond ONLY with: number confidence
Example: 1 85
Where number is 1-${fuelCompatible.length} and confidence is 0-100.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a vehicle matching expert. Analyze fuel transactions and match them to the correct fleet vehicle based on odometer readings, location patterns, and driver information.' 
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 50,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content.trim();
      console.log('AI response:', aiResponse);

      // Parse AI response (format: "1 85" or "1 85%")
      const match = aiResponse.match(/(\d+)\s+(\d+)/);
      if (match) {
        const vehicleIndex = parseInt(match[1]) - 1;
        const confidence = parseInt(match[2]);
        
        if (vehicleIndex >= 0 && vehicleIndex < fuelCompatible.length) {
          const selectedVehicle = fuelCompatible[vehicleIndex];
          console.log('AI selected vehicle:', selectedVehicle.asset_id, 'with confidence:', confidence);
          
          return {
            vehicle_id: selectedVehicle.asset_id,
            matched_vehicle_id: selectedVehicle.id,
            confidence: confidence,
            method: 'AI Match',
            needs_review: confidence < 80
          };
        }
      }

      // Fallback if AI response couldn't be parsed
      console.log('Could not parse AI response, using closest match');
      return {
        vehicle_id: fuelCompatible[0].asset_id,
        matched_vehicle_id: fuelCompatible[0].id,
        confidence: 70,
        method: 'Odometer Match',
        needs_review: true,
        review_reason: 'AI response unclear, using closest odometer match'
      };
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      // Fallback to closest odometer match
      return {
        vehicle_id: fuelCompatible[0].asset_id,
        matched_vehicle_id: fuelCompatible[0].id,
        confidence: 65,
        method: 'Odometer Match',
        needs_review: true,
        review_reason: 'AI matching failed, using closest odometer match'
      };
    }
  }

  // Step 7: Use fuel-compatible candidates if available
  if (fuelCompatible.length === 1) {
    console.log('Single fuel-compatible match:', fuelCompatible[0].asset_id);
    return {
      vehicle_id: fuelCompatible[0].asset_id,
      matched_vehicle_id: fuelCompatible[0].id,
      confidence: 75,
      method: 'Odometer Match',
      needs_review: true,
      review_reason: 'Single candidate but odometer difference > 1000 miles'
    };
  }

  // No good match found
  console.log('No suitable match found');
  return {
    vehicle_id: null,
    matched_vehicle_id: null,
    confidence: 0,
    method: 'Unmatched',
    needs_review: true,
    review_reason: 'No matching vehicle found based on odometer and fuel type'
  };
}
