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

export interface PluginMetadata<
  C extends Record<string, unknown> = Record<string, unknown>,
  PPay extends PaymentPayload = PaymentPayload,
  SReq extends ShippingRequest = ShippingRequest,
  WProp extends WidgetProps = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
> {
  id: string;
  name?: string;
  description?: string;
  plugin: Plugin<C, PPay, SReq, WProp, P, S, W>;
}

export class PluginManager<
  PPay extends PaymentPayload = PaymentPayload,
  SReq extends ShippingRequest = ShippingRequest,
  WProp extends WidgetProps = WidgetProps,
  P extends PaymentProvider<PPay> = PaymentProvider<PPay>,
  S extends ShippingProvider<SReq> = ShippingProvider<SReq>,
  W extends WidgetComponent<WProp> = WidgetComponent<WProp>,
> {
  readonly payments = new MapRegistry<P>();
  readonly shipping = new MapRegistry<S>();
  readonly widgets = new MapRegistry<W>();
  private plugins = new Map<
    string,
    PluginMetadata<Record<string, unknown>, PPay, SReq, WProp, P, S, W>
  >();

  addPlugin<C extends Record<string, unknown>>(
    plugin: Plugin<C, PPay, SReq, WProp, P, S, W>,
  ): void {
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
    | PluginMetadata<Record<string, unknown>, PPay, SReq, WProp, P, S, W>
    | undefined {
    return this.plugins.get(id);
  }

  listPlugins(): PluginMetadata<
    Record<string, unknown>,
    PPay,
    SReq,
    WProp,
    P,
    S,
    W
  >[] {
    return Array.from(this.plugins.values());
  }
}

export { MapRegistry as Registry };
