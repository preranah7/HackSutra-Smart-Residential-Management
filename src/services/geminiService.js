// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateBillWithAI(rentalData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
You are a billing assistant for a residential society. Calculate the monthly bill based on:

Rental Details:
- Monthly Rent: ₹${rentalData.monthlyRent}
- Maintenance Charges: ₹${rentalData.maintenanceCharges}
- Number of Parking Slots: ${rentalData.parkingSlots} (₹500 per slot)
- Water Usage: ${rentalData.waterUsage || 0} liters (₹5 per liter)
- Electricity Usage: ${rentalData.electricityUsage || 0} units (₹8 per unit)

Month: ${rentalData.month}
Previous Balance: ₹${rentalData.previousBalance || 0}
Payment Status Last Month: ${rentalData.lastMonthStatus || 'paid'}

Rules:
- If last month was paid late, add 2% late fee
- If payment is early this month, give 1% discount
- Round all amounts to nearest rupee

Return ONLY a JSON object with this exact structure (no markdown, no extra text):
{
  "rent": number,
  "maintenance": number,
  "parking": number,
  "water": number,
  "electricity": number,
  "lateFee": number,
  "discount": number,
  "subtotal": number,
  "total": number,
  "breakdown": "itemized description string"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse response
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const billData = JSON.parse(cleanText);
    
    return billData;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate bill with AI');
  }
}

export async function categorizeComplaint(complaintData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
You are a maintenance categorization assistant. Analyze this complaint:

Description: ${complaintData.description}
Location: ${complaintData.location || 'Not specified'}

Categorize and prioritize this complaint:

Categories: plumbing, electrical, carpentry, cleaning, lift, painting, security, other
Priority: low, medium, high, emergency

Rules for Priority:
- emergency: Safety risk, no water/electricity, lift stuck with people
- high: Major inconvenience, affects daily living
- medium: Needs attention but not urgent
- low: Minor cosmetic or non-essential

Return ONLY a JSON object (no markdown):
{
  "category": "exact category from list",
  "priority": "exact priority from list",
  "estimatedTime": "time to fix (e.g., '2 hours', '1 day')",
  "suggestedAction": "brief action needed",
  "assignTo": "type of worker needed (e.g., 'plumber', 'electrician')"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(cleanText);
    
    return analysis;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze complaint with AI');
  }
}