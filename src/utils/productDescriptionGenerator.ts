/**
 * Product Description & Specifications Generator
 * Automatically generates professional e-commerce descriptions, specifications,
 * and warranty details from product links, image URLs, uploaded photo filenames,
 * or selected device models.
 */

export interface GeneratedProductInfo {
  description: string;
  detectedBrand?: string;
  detectedModel?: string;
  detectedStorage?: string;
  specs?: {
    display?: string;
    processor?: string;
    camera?: string;
    battery?: string;
    charging?: string;
    security?: string;
    os?: string;
  };
}

// Known device database with key specs
const KNOWN_DEVICES: Record<string, {
  brand: string;
  officialName: string;
  tagline: string;
  display: string;
  chipset: string;
  camera: string;
  battery: string;
  charging: string;
  defaultStorage: string;
  category: string;
}> = {
  // Apple Lineup
  'iphone 16 pro max': {
    brand: 'Apple',
    officialName: 'iPhone 16 Pro Max',
    tagline: 'Titanium. So strong. So light. Built for Apple Intelligence.',
    display: '6.9-inch Super Retina XDR OLED, 120Hz ProMotion, Ceramic Shield',
    chipset: 'Apple A18 Pro Bionic (3nm, 6-core GPU with Ray Tracing)',
    camera: 'Triple 48MP Fusion + 48MP Ultra-Wide + 12MP 5x Telephoto, 4K120fps Dolby Vision',
    battery: '4685 mAh all-day battery life (up to 33 hours video playback)',
    charging: 'MagSafe 25W fast charging, USB-C 3.0 (up to 10Gb/s)',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'iphone 16 pro': {
    brand: 'Apple',
    officialName: 'iPhone 16 Pro',
    tagline: 'Titanium design with Camera Control and A18 Pro chip.',
    display: '6.3-inch Super Retina XDR OLED, 120Hz ProMotion, Always-On Display',
    chipset: 'Apple A18 Pro Bionic (3nm, 16-core Neural Engine)',
    camera: '48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto with Camera Control',
    battery: '3582 mAh (up to 27 hours video playback)',
    charging: 'Fast charging via USB-C and MagSafe 25W wireless',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 16': {
    brand: 'Apple',
    officialName: 'iPhone 16',
    tagline: 'Hello, Apple Intelligence. Camera Control and 48MP Fusion camera.',
    display: '6.1-inch Super Retina XDR OLED, 2000 nits peak outdoor brightness',
    chipset: 'Apple A18 (3nm generation, 5-core GPU)',
    camera: '48MP 2-in-1 Fusion Camera + 12MP Ultra-Wide with Macro photography',
    battery: '3561 mAh (up to 22 hours video playback)',
    charging: 'Fast charge 50% in 30 minutes via USB-C, MagSafe',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 16 plus': {
    brand: 'Apple',
    officialName: 'iPhone 16 Plus',
    tagline: 'Supersized 6.7-inch display with incredible battery endurance.',
    display: '6.7-inch Super Retina XDR OLED, Ceramic Shield (latest gen)',
    chipset: 'Apple A18 chip with 16-core Neural Engine',
    camera: '48MP Fusion Camera + 12MP Ultra-Wide with Spatial Capture',
    battery: '4674 mAh (up to 27 hours video playback)',
    charging: 'USB-C fast charging + MagSafe 25W',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 15 pro max': {
    brand: 'Apple',
    officialName: 'iPhone 15 Pro Max',
    tagline: 'Forged in aerospace-grade Titanium with A17 Pro game-changing chip.',
    display: '6.7-inch Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
    chipset: 'Apple A17 Pro (3nm, hardware-accelerated Ray Tracing)',
    camera: '48MP Main + 12MP Ultra-Wide + 12MP 5x Optical Periscope Zoom',
    battery: '4422 mAh (up to 29 hours video playback)',
    charging: 'USB-C 3.0, 20W wired fast charge, 15W MagSafe',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'iphone 15 pro': {
    brand: 'Apple',
    officialName: 'iPhone 15 Pro',
    tagline: 'Titanium design with customizable Action Button & A17 Pro power.',
    display: '6.1-inch Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
    chipset: 'Apple A17 Pro (3nm flagship chip)',
    camera: '48MP Main + 12MP Ultra-Wide + 12MP 3x Telephoto',
    battery: '3274 mAh all-day battery life',
    charging: 'USB-C 3.0, MagSafe 15W',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 15': {
    brand: 'Apple',
    officialName: 'iPhone 15',
    tagline: 'Dynamic Island, 48MP Main camera, and durable color-infused glass.',
    display: '6.1-inch Super Retina XDR OLED, 2000 nits outdoor brightness',
    chipset: 'Apple A16 Bionic (4nm)',
    camera: '48MP Main with 2x Telephoto + 12MP Ultra-Wide',
    battery: '3349 mAh all-day battery',
    charging: 'USB-C universal charging, MagSafe 15W',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 14 pro max': {
    brand: 'Apple',
    officialName: 'iPhone 14 Pro Max',
    tagline: 'A magical new way to interact with iPhone with Dynamic Island.',
    display: '6.7-inch Super Retina XDR OLED, 120Hz ProMotion, Always-On',
    chipset: 'Apple A16 Bionic (4nm)',
    camera: '48MP Main + 12MP Ultra-Wide + 12MP 3x Telephoto',
    battery: '4323 mAh long endurance battery',
    charging: 'Lightning fast charge, MagSafe 15W',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 14': {
    brand: 'Apple',
    officialName: 'iPhone 14',
    tagline: 'Big and bigger OLED displays, Crash Detection, and dual camera system.',
    display: '6.1-inch Super Retina XDR OLED',
    chipset: 'Apple A15 Bionic (5-core GPU)',
    camera: '12MP Dual Camera with Photonic Engine & Action Mode',
    battery: '3279 mAh battery',
    charging: 'Lightning 20W fast charging',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 13': {
    brand: 'Apple',
    officialName: 'iPhone 13',
    tagline: 'Cinematic mode, durable Ceramic Shield, and super-bright OLED.',
    display: '6.1-inch Super Retina XDR OLED',
    chipset: 'Apple A15 Bionic (6-core CPU)',
    camera: '12MP Dual Diagonal Camera System with sensor-shift OIS',
    battery: '3227 mAh long-lasting battery',
    charging: 'Fast charge 50% in 30 min, MagSafe',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'iphone 12': {
    brand: 'Apple',
    officialName: 'iPhone 12',
    tagline: '5G speed, A14 Bionic, and beautiful Super Retina XDR OLED display.',
    display: '6.1-inch Super Retina XDR OLED, Ceramic Shield front',
    chipset: 'Apple A14 Bionic (5nm)',
    camera: '12MP Ultra Wide and Wide cameras with Night mode on all cameras',
    battery: '2815 mAh battery',
    charging: 'Fast charging, MagSafe wireless',
    defaultStorage: '64GB',
    category: 'Smartphone'
  },
  'iphone 11': {
    brand: 'Apple',
    officialName: 'iPhone 11',
    tagline: 'Dual-camera system with Ultra Wide. Night mode and all-day battery.',
    display: '6.1-inch Liquid Retina HD IPS LCD',
    chipset: 'Apple A13 Bionic (7nm+)',
    camera: '12MP Wide + 12MP Ultra-Wide, 4K 60fps video',
    battery: '3110 mAh all-day battery',
    charging: '18W fast charge, Qi wireless charging',
    defaultStorage: '64GB',
    category: 'Smartphone'
  },

  // Samsung Lineup
  'galaxy s24 ultra': {
    brand: 'Samsung',
    officialName: 'Samsung Galaxy S24 Ultra',
    tagline: 'Galaxy AI is here. Titanium exterior with built-in S Pen & 200MP camera.',
    display: '6.8-inch Dynamic AMOLED 2X, 120Hz, 2600 nits, Gorilla Armor Anti-Reflective',
    chipset: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy (4nm)',
    camera: '200MP Main + 50MP 5x Periscope + 10MP 3x Telephoto + 12MP Ultra-Wide',
    battery: '5000 mAh with intelligent battery optimization',
    charging: '45W wired fast charging, 15W wireless, Wireless PowerShare',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'galaxy s24': {
    brand: 'Samsung',
    officialName: 'Samsung Galaxy S24',
    tagline: 'Pocket-sized powerhouse packed with full Galaxy AI features.',
    display: '6.2-inch Dynamic AMOLED 2X, 1-120Hz LTPO, 2600 nits',
    chipset: 'Exynos 2400 / Snapdragon 8 Gen 3',
    camera: '50MP Main with OIS + 10MP 3x Telephoto + 12MP Ultra-Wide',
    battery: '4000 mAh battery',
    charging: '25W fast charge, 15W wireless',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },
  'galaxy s23 ultra': {
    brand: 'Samsung',
    officialName: 'Samsung Galaxy S23 Ultra',
    tagline: 'Epic 200MP Nightography and Snapdragon 8 Gen 2 gaming performance.',
    display: '6.8-inch Dynamic AMOLED 2X, 120Hz curved display, 1750 nits',
    chipset: 'Qualcomm Snapdragon 8 Gen 2 for Galaxy (4nm)',
    camera: '200MP Main + 10MP 10x Optical Periscope + 10MP 3x Telephoto + 12MP Ultra-Wide',
    battery: '5000 mAh high-capacity battery',
    charging: '45W fast charge, 15W wireless',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'galaxy z fold 6': {
    brand: 'Samsung',
    officialName: 'Samsung Galaxy Z Fold 6',
    tagline: 'Ultra-slim foldable display powered by Galaxy AI and Snapdragon 8 Gen 3.',
    display: '7.6-inch Dynamic AMOLED 2X Foldable + 6.3-inch Cover Screen, 120Hz',
    chipset: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy',
    camera: '50MP Triple Pro-grade Camera with 3x Optical Zoom',
    battery: '4400 mAh dual-cell battery',
    charging: '25W wired fast charge, 15W wireless',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },

  // Vivo Lineup
  'vivo v40 pro': {
    brand: 'Vivo',
    officialName: 'Vivo V40 Pro 5G',
    tagline: 'ZEISS All Main Camera flagship portrait specialist.',
    display: '6.78-inch 1.5K 3D Curved AMOLED, 120Hz, 4500 nits local peak',
    chipset: 'MediaTek Dimensity 9200+ (4nm)',
    camera: '50MP ZEISS Main with OIS + 50MP ZEISS Telephoto + 50MP ZEISS Ultra-Wide + 50MP Selfie',
    battery: '5500 mAh BlueVolt Silicon-Carbon Battery',
    charging: '80W FlashCharge, IP68/IP69 water & dust resistance',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'vivo v40': {
    brand: 'Vivo',
    officialName: 'Vivo V40 5G',
    tagline: 'Ultra-slim 5500mAh design with ZEISS Co-engineered optics.',
    display: '6.78-inch 1.5K AMOLED, 120Hz, 4500 nits peak',
    chipset: 'Qualcomm Snapdragon 7 Gen 3 (4nm)',
    camera: '50MP ZEISS OIS Main + 50MP ZEISS Ultra-Wide + 50MP AF Selfie',
    battery: '5500 mAh battery with ultra-thin 7.58mm body',
    charging: '80W FlashCharge, IP68 rating',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },

  // POCO Lineup
  'poco f6 pro': {
    brand: 'POCO',
    officialName: 'POCO F6 Pro 5G',
    tagline: 'HyperPower Evolved: WQHD+ 120Hz Flow AMOLED with Snapdragon 8 Gen 2.',
    display: '6.67-inch WQHD+ 120Hz Flow AMOLED, 4000 nits peak brightness, 3840Hz PWM',
    chipset: 'Qualcomm Snapdragon 8 Gen 2 Flagship Chip (4nm)',
    camera: '50MP Light Fusion 800 with OIS + 8MP Ultra-Wide + 2MP Macro',
    battery: '5000 mAh high-density battery',
    charging: '120W HyperCharge (100% in 19 minutes)',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'poco f6': {
    brand: 'POCO',
    officialName: 'POCO F6 5G',
    tagline: 'Shaped by speed: Snapdragon 8s Gen 3 flagship killer.',
    display: '6.67-inch 1.5K CrystalRes 120Hz Flow AMOLED, Gorilla Glass Victus',
    chipset: 'Qualcomm Snapdragon 8s Gen 3 (4nm TSMC)',
    camera: '50MP Sony IMX882 with OIS + 8MP Ultra-Wide',
    battery: '5000 mAh battery',
    charging: '90W Turbo Charge (In-box charger included)',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },

  // Redmi Lineup
  'redmi note 13 pro+': {
    brand: 'Redmi',
    officialName: 'Redmi Note 13 Pro+ 5G',
    tagline: 'Super-clear 200MP OIS camera with 1.5K curved AMOLED & IP68.',
    display: '6.67-inch 1.5K 120Hz Curved AMOLED, Gorilla Glass Victus',
    chipset: 'MediaTek Dimensity 7200-Ultra (4nm)',
    camera: '200MP Main with OIS & 4x In-sensor Zoom + 8MP Ultra-Wide + 2MP Macro',
    battery: '5000 mAh battery',
    charging: '120W HyperCharge (100% in ~19 minutes)',
    defaultStorage: '256GB',
    category: 'Smartphone'
  },
  'redmi note 13': {
    brand: 'Redmi',
    officialName: 'Redmi Note 13',
    tagline: '108MP Super-clear Triple camera with ultra-thin bezel 120Hz AMOLED.',
    display: '6.67-inch FHD+ 120Hz AMOLED, 1800 nits peak',
    chipset: 'Snapdragon 685 (6nm)',
    camera: '108MP Main camera + 8MP Ultra-Wide + 2MP Macro',
    battery: '5000 mAh with 33W Fast Charging',
    charging: '33W Fast charging via Type-C',
    defaultStorage: '128GB',
    category: 'Smartphone'
  },

  // HONOR Lineup
  'honor 200 pro': {
    brand: 'HONOR',
    officialName: 'HONOR 200 Pro 5G',
    tagline: 'The Portrait Master with Studio Harcourt Paris co-engineered cameras.',
    display: '6.78-inch Quad-Curved AMOLED, 120Hz, 4000 nits, 3840Hz Risk-Free PWM',
    chipset: 'Qualcomm Snapdragon 8s Gen 3 (4nm)',
    camera: '50MP H9000 OIS Main + 50MP Sony IMX856 2.5x Telephoto + 12MP Ultra-Wide',
    battery: '5200 mAh Silicon-Carbon Battery',
    charging: '100W Wired SuperCharge + 66W Wireless SuperCharge',
    defaultStorage: '512GB',
    category: 'Smartphone'
  },

  // Accessories
  'apple 20w usb-c power adapter': {
    brand: 'Accessories',
    officialName: 'Apple 20W USB-C Power Adapter',
    tagline: 'Original Apple 20W Fast Charger with 100% genuine warranty.',
    display: 'N/A (Charger)',
    chipset: 'Apple Smart Power Delivery Protocol',
    camera: 'N/A',
    battery: 'N/A',
    charging: '20W USB Power Delivery (USB-PD) Fast Charging',
    defaultStorage: '20W Adapter',
    category: 'Accessories'
  },
  'airpods pro 2': {
    brand: 'Accessories',
    officialName: 'Apple AirPods Pro (2nd Generation) USB-C',
    tagline: 'Active Noise Cancellation, Adaptive Audio, and Hearing Health.',
    display: 'N/A',
    chipset: 'Apple H2 Headphone Chip + Apple U1 in MagSafe Case',
    camera: 'N/A',
    battery: 'Up to 6 hours listening time (up to 30 hours with MagSafe Case)',
    charging: 'USB-C, MagSafe, Apple Watch charger, and Qi-certified',
    defaultStorage: 'Standard',
    category: 'Accessories'
  }
};

/**
 * Parses any link (webpage or image) or filename to detect device name & brand
 */
export function extractModelFromUrlOrFilename(input: string): {
  brand?: string;
  model?: string;
  storage?: string;
} {
  if (!input) return {};

  const clean = decodeURIComponent(input)
    .replace(/[_\-+/\\.?=&#]/g, ' ')
    .toLowerCase();

  // Storage detection
  let detectedStorage: string | undefined;
  if (clean.includes('1tb') || clean.includes('1 tb')) detectedStorage = '1TB';
  else if (clean.includes('512gb') || clean.includes('512 gb')) detectedStorage = '512GB';
  else if (clean.includes('256gb') || clean.includes('256 gb')) detectedStorage = '256GB';
  else if (clean.includes('128gb') || clean.includes('128 gb')) detectedStorage = '128GB';
  else if (clean.includes('64gb') || clean.includes('64 gb')) detectedStorage = '64GB';

  // Check known devices directly
  for (const [key, dev] of Object.entries(KNOWN_DEVICES)) {
    if (clean.includes(key)) {
      return {
        brand: dev.brand,
        model: dev.officialName.replace(dev.brand, '').trim(),
        storage: detectedStorage || dev.defaultStorage
      };
    }
  }

  // Generic heuristic regex matching for iPhones
  const iphoneMatch = clean.match(/iphone\s*(1[1-7]|se)\s*(pro\s*max|pro|plus|mini)?/i);
  if (iphoneMatch) {
    const gen = iphoneMatch[1];
    const sub = iphoneMatch[2] ? ` ${iphoneMatch[2]}` : '';
    const fullModel = `iPhone ${gen}${sub}`.replace(/\s+/g, ' ').trim();
    return {
      brand: 'Apple',
      model: fullModel,
      storage: detectedStorage || '128GB'
    };
  }

  // Generic heuristic for Samsung Galaxy
  const galaxyMatch = clean.match(/(s2[1-5]|z\s*fold\s*[4-6]|z\s*flip\s*[4-6]|a[35][45])\s*(ultra|plus|\+)?/i);
  if (galaxyMatch) {
    const mod = galaxyMatch[1].toUpperCase();
    const sub = galaxyMatch[2] ? ` ${galaxyMatch[2].toUpperCase()}` : '';
    return {
      brand: 'Samsung',
      model: `Galaxy ${mod}${sub}`.trim(),
      storage: detectedStorage || '256GB'
    };
  }

  return { storage: detectedStorage };
}

/**
 * Generates an attractive, professional description for the product
 */
export function generateProductDescription(params: {
  brand?: string;
  model?: string;
  storage?: string;
  condition?: string;
  batteryHealth?: string;
  warranty?: string;
  url?: string;
  fileName?: string;
}): GeneratedProductInfo {
  const { brand, model, storage, condition, batteryHealth, warranty, url, fileName } = params;

  // Attempt to parse info from URL or Filename if model is incomplete
  let effectiveBrand = brand || 'Apple';
  let effectiveModel = (model || '').trim();
  let effectiveStorage = storage || '128GB';

  if (!effectiveModel && (url || fileName)) {
    const extracted = extractModelFromUrlOrFilename((url || '') + ' ' + (fileName || ''));
    if (extracted.model) {
      effectiveModel = extracted.model;
    }
    if (extracted.brand) {
      effectiveBrand = extracted.brand;
    }
    if (extracted.storage && (!storage || storage === '128GB')) {
      effectiveStorage = extracted.storage;
    }
  }

  const lookupKey = `${effectiveBrand} ${effectiveModel}`.toLowerCase().replace(/\s+/g, ' ').trim();
  const matchedDevice = Object.entries(KNOWN_DEVICES).find(([k]) => lookupKey.includes(k) || k.includes(lookupKey))?.[1];

  const displayName = matchedDevice ? matchedDevice.officialName : `${effectiveBrand} ${effectiveModel || 'Smartphone'}`.trim();
  const isBrandNew = condition === 'New' || !condition || condition.toLowerCase().includes('sealed');
  const conditionLabel = isBrandNew ? 'Brand New Sealed Pack' : (condition || 'Certified Pre-Owned (Grade A)');
  const effectiveWarranty = warranty || (isBrandNew ? '1 Year Official Brand Warranty' : '15 Days Store Testing Warranty');

  const displaySpec = matchedDevice?.display || 'Super Retina / Dynamic AMOLED High Refresh Display';
  const chipSpec = matchedDevice?.chipset || 'Flagship high-performance octa-core processor';
  const camSpec = matchedDevice?.camera || 'Pro-grade high-resolution camera system with OIS & 4K video';
  const batterySpec = matchedDevice?.battery || 'All-day endurance battery';
  const chargingSpec = matchedDevice?.charging || 'High-speed fast charging supported';

  // Build structured, high-conversion marketing description
  const lines: string[] = [];

  // Title / Tagline
  lines.push(`📱 ${displayName} (${effectiveStorage}) - ${conditionLabel}`);
  if (matchedDevice?.tagline) {
    lines.push(`⭐ "${matchedDevice.tagline}"`);
  }
  lines.push('');

  // Key Specifications
  lines.push('📋 Key Specifications & Highlights:');
  lines.push(`• Display: ${displaySpec}`);
  lines.push(`• Performance: ${chipSpec}`);
  lines.push(`• Camera: ${camSpec}`);
  lines.push(`• Battery & Power: ${batterySpec} (${chargingSpec})`);
  lines.push(`• Storage: ${effectiveStorage}`);
  if (!isBrandNew && batteryHealth) {
    lines.push(`• Battery Health: ${batteryHealth}`);
  }
  lines.push('');

  // Pandey Mobile Store Quality & Trust Guarantee
  lines.push('🛡️ Pandey Mobile Store Trust Guarantee:');
  lines.push(`• Warranty: ${effectiveWarranty}`);
  lines.push('• Authenticity: 100% Genuine, PTA / MDMS / NTA compliance verified');
  lines.push('• Testing: Rigorously inspected by Chief Lab Technicians at Traffic Chowk, Butwal');
  lines.push('• Exchange: Instant spot valuation and exchange available for your old device');
  lines.push('');

  // Box Contents
  lines.push('📦 Package Contents:');
  if (isBrandNew) {
    lines.push(`• Original Factory Sealed ${displayName} Box`);
    lines.push('• Official USB-C / Lightning Charging Cable');
    lines.push('• SIM Ejector Pin & Documentation');
    lines.push('• Official Pandey Mobile Store VAT / Warranty Bill');
  } else {
    lines.push(`• Certified ${displayName} Handset`);
    lines.push('• Premium Fast Charging Cable');
    lines.push('• Pandey Mobile Store Warranty Card & Purchase Receipt');
  }

  return {
    description: lines.join('\n'),
    detectedBrand: matchedDevice?.brand || effectiveBrand,
    detectedModel: matchedDevice ? matchedDevice.officialName.replace(matchedDevice.brand, '').trim() : effectiveModel,
    detectedStorage: effectiveStorage,
    specs: {
      display: displaySpec,
      processor: chipSpec,
      camera: camSpec,
      battery: batterySpec,
      charging: chargingSpec
    }
  };
}
