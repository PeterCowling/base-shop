// packages/platform-core/src/plugins/PluginManager.ts
import type {
  PaymentPayload,
  PaymentProvider,
  Plugin,
  ShippingProvider,
  ShippingRequest,
  WidgetComponent,
  WidgetProps,
} from "@acme/types";

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

export interface PluginMetadata<T extends Plugin = Plugin> {
  id: string;
  name?: string;
  description?: string;
  plugin: T;
}

export class PluginManager<
  PPay = PaymentPayload,
  SReq = ShippingRequest,
  WProp = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
> {
  readonly payments = new MapRegistry<P>();
  readonly shipping = new MapRegistry<S>();
  readonly widgets = new MapRegistry<W>();
  private plugins = new Map<
    string,
    PluginMetadata<Plugin<Record<string, unknown>, PPay, SReq, WProp, P, S, W>>
  >();

  addPlugin<C>(plugin: Plugin<C, PPay, SReq, WProp, P, S, W>): void {
    this.plugins.set(plugin.id, {
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      plugin,
    });
  }

  getPlugin(
    id: string,
  ):
    | PluginMetadata<
        Plugin<Record<string, unknown>, PPay, SReq, WProp, P, S, W>
      >
    | undefined {
    return this.plugins.get(id);
  }

  listPlugins(): PluginMetadata<
    Plugin<Record<string, unknown>, PPay, SReq, WProp, P, S, W>
  >[] {
    return Array.from(this.plugins.values());
  }
}

export { MapRegistry as Registry };
