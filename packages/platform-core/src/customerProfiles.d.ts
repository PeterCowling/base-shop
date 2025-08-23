import "server-only";
export interface CustomerProfile {
    customerId: string;
    name: string;
    email: string;
}
export declare function getCustomerProfile(customerId: string): Promise<CustomerProfile | null>;
export declare function updateCustomerProfile(customerId: string, data: {
    name: string;
    email: string;
}): Promise<CustomerProfile>;
