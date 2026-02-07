/**
 * CheckInQR.tsx
 *
 * Component that displays the check-in QR code and human-readable code.
 * Staff can scan the QR or type the code to look up the guest.
 */

import { Copy, QrCode, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';
import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CheckInQRProps {
  /** The check-in code (e.g., "BRK-A7K9M") */
  code: string;
  /** Base URL for the check-in lookup (default: derived from window.location) */
  baseUrl?: string;
  /** Optional class name */
  className?: string;
}

/**
 * CheckInQR
 *
 * Displays a QR code and the human-readable check-in code.
 * The QR encodes the check-in URL that staff can scan.
 */
export const CheckInQR: FC<CheckInQRProps> = memo(function CheckInQR({
  code,
  baseUrl,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Generate the check-in URL
  const checkInUrl = baseUrl
    ? `${baseUrl}/checkin/${code}`
    : typeof window !== 'undefined'
      ? `${window.location.origin}/checkin/${code}`
      : `/checkin/${code}`;

  // Generate QR code on mount or when code changes
  useEffect(() => {
    async function generateQR() {
      try {
        const dataUrl = await QRCode.toDataURL(checkInUrl, {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataUrl(dataUrl);
        setQrError(false);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
        setQrError(true);
      }
    }

    void generateQR();
  }, [checkInUrl]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR Code */}
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        {qrDataUrl && !qrError ? (
          <img
            src={qrDataUrl}
            alt={t('checkIn.qrAlt', { code })}
            width={240}
            height={240}
            className="block"
          />
        ) : qrError ? (
          <div className="flex h-60 w-60 flex-col items-center justify-center bg-gray-100 text-gray-400">
            <QrCode className="mb-2 h-12 w-12" />
            <span className="text-sm">{t('checkIn.qrError')}</span>
          </div>
        ) : (
          <div className="flex h-60 w-60 items-center justify-center bg-gray-100">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}
      </div>

      {/* Human-readable code */}
      <div className="mt-6 text-center">
        <p className="mb-2 text-sm text-gray-500">{t('checkIn.yourCode')}</p>
        <button
          type="button"
          onClick={handleCopyCode}
          className="group flex items-center gap-3 rounded-xl bg-gray-100 px-6 py-3 transition-colors hover:bg-gray-200"
        >
          <span className="font-mono text-2xl font-bold tracking-wider text-gray-900">
            {code}
          </span>
          {copied ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
          )}
        </button>
        {copied && (
          <p className="mt-2 text-sm text-green-600">{t('checkIn.codeCopied')}</p>
        )}
      </div>
    </div>
  );
});

export default CheckInQR;
