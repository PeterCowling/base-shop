import type { PaymentPayload, PaymentProvider, Plugin, ShippingProvider, ShippingRequest, WidgetComponent, WidgetProps } from "@acme/types";

export interface RegistryItem<T> {
    id: string;
    value: T;
}
declare class MapRegistry<T> {
    private items;
    add(id: string, item: T): void;
    get(id: string): T | undefined;
    list(): RegistryItem<T>[];
}
export interface PluginMetadata<T extends Plugin<any, any, any, any, any, any, any> = Plugin> {
    id: string;
    name?: string;
    description?: string;
    plugin: T;
}
export declare class PluginManager<PPay extends PaymentPayload = PaymentPayload, SReq extends ShippingRequest = ShippingRequest, WProp extends WidgetProps = WidgetProps, P extends PaymentProvider<PPay> = PaymentProvider<PPay>, S extends ShippingProvider<SReq> = ShippingProvider<SReq>, W extends WidgetComponent<WProp> = WidgetComponent<WProp>> {
    readonly payments: MapRegistry<P>;
    readonly shipping: MapRegistry<S>;
    readonly widgets: MapRegistry<W>;
    private plugins;
    addPlugin<C extends Record<string, unknown>>(plugin: Plugin<C, PPay, SReq, WProp, P, S, W>): void;
    getPlugin(id: string): PluginMetadata<Plugin<Record<string, unknown>, PPay, SReq, WProp, P, S, W>> | undefined;
    listPlugins(): PluginMetadata<Plugin<Record<string, unknown>, PPay, SReq, WProp, P, S, W>>[];
}
export { MapRegistry as Registry };
