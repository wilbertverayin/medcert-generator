import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const PLACEHOLDER = 'https://placehold.co/150x150.png';

export function useQrCode(url: string): string {
  const [dataUrl, setDataUrl] = useState(PLACEHOLDER);

  useEffect(() => {
    if (!url) {
      setDataUrl(PLACEHOLDER);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(url, { width: 250, margin: 1 })
      .then((result) => {
        if (!cancelled) setDataUrl(result);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(PLACEHOLDER);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return dataUrl;
}
