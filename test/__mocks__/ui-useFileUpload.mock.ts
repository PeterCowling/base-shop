// Minimal mock for packages/ui/src/hooks/useFileUpload used by PageBuilder tests
export default function useFileUpload(_: any) {
  return {
    onDrop: jest.fn(),
    progress: null,
    isValid: true,
    pendingFile: null,
    altText: "",
    setAltText: jest.fn(),
    tags: "",
    setTags: jest.fn(),
    actual: null,
    error: undefined,
    handleUpload: jest.fn(),
    inputRef: { current: null },
    openFileDialog: jest.fn(),
    onFileChange: jest.fn(),
    uploader: null,
  } as any;
}

export const useFileUpload = useFileUpload;
