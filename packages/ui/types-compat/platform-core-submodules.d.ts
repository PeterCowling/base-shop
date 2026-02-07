// Types-compat declarations for @acme/platform-core submodule paths
// These allow typecheck to pass without requiring the full platform-core build

declare module "@acme/platform-core" {
  export const getShop: any;
  export const getShopBySlug: any;
  export const listShops: any;
  export type Shop = any;
  export type ShopConfig = any;
  export const LayoutProvider: any;
  export const ThemeProvider: any;
  export const useLayout: any;
}

declare module "@acme/platform-core/orders" {
  export interface Order {
    id: string;
    [k: string]: any;
  }
  export type OrderStatus = string;
  export const getOrder: any;
  export const listOrders: any;
  export const getOrdersForCustomer: any;
}

declare module "@acme/platform-core/shipping" {
  export interface ShippingMethod {
    id: string;
    name: string;
    [k: string]: any;
  }
  export interface ShipmentTracking {
    trackingNumber?: string;
    carrier?: string;
    status?: string;
    [k: string]: any;
  }
  export const getShippingMethods: any;
  export const getTrackingStatus: any;
}

declare module "@acme/platform-core/returnAuthorization" {
  export interface ReturnAuthorization {
    id: string;
    [k: string]: any;
  }
  export type RmaStatus = string;
  export const createReturn: any;
  export const getTrackingStatus: any;
}

declare module "@acme/platform-core/customerProfiles" {
  export interface CustomerProfile {
    id: string;
    email?: string;
    name?: string;
    [k: string]: any;
  }
  export const getCustomerProfile: any;
  export const updateCustomerProfile: any;
}

declare module "@acme/platform-core/cart" {
  export interface CartLine {
    sku: any;
    qty: number;
    size?: string;
    [k: string]: any;
  }
  export type CartState = Record<string, CartLine>;
}

declare module "@acme/platform-core/cartCookie" {
  export const getCartFromCookie: any;
  export const setCartCookie: any;
  export const CART_COOKIE: string;
  export const decodeCartCookie: any;
}

declare module "@acme/platform-core/cartStore" {
  export const cartStore: any;
  export const useCartStore: any;
  export const createCartStore: any;
}

declare module "@acme/platform-core/contexts/CartContext" {
  export const CartProvider: any;
  export const useCart: any;
}

declare module "@acme/platform-core/contexts/CurrencyContext" {
  export const CurrencyProvider: any;
  export const useCurrency: () => [string, (c: string) => void];
  export type Currency = string;
}

declare module "@acme/platform-core/features" {
  export const isFeatureEnabled: (feature: string) => boolean;
  export const getFeatureFlags: any;
  export const features: Record<string, boolean>;
}

declare module "@acme/platform-core/hooks/usePublishLocations" {
  export const usePublishLocations: any;
}

declare module "@acme/platform-core/products/index" {
  export interface Product {
    id: string;
    title?: string;
    [k: string]: any;
  }
  export const getProduct: any;
  export const listProducts: any;
  export const PRODUCTS: Product[];
  export const getProductById: any;
  export const getProductBySlug: any;
}

declare module "@acme/platform-core/rental/availability" {
  export const checkAvailability: any;
  export const getAvailableDates: any;
  export const getAvailability: any;
  export const configureAvailabilityAdapter: any;
}

declare module "@acme/platform-core/rental/demoAdapter" {
  export const demoAdapter: any;
  export const createDemoAvailabilityAdapter: any;
}

declare module "@acme/platform-core/repositories/json.server" {
  export const jsonRepository: any;
  export const readShop: any;
}

declare module "@acme/platform-core/repositories/shops.server" {
  export const shopsRepository: any;
  export const readShop: any;
}

declare module "@acme/platform-core/router/breadcrumbs" {
  export interface Breadcrumb {
    href: string;
    label: string;
  }
  export const getBreadcrumbs: any;
}

declare module "@acme/platform-core/validation/options" {
  export const validateOptions: any;
  export const rootPlacementOptions: any;
}

declare module "@acme/platform-core/validation/sectionRules" {
  export const validateSection: any;
  export const validateSectionRules: any;
  export interface ValidationResult {
    ok: boolean;
    valid?: boolean;
    errors?: string[];
    [k: string]: any;
  }
}

declare module "@acme/platform-core/validation/templateValidation" {
  export const validateTemplate: any;
  export const validateTemplateCreation: any;
}

declare module "@acme/platform-core/components/blog/BlogPortableText" {
  const BlogPortableText: React.FC<any>;
  export default BlogPortableText;
  export { BlogPortableText };
}

declare module "@acme/platform-core/components/pdp/ImageGallery" {
  const ImageGallery: React.FC<any>;
  export default ImageGallery;
}

declare module "@acme/platform-core/components/pdp/SizeSelector" {
  const SizeSelector: React.FC<any>;
  export default SizeSelector;
}

declare module "@acme/platform-core/components/shop/AddToCartButton.client" {
  const AddToCartButton: React.FC<any>;
  export default AddToCartButton;
}

declare module "@acme/platform-core/components/shop/FilterBar" {
  const FilterBar: React.FC<any>;
  export default FilterBar;
  export { FilterBar };
  export interface FilterBarProps {
    [k: string]: any;
  }
  export interface Filters {
    [k: string]: any;
  }
  export interface FilterDefinition {
    [k: string]: any;
  }
}

declare module "@acme/platform-core/components/shop/ProductCard" {
  const ProductCard: React.FC<any>;
  export default ProductCard;
  export { ProductCard };
  export const Price: React.FC<any>;
}

declare module "@acme/platform-core/components/shop/ProductGrid" {
  const ProductGrid: React.FC<any>;
  export default ProductGrid;
  export { ProductGrid };
}

// @acme/platform-core alias paths
declare module "@acme/platform-core/analytics/client" {
  export const trackEvent: any;
  export const trackPageView: any;
  export const logAnalyticsEvent: any;
}

declare module "@acme/platform-core/contexts/ThemeContext" {
  export const ThemeProvider: any;
  export const useTheme: any;
  export type Theme = any;
}

declare module "@acme/platform-core/hooks/usePublishLocations" {
  export const usePublishLocations: any;
  export const loadPublishLocations: any;
}
