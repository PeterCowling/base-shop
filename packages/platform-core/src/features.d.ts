export declare const features: {
    /** enable RA ticketing module */
    raTicketing: boolean;
    /** minimum fraud score before manual review */
    fraudReviewThreshold: number;
    /** require SCA for high value orders */
    requireStrongCustomerAuth: boolean;
    /** dashboards for shipment and return tracking */
    trackingDashboard: boolean;
    /** enable return requests and label generation */
    returns: boolean;
};
export type Features = typeof features;
