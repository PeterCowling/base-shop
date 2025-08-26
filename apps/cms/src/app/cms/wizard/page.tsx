// Temporary page used for testing the wizard route. In the real application this
// route redirects to the configurator, but for unit tests we render a simple
// placeholder so server rendering can be verified without pulling in the entire
// configurator implementation.

export default function WizardPage() {
  return <h2>Shop Details</h2>;
}
