import { useState, type ChangeEvent } from "react";

export interface FileSelectorProps {
  onFilesSelected?: (files: File[]) => void;
  multiple?: boolean;
}

export function FileSelector({ onFilesSelected, multiple = false }: FileSelectorProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    onFilesSelected?.(selected);
  };

  return (
    <div>
      <input type="file" multiple={multiple} onChange={handleChange} data-testid="file-input" />
      {files.length > 0 && (
        <ul>
          {files.map((file) => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileSelector;
