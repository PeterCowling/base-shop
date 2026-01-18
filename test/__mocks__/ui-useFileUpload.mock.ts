// Minimal mock for packages/ui/src/hooks/useFileUpload used by PageBuilder tests
const useFileUpload = (_: unknown) => {
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
  } as const;
};

export { useFileUpload };
export default useFileUpload;
