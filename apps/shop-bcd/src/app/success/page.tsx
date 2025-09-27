export default function Success() {
  return (
    <div className="container mx-auto py-20 text-center">
      {/* i18n-exempt: storefront success copy; translation to be provided via [lang] routes */}
      <h1 className="mb-4 text-3xl font-semibold">Thanks for your order!</h1>
      {/* i18n-exempt: storefront success copy; translation to be provided via [lang] routes */}
      <p>Your payment was received. Check your e-mail for the receipt.</p>
    </div>
  );
}
