/**
 * Hospitality context tokens
 * Balanced between consumer (guest-facing) and operations (staff-facing)
 * Used in: Hostel/hotel websites, booking systems, guest portals
 */
export declare const hospitalityTokens: {
    readonly spacing: {
        readonly 'row-gap': "1rem";
        readonly 'section-gap': "2rem";
        readonly 'card-padding': "1rem";
        readonly 'input-padding': "0.75rem";
        readonly 'button-padding-x': "1rem";
        readonly 'button-padding-y': "0.5rem";
    };
    readonly typography: {
        readonly 'base-size': "0.9375rem";
        readonly 'heading-size': "1.25rem";
        readonly 'label-size': "0.8125rem";
    };
    readonly colors: {
        readonly 'room-available': "#16a34a";
        readonly 'room-occupied': "#dc2626";
        readonly 'room-cleaning': "#ca8a04";
        readonly 'room-maintenance': "#4b5563";
        readonly 'amenity-highlight': "#2563eb";
        readonly 'booking-primary': "#16a34a";
        readonly 'booking-secondary': "#3b82f6";
    };
    readonly density: "default";
};
export type HospitalityTokens = typeof hospitalityTokens;
