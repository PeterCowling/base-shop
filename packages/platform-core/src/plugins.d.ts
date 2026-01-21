import type { PaymentPayload, PaymentProvider, PaymentRegistry, Plugin,PluginOptions, ShippingProvider, ShippingRegistry, ShippingRequest, WidgetComponent, WidgetProps, WidgetRegistry } from "@acme/types";

import { type PluginManager } from "./plugins/PluginManager";

export declare function loadPlugin(id: string): Promise<Plugin | undefined>;
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
export type { PaymentPayload, PaymentProvider, PaymentRegistry, Plugin,PluginOptions, ShippingProvider, ShippingRegistry, ShippingRequest, WidgetComponent, WidgetProps, WidgetRegistry,  };
