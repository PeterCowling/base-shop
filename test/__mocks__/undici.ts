const { File, Blob, fetch, Headers, Request, Response } = globalThis as any;

class FormDataStub {
  private _map = new Map<string, any[]>();
  constructor(form?: HTMLFormElement) {
    if (form && form.elements) {
      Array.from(form.elements).forEach((el: any) => {
        const name = el.name;
        if (!name) return;
        if (el.type === 'file' && el.files) {
          Array.from(el.files as FileList).forEach((file) => this.append(name, file));
        } else {
          this.append(name, el.value);
        }
      });
    }
  }
  append(name: string, value: any) {
    const arr = this._map.get(name) || [];
    arr.push(value);
    this._map.set(name, arr);
  }
  set(name: string, value: any) {
    this._map.set(name, [value]);
  }
  get(name: string) {
    const arr = this._map.get(name);
    return arr ? arr[0] : undefined;
  }
  getAll(name: string) {
    return this._map.get(name) || [];
  }
  has(name: string) {
    return this._map.has(name);
  }
  delete(name: string) {
    this._map.delete(name);
  }
  forEach(callback: (value: any, name: string, form: FormDataStub) => void) {
    for (const [n, arr] of this._map) {
      for (const value of arr) callback(value, n, this);
    }
  }
  *entries() {
    for (const [n, arr] of this._map) {
      for (const value of arr) yield [n, value] as [string, any];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
}

export { File, Blob, fetch, Headers, Request, Response, FormDataStub as FormData };
export default { File, Blob, fetch, Headers, Request, Response, FormData: FormDataStub };
