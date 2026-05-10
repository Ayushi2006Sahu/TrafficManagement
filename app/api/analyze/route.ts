import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, uploadId } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Return simulated data if no API key
      return NextResponse.json(simulateAnalysis());
    }

    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const prompt = `You are an AI traffic analysis system. Analyze this traffic camera image and provide a detailed JSON response.

Count all visible vehicles and classify them. Also assess traffic density and check for emergency vehicles.

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "vehicle_count": <total number>,
  "car_count": <number of cars/SUVs/taxis>,
  "bike_count": <number of motorcycles/bicycles>,
  "bus_count": <number of buses>,
  "truck_count": <number of trucks/lorries>,
  "density_level": "<low|medium|high|critical>",
  "congestion_score": <0-100 percentage>,
  "suggested_signal_time": <15-65 seconds based on density>,
  "emergency_detected": <true|false>,
  "emergency_vehicle_type": "<ambulance|fire truck|police|null>",
  "ai_recommendation": "<brief actionable recommendation for traffic signal optimization>"
}

Rules:
- density_level: low (0-30%), medium (31-55%), high (56-80%), critical (81-100%)
- suggested_signal_time: proportional to congestion (low=15-25s, medium=25-40s, high=40-55s, critical=55-65s)
- If emergency vehicle detected, set emergency_detected=true and suggested_signal_time=60
- Be accurate with vehicle counts based on what's visible`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini API error:', err);
      return NextResponse.json(simulateAnalysis());
    }

    const geminiData = await response.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(simulateAnalysis());
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and sanitize
    const result = {
      vehicle_count: Math.max(0, parseInt(parsed.vehicle_count) || 0),
      car_count: Math.max(0, parseInt(parsed.car_count) || 0),
      bike_count: Math.max(0, parseInt(parsed.bike_count) || 0),
      bus_count: Math.max(0, parseInt(parsed.bus_count) || 0),
      truck_count: Math.max(0, parseInt(parsed.truck_count) || 0),
      density_level: ['low', 'medium', 'high', 'critical'].includes(parsed.density_level) ? parsed.density_level : 'medium',
      congestion_score: Math.min(100, Math.max(0, parseFloat(parsed.congestion_score) || 0)),
      suggested_signal_time: Math.min(65, Math.max(15, parseInt(parsed.suggested_signal_time) || 30)),
      emergency_detected: Boolean(parsed.emergency_detected),
      emergency_vehicle_type: parsed.emergency_vehicle_type || null,
      ai_recommendation: parsed.ai_recommendation || 'Standard traffic flow detected.',
      raw_ai_response: parsed,
      upload_id: uploadId || null,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(simulateAnalysis());
  }
}

function simulateAnalysis() {
  const density = Math.random();
  const congestion = Math.round(density * 100);
  const vehicle_count = Math.round(10 + density * 90);
  const car_count = Math.round(vehicle_count * 0.55);
  const bike_count = Math.round(vehicle_count * 0.22);
  const bus_count = Math.round(vehicle_count * 0.12);
  const truck_count = vehicle_count - car_count - bike_count - bus_count;
  const emergency = Math.random() < 0.1;

  let density_level: string;
  let signal: number;
  if (congestion <= 30) { density_level = 'low'; signal = 15 + Math.round(congestion / 3); }
  else if (congestion <= 55) { density_level = 'medium'; signal = 25 + Math.round((congestion - 30) * 0.6); }
  else if (congestion <= 80) { density_level = 'high'; signal = 40 + Math.round((congestion - 55) * 0.6); }
  else { density_level = 'critical'; signal = 55 + Math.round((congestion - 80) * 0.5); }

  if (emergency) signal = 60;

  return {
    vehicle_count,
    car_count,
    bike_count,
    bus_count,
    truck_count: Math.max(0, truck_count),
    density_level,
    congestion_score: congestion,
    suggested_signal_time: Math.min(65, signal),
    emergency_detected: emergency,
    emergency_vehicle_type: emergency ? ['ambulance', 'fire truck', 'police'][Math.floor(Math.random() * 3)] : null,
    ai_recommendation: emergency
      ? 'PRIORITY: Emergency vehicle detected. Override all signals for immediate clearance.'
      : density_level === 'critical'
      ? 'Critical congestion detected. Extend green signal to maximum duration and alert traffic authorities.'
      : density_level === 'high'
      ? 'Heavy traffic density. Extend green signal duration for this lane by 15-20 seconds.'
      : density_level === 'medium'
      ? 'Moderate traffic flow. Standard signal timing with minor adjustments recommended.'
      : 'Light traffic detected. Reduce signal time to improve overall junction throughput.',
    simulated: true,
  };
}
