declare global {
  interface Headers {
    getAll(name: string): string[];
  }
}

export {};
