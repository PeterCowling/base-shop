import { PluginManager } from "./plugins/PluginManager";
import type { PaymentPayload, ShippingRequest, WidgetProps, PaymentProvider, ShippingProvider, WidgetComponent, PaymentRegistry, ShippingRegistry, WidgetRegistry, PluginOptions, Plugin } from "@acme/types";
export interface LoadPluginsOptions {
    /** directories containing plugin packages */
    directories?: string[];
    /** explicit plugin package paths */
    plugins?: string[];
    /** optional path to JSON config listing directories/plugins */
    configFile?: string;
}
/** Load plugins from provided directories or explicit paths */
export declare function loadPlugins({ directories, plugins, configFile, }?: LoadPluginsOptions): Promise<Plugin[]>;
export interface InitPluginsOptions extends LoadPluginsOptions {
    config?: Record<string, Record<string, unknown>>;
}
/** Load plugins and call their registration hooks */
export declare function initPlugins<PPay extends PaymentPayload = PaymentPayload, SReq extends ShippingRequest = ShippingRequest, WProp extends WidgetProps = WidgetProps, P extends PaymentProvider<PPay> = PaymentProvider<PPay>, S extends ShippingProvider<SReq> = ShippingProvider<SReq>, W extends WidgetComponent<WProp> = WidgetComponent<WProp>>(options?: InitPluginsOptions): Promise<PluginManager<PPay, SReq, WProp, P, S, W>>;
export type { PaymentPayload, ShippingRequest, WidgetProps, WidgetComponent, PaymentProvider, ShippingProvider, PaymentRegistry, ShippingRegistry, WidgetRegistry, PluginOptions, Plugin, };
