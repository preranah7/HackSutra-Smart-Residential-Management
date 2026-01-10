// src/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateBillWithAI(rentalData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert billing assistant for residential properties in India. Calculate the monthly bill accurately.

PROPERTY DETAILS:
- Monthly Rent: ₹${rentalData.monthlyRent}
- Maintenance Charges: ₹${rentalData.maintenanceCharges}
- Number of Parking Slots: ${rentalData.parkingSlots} (₹500 per slot)
- Water Usage: ${rentalData.waterUsage || 0} units @ ₹${rentalData.waterRate || 5}/unit
- Electricity Usage: ${rentalData.electricityUsage || 0} units @ ₹${rentalData.electricityRate || 8}/unit
- Additional Charges: ₹${rentalData.additionalCharges || 0}
- Discount: ₹${rentalData.discount || 0}

BILLING PERIOD: ${rentalData.month}
PREVIOUS MONTH STATUS: ${rentalData.lastMonthStatus || 'paid'}
PREVIOUS BALANCE: ₹${rentalData.previousBalance || 0}

CALCULATION RULES:
1. If last month payment was late (overdue), add 2% late fee on previous balance
2. If last month payment was on time and this month is paid within 5 days, give 1% early payment discount
3. Round all amounts to nearest rupee (no decimals)
4. GST is already included in maintenance charges
5. Calculate parking as: parkingSlots × 500
6. Water charges: waterUsage × waterRate
7. Electricity charges: electricityUsage × electricityRate

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "rent": number,
  "maintenance": number,
  "parking": number,
  "water": number,
  "electricity": number,
  "additionalCharges": number,
  "lateFee": number,
  "discount": number,
  "subtotal": number,
  "total": number,
  "breakdown": "Detailed itemized description of all charges"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const billData = JSON.parse(cleanText);


    if (!billData.total || typeof billData.total !== 'number') {
      throw new Error('Invalid AI response');
    }

    return billData;
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Fallback to manual calculation if AI fails
    console.log('Using fallback calculation...');
    
    const rent = rentalData.monthlyRent;
    const maintenance = rentalData.maintenanceCharges;
    const parking = rentalData.parkingSlots * 500;
    const water = rentalData.waterUsage * (rentalData.waterRate || 5);
    const electricity = rentalData.electricityUsage * (rentalData.electricityRate || 8);
    const additionalCharges = rentalData.additionalCharges || 0;
    
    let lateFee = 0;
    if (rentalData.lastMonthStatus === 'overdue' && rentalData.previousBalance > 0) {
      lateFee = Math.round(rentalData.previousBalance * 0.02);
    }
    
    const discount = rentalData.discount || 0;
    const subtotal = rent + maintenance + parking + water + electricity + additionalCharges + lateFee;
    const total = subtotal - discount;

    return {
      rent,
      maintenance,
      parking,
      water,
      electricity,
      additionalCharges,
      lateFee,
      discount,
      subtotal,
      total,
      breakdown: `Rent: ₹${rent} + Maintenance: ₹${maintenance} + Parking (${rentalData.parkingSlots} slots): ₹${parking} + Water (${rentalData.waterUsage} units): ₹${water} + Electricity (${rentalData.electricityUsage} units): ₹${electricity}${additionalCharges > 0 ? ` + Additional: ₹${additionalCharges}` : ''}${lateFee > 0 ? ` + Late Fee: ₹${lateFee}` : ''}${discount > 0 ? ` - Discount: ₹${discount}` : ''} = Total: ₹${total}`
    };
  }
}

