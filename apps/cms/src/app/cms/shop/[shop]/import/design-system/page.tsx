export default function DesignSystemImportPage() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Import Design System</h2>
      <p className="text-sm">Paste design tokens JSON or enter npm package name.</p>
      <p className="mt-2 text-xs">
        <a
          href="/docs/design-system-package-import"
          className="text-blue-600 hover:underline"
          target="_blank"
        >
          Package import guide
        </a>{" "}
        and{" "}
        <a
          href="/docs/theme-lifecycle-and-library"
          className="text-blue-600 hover:underline"
          target="_blank"
        >
          theme library tips
        </a>
        .
      </p>
    </div>
  );
}
