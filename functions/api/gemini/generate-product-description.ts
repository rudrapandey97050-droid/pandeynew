interface Env {
  GEMINI_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { request, env } = context;
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          fallbackNeeded: true,
          error: "GEMINI_API_KEY is not configured in Cloudflare Pages environment variables."
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const body: any = await request.json();
    const {
      brand = "",
      model = "",
      storage = "",
      condition = "New",
      color = "",
      price = "",
      photoBase64 = "",
      url = ""
    } = body || {};

    const promptParts: any[] = [];

    if (photoBase64 && typeof photoBase64 === "string") {
      const match = photoBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        promptParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const textPrompt = `You are a certified smartphone hardware expert and retail catalog manager for "Pandey Mobile Store" located at Traffic Chowk, Butwal, Nepal (Contact: 9847460603).
Analyze this smartphone information, photo, or link:
- Given Brand: ${brand || "Detect automatically from image/link/name"}
- Given Model: ${model || "Detect precisely from image/link"}
- Storage Variant: ${storage || "Detect or specify standard Nepali retail options (e.g. 128GB, 256GB, 512GB)"}
- Physical Condition: ${condition || "New / Like New"}
- Color: ${color || "Detect or leave blank"}
- Price (NPR): ${price ? `Rs. ${price}` : "Market Rate"}
- Product Link / Reference: ${url || "None provided"}

TASK:
1. Precisely identify the exact smartphone brand and model. Never hallucinate.
2. Generate an accurate, comprehensive, and authentic product description and technical specification sheet for Pandey Mobile Store's storefront.
3. Include the following clear sections with emojis:
   - 📱 Overview & Key Tagline
   - ⚡ Detailed Technical Specifications:
     • Display: Panel type, size, resolution, refresh rate, peak brightness
     • Processor & RAM: Exact chipset name, GPU, RAM
     • Pro Camera System: Main sensor MP, Ultra-wide, Telephoto/Periscope zoom, Selfie camera, Video recording
     • Battery & Charging: Capacity in mAh, Fast charging wattage, Wireless charging
     • Build & Durability: Materials, IP rating
     • Connectivity & OS: 5G bands, Wi-Fi, Bluetooth, OS version
   - 🛡️ Pandey Mobile Store Trust Guarantee (Traffic Chowk, Butwal):
     • 100% Original & Genuine Device (Verified IMEI & NTA/MDMS Compliance)
     • ${condition === "Pre-Owned" ? "15 Days Store Testing Guarantee + 6 Months Service Warranty" : "1 Year Official Brand Warranty"}
     • Quality Tested by certified lab technicians in Butwal
     • Instant Spot Exchange / Trade-in accepted
   - 📦 In The Box contents
4. Return response matching JSON schema: { detectedBrand, detectedModel, suggestedStorage, suggestedColor, keyHighlights, description }`;

    promptParts.push({ text: textPrompt });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: promptParts }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API responded with status ${geminiRes.status}: ${errText}`);
    }

    const geminiData: any = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = {
        description: rawText,
        detectedBrand: brand,
        detectedModel: model
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "gemini-3.8-flash-edge",
        data: parsedData
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        fallbackNeeded: true,
        error: err?.message || "Cloudflare Function Gemini call failed"
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
