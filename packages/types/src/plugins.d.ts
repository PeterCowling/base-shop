import type React from "react";
import type { z } from "zod";

export interface PaymentPayload {
    [key: string]: unknown;
}
export interface ShippingRequest {
    [key: string]: unknown;
}
export interface WidgetProps {
    [key: string]: unknown;
}
export interface WidgetComponent<P = WidgetProps> {
    (props: P): React.ReactElement | null;
}
export interface PaymentProvider<Payload = PaymentPayload> {
    processPayment(payload: Payload): Promise<unknown> | unknown;
}
export interface ShippingProvider<Request = ShippingRequest> {
    calculateShipping(request: Request): Promise<unknown> | unknown;
}
export interface PaymentRegistry<Payload = PaymentPayload, T extends PaymentProvider<Payload> = PaymentProvider<Payload>> {
    add(id: string, provider: T): void;
    get(id: string): T | undefined;
    list(): {
        id: string;
        value: T;
    }[];
}
export interface ShippingRegistry<Request = ShippingRequest, T extends ShippingProvider<Request> = ShippingProvider<Request>> {
    add(id: string, provider: T): void;
    get(id: string): T | undefined;
    list(): {
        id: string;
        value: T;
    }[];
}
export interface WidgetRegistry<Props = WidgetProps, T extends WidgetComponent<Props> = WidgetComponent<Props>> {
    add(id: string, component: T): void;
    get(id: string): T | undefined;
    list(): {
        id: string;
        value: T;
    }[];
}
export interface PluginOptions<Config = Record<string, unknown>> {
    /** Optional name shown in the CMS */
    name: string;
    /** Optional description for plugin */
    description?: string;
    /** Default configuration values */
    defaultConfig?: Config;
    /** zod schema used to validate configuration */
    configSchema?: z.ZodType<Config>;
}
export interface Plugin<Config = Record<string, unknown>, PPay = PaymentPayload, SReq = ShippingRequest, WProp = WidgetProps, P extends PaymentProvider<PPay> = PaymentProvider<PPay>, S extends ShippingProvider<SReq> = ShippingProvider<SReq>, W extends WidgetComponent<WProp> = WidgetComponent<WProp>> extends PluginOptions<Config> {
    id: string;
    registerPayments?(registry: PaymentRegistry<PPay, P>, config: Config): void;
    registerShipping?(registry: ShippingRegistry<SReq, S>, config: Config): void;
    registerWidgets?(registry: WidgetRegistry<WProp, W>, config: Config): void;
    /** optional async initialization hook */
    init?(config: Config): Promise<void> | void;
}
//# sourceMappingURL=plugins.d.ts.map