export function formatNPR(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return 'NPR 0';
  return 'Rs. ' + amount.toLocaleString('en-IN');
}

/**
 * Ensures a WhatsApp number is cleanly formatted with Nepal country code (977)
 * and generates a standard https://wa.me/ link with optional message.
 */
export function formatWhatsAppUrl(rawPhoneOrWa?: string, message?: string): string {
  const digits = (rawPhoneOrWa || '9847460603').replace(/\D/g, '');
  const withCountry = digits.startsWith('977') ? digits : `977${digits}`;
  const base = `https://wa.me/${withCountry}`;
  if (message && message.trim()) {
    return `${base}?text=${encodeURIComponent(message.trim())}`;
  }
  return base;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function compressAndConvertImage(file: File, maxWidth = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = (error) => reject(error);
  });
}
