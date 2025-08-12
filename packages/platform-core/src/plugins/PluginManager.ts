// packages/platform-core/src/plugins/PluginManager.ts
export interface RegistryItem<T> {
  id: string;
  value: T;
}

class MapRegistry<T> {
  private items = new Map<string, T>();

  add(id: string, item: T): void {
    this.items.set(id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  list(): RegistryItem<T>[] {
    return Array.from(this.items.entries()).map(([id, value]) => ({ id, value }));
  }
}

export interface PluginMetadata {
  id: string;
  name?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin: any;
}

export class PluginManager<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  W = any,
> {
  readonly payments = new MapRegistry<P>();
  readonly shipping = new MapRegistry<S>();
  readonly widgets = new MapRegistry<W>();
  private plugins = new Map<string, PluginMetadata>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addPlugin(plugin: { id: string; name?: string; description?: string } & any): void {
    this.plugins.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      plugin,
    });
  }

  getPlugin(id: string): PluginMetadata | undefined {
    return this.plugins.get(id);
  }

  listPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }
}

export { MapRegistry as Registry };
