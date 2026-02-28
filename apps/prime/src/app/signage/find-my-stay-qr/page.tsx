import { QrCode } from 'lucide-react';

export default function FindMyStayQRPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-card p-8">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">
          Find Your Stay
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          Scan this QR code to access your booking
        </p>
        <div className="mx-auto mb-8 flex h-64 w-64 items-center justify-center rounded-xl bg-muted">
          <QrCode className="h-32 w-32 text-muted-foreground" />
        </div>
        <p className="text-lg text-muted-foreground">
          Or visit: prime.example.com/find-my-stay
        </p>
      </div>
    </main>
  );
}
