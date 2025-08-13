import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';

interface Change {
  file: string;
  componentName: string;
}

async function loadChanges(): Promise<Change[]> {
  try {
    const root = resolve(process.cwd(), '..', '..');
    const data = await fs.readFile(join(root, 'upgrade-changes.json'), 'utf8');
    return JSON.parse(data) as Change[];
  } catch {
    return [];
  }
}

export default async function UpgradePreviewPage() {
  const changes = await loadChanges();
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Upgrade Preview</h1>
      {changes.length === 0 ? (
        <p>No component changes detected.</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {changes.map((c) => (
            <li key={c.file}>
              <strong>{c.componentName}</strong> – {c.file}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
