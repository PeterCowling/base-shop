import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { UploaderSurface } from './UploaderSurface';

function UploaderHarness() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPending] = useState<File | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPending(f);
    setError(undefined);
    if (f) {
      setProgress({ done: 0, total: f.size || 100 });
      // Fake progress
      let d = 0;
      const id = setInterval(() => {
        d += Math.max(1, Math.round((progress?.total || 100) / 10));
        setProgress((p) => ({ done: Math.min((p?.done || 0) + d, p?.total || 100), total: p?.total || 100 }));
        if ((d * 10) >= (f.size || 100)) clearInterval(id);
      }, 120);
    }
  };

  return (
    <UploaderSurface
      inputRef={inputRef}
      pendingFile={pendingFile}
      progress={progress}
      error={error}
      isValid={true}
      isVideo={false}
      requiredOrientation="landscape"
      onDrop={(e) => {
        e.preventDefault();
        setError(undefined);
        const f = e.dataTransfer.files?.[0] || null;
        setPending(f);
      }}
      onFileChange={onFileChange}
      openFileDialog={() => inputRef.current?.click()}
    />
  );
}

const meta: Meta<typeof UploaderSurface> = {
  title: 'Utilities/UploaderSurface',
  component: UploaderSurface,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Drag-and-drop surface with browse button, simple fake progress and validation samples.',
      },
    },
  },
};
export default meta;

export const Default: StoryObj<typeof UploaderSurface> = { render: () => <UploaderHarness /> };

