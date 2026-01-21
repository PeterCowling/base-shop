// Types-compat declarations for miscellaneous packages

declare module "@acme/lib" {
  export function cn(...inputs: any[]): string;
  export function formatPrice(amount: number, currency?: string): string;
  export function slugify(text: string): string;
  export function generateId(): string;
  export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T;
  export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): T;
  export function checkShopExists(shopId: string): Promise<boolean>;
  export function validateShopName(name: string): string;
  export function asNextJson<T>(data: T, init?: ResponseInit): any;
  export function generateMeta(options: any): any;
}

declare module "@acme/lib/*" {
  const content: any;
  export = content;
}

declare module "@acme/test-utils" {
  export function renderWithProviders(ui: React.ReactElement, options?: any): any;
  export function createMockRouter(options?: any): any;
  export function createMockSession(overrides?: any): any;
  export function waitForLoadingToFinish(): Promise<void>;
  export function withTempRepo<T>(fn: (dir: string) => T | Promise<T>, options?: { prefix?: string; createShopDir?: boolean; [k: string]: any }): Promise<T>;
  export function mockNextAuthAdmin(): void;
  export function jsonRequest(body: any, options?: { url?: string; method?: string; headers?: any; [k: string]: any }): any;
  export function mockSessionAndEmail(session?: any): void;
  export function fsMock(overrides?: any): any;
  export function writeJsonFileMock(path: string, data: any): void;
  export function withShop<T>(fn: (dir: string) => T | Promise<T>, options?: any): Promise<T>;
  export function seedShop(shopId: string, options?: any): Promise<void>;
  export function mockShop(overrides?: any): any;
  export function validateShopName(name: string): string;
  export function ulidMock(): string;
  export function sharpMetadataMock(overrides?: any): any;
  export function asNextJson<T>(data: T, init?: ResponseInit): any;
  export function adminSession(overrides?: any): any;
  export const mockFetch: jest.Mock;
}

declare module "@acme/test-utils/*" {
  const content: any;
  export = content;
}

declare module "@acme/page-builder-ui" {
  export const PageBuilder: React.FC<PageBuilderProps>;
  export const BlockEditor: React.FC<any>;
  export const ComponentPalette: React.FC<any>;
  export const StylePanel: React.FC<any>;
  export const ImagePicker: React.FC<any>;
  export const ComponentEditor: React.FC<any>;
  export interface PageBuilderProps {
    page?: any;
    shopId?: string;
    [k: string]: any;
  }
  export interface LibraryItem {
    id: string;
    name?: string;
    label?: string;
    template?: any;
    createdAt?: number;
    [k: string]: any;
  }
  export function saveLibraryStrict(scope: string, item: LibraryItem): Promise<void>;
  export function saveLibrary(scope: string, item: LibraryItem): Promise<void>;
  export function usePageBuilderDnD(options?: any): any;
  export const PreviewRenderer: React.FC<any>;
}

declare module "@acme/page-builder-ui/*" {
  const content: any;
  export = content;
}

declare module "@acme/configurator/providers" {
  export const ConfiguratorProvider: React.FC<any>;
  export const useConfigurator: () => any;
  export interface Provider {
    id: string;
    name: string;
    type: string;
    [k: string]: any;
  }
  export const Provider: React.FC<any>;
  export function providersByType(type: string): Provider[];
}

declare module "@acme/configurator/*" {
  const content: any;
  export = content;
}

declare module "@acme/email" {
  export function sendEmail(to: string, subject: string, body: string, attachments?: any): Promise<string | undefined>;
  export function renderEmail(template: string, data: any): Promise<string>;
  export function renderTemplate(id: string, params: Record<string, string>): string;
  export function sendCampaignEmail(options: { to: string; subject: string; html?: string; text?: string; [k: string]: any }): Promise<void>;
  export function listCampaigns(shop: string): Promise<Campaign[]>;
  export function createCampaign(data: Partial<Campaign>): Promise<Campaign>;
  export function emitClick(campaignId: string, data?: any): Promise<void>;
  export function emitOpen(campaignId: string, data?: any): Promise<void>;
  export interface Campaign {
    id: string;
    name: string;
    [k: string]: any;
  }
}

declare module "@acme/email/*" {
  const content: any;
  export = content;
}

declare module "~test/mocks/next-auth-jwt" {
  export interface JWT {
    [k: string]: any;
  }
  export function __setMockToken(token: any): void;
  export function __resetMockToken(): void;
  const JWT: JWT;
  export default JWT;
}

declare module "~test/*" {
  const content: any;
  export = content;
}

declare module "@acme/templates" {
  export const templates: any[];
  export function getTemplate(id: string): any;
  export function listTemplates(): any[];
  export const corePageTemplates: any[];
  export const checkoutPageTemplates: any[];
  export const homePageTemplates: any[];
  export const shopPageTemplates: any[];
  export const productPageTemplates: any[];
}

declare module "@acme/templates/*" {
  const content: any;
  export = content;
}

declare module "@acme/theme" {
  import { z } from "zod";

  export const theme: any;
  export function getTheme(): any;
  export function applyTheme(theme: any): void;
  export const themeLibrarySchema: z.ZodSchema<any>;
  export function parseDsPackage(pkg: any): any;
  export function initTheme(config: any): void;
  export interface ThemeLibraryEntry {
    id: string;
    name: string;
    [k: string]: any;
  }
}

declare module "@acme/theme/*" {
  const content: any;
  export = content;
}

declare module "@acme/platform-machine/maintenanceScheduler" {
  export function scheduleMaintenanceTask(task: any): Promise<void>;
  export function listMaintenanceTasks(): Promise<any[]>;
  export function runMaintenanceScan(shopId?: string): Promise<any>;
  export function startMaintenanceScheduler(): void;
}

declare module "@acme/telemetry" {
  export function recordMetric(name: string, value: number, tags?: Record<string, string>): void;
  export function incrementOperationalError(name: string, tags?: Record<string, string>): void;
  export function listEvents(shopId?: string): Promise<any[]>;
  export function trackEvent(name: string, data?: any): void;
  export function captureError(error: Error, context?: any): void;
  export function track(event: string, data?: any): void;
  export function deriveOperationalHealth(metrics: any): any;
  export function diffHistory(a: any, b: any): any;
  export interface TelemetryEvent {
    name: string;
    timestamp: string;
    data?: any;
    [k: string]: any;
  }
}

declare module "@acme/telemetry/*" {
  const content: any;
  export = content;
}

declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };
  export const ChevronDown: ComponentType<IconProps>;
  export const ChevronUp: ComponentType<IconProps>;
  export const ChevronLeft: ComponentType<IconProps>;
  export const ChevronRight: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
  export const Check: ComponentType<IconProps>;
  export const Plus: ComponentType<IconProps>;
  export const Minus: ComponentType<IconProps>;
  export const Search: ComponentType<IconProps>;
  export const Settings: ComponentType<IconProps>;
  export const Menu: ComponentType<IconProps>;
  export const Home: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const Mail: ComponentType<IconProps>;
  export const Phone: ComponentType<IconProps>;
  export const Calendar: ComponentType<IconProps>;
  export const Clock: ComponentType<IconProps>;
  export const Edit: ComponentType<IconProps>;
  export const Trash: ComponentType<IconProps>;
  export const Copy: ComponentType<IconProps>;
  export const Download: ComponentType<IconProps>;
  export const Upload: ComponentType<IconProps>;
  export const ExternalLink: ComponentType<IconProps>;
  export const Link: ComponentType<IconProps>;
  export const Image: ComponentType<IconProps>;
  export const File: ComponentType<IconProps>;
  export const FileX: ComponentType<IconProps>;
  export const FileEdit: ComponentType<IconProps>;
  export const FilePlus: ComponentType<IconProps>;
  export const Folder: ComponentType<IconProps>;
  export const AlertCircle: ComponentType<IconProps>;
  export const AlertTriangle: ComponentType<IconProps>;
  export const Info: ComponentType<IconProps>;
  export const HelpCircle: ComponentType<IconProps>;
  export const Eye: ComponentType<IconProps>;
  export const EyeOff: ComponentType<IconProps>;
  export const Lock: ComponentType<IconProps>;
  export const Unlock: ComponentType<IconProps>;
  export const RefreshCw: ComponentType<IconProps>;
  export const RotateCcw: ComponentType<IconProps>;
  export const Save: ComponentType<IconProps>;
  export const Send: ComponentType<IconProps>;
  export const Share: ComponentType<IconProps>;
  export const Star: ComponentType<IconProps>;
  export const Heart: ComponentType<IconProps>;
  export const ThumbsUp: ComponentType<IconProps>;
  export const ThumbsDown: ComponentType<IconProps>;
  export const MessageCircle: ComponentType<IconProps>;
  export const Bell: ComponentType<IconProps>;
  export const Filter: ComponentType<IconProps>;
  export const MoreHorizontal: ComponentType<IconProps>;
  export const MoreVertical: ComponentType<IconProps>;
  export const Loader2: ComponentType<IconProps>;
  export const ArrowLeft: ComponentType<IconProps>;
  export const ArrowRight: ComponentType<IconProps>;
  export const ArrowUp: ComponentType<IconProps>;
  export const ArrowDown: ComponentType<IconProps>;
  export const Grip: ComponentType<IconProps>;
  export const GripVertical: ComponentType<IconProps>;
  export const Move: ComponentType<IconProps>;
  export const Maximize: ComponentType<IconProps>;
  export const Minimize: ComponentType<IconProps>;
  export const ZoomIn: ComponentType<IconProps>;
  export const ZoomOut: ComponentType<IconProps>;
  export const Sun: ComponentType<IconProps>;
  export const Moon: ComponentType<IconProps>;
  export const Laptop: ComponentType<IconProps>;
  export const Smartphone: ComponentType<IconProps>;
  export const Tablet: ComponentType<IconProps>;
  export const Monitor: ComponentType<IconProps>;
  export const Globe: ComponentType<IconProps>;
  export const MapPin: ComponentType<IconProps>;
  export const Navigation: ComponentType<IconProps>;
  export const ShoppingCart: ComponentType<IconProps>;
  export const Package: ComponentType<IconProps>;
  export const Truck: ComponentType<IconProps>;
  export const CreditCard: ComponentType<IconProps>;
  export const DollarSign: ComponentType<IconProps>;
  export const Percent: ComponentType<IconProps>;
  export const Tag: ComponentType<IconProps>;
  export const Tags: ComponentType<IconProps>;
  export const Bookmark: ComponentType<IconProps>;
  export const Flag: ComponentType<IconProps>;
  export const Award: ComponentType<IconProps>;
  export const Gift: ComponentType<IconProps>;
  export const ShoppingBag: ComponentType<IconProps>;
  export const Store: ComponentType<IconProps>;
  export const Building: ComponentType<IconProps>;
  export const Briefcase: ComponentType<IconProps>;
  export const Users: ComponentType<IconProps>;
  export const UserPlus: ComponentType<IconProps>;
  export const UserMinus: ComponentType<IconProps>;
  export const UserCheck: ComponentType<IconProps>;
  export const UserX: ComponentType<IconProps>;
  export const LogIn: ComponentType<IconProps>;
  export const LogOut: ComponentType<IconProps>;
  export const Key: ComponentType<IconProps>;
  export const Shield: ComponentType<IconProps>;
  export const ShieldCheck: ComponentType<IconProps>;
  export const Fingerprint: ComponentType<IconProps>;
  export const Scan: ComponentType<IconProps>;
  export const QrCode: ComponentType<IconProps>;
  export const Barcode: ComponentType<IconProps>;
  export const Hash: ComponentType<IconProps>;
  export const AtSign: ComponentType<IconProps>;
  export const Terminal: ComponentType<IconProps>;
  export const Code: ComponentType<IconProps>;
  export const Code2: ComponentType<IconProps>;
  export const Braces: ComponentType<IconProps>;
  export const FileCode: ComponentType<IconProps>;
  export const FileText: ComponentType<IconProps>;
  export const FileJson: ComponentType<IconProps>;
  export const Database: ComponentType<IconProps>;
  export const Server: ComponentType<IconProps>;
  export const Cloud: ComponentType<IconProps>;
  export const CloudUpload: ComponentType<IconProps>;
  export const CloudDownload: ComponentType<IconProps>;
  export const Wifi: ComponentType<IconProps>;
  export const WifiOff: ComponentType<IconProps>;
  export const Bluetooth: ComponentType<IconProps>;
  export const Battery: ComponentType<IconProps>;
  export const BatteryCharging: ComponentType<IconProps>;
  export const Power: ComponentType<IconProps>;
  export const Zap: ComponentType<IconProps>;
  export const Activity: ComponentType<IconProps>;
  export const TrendingUp: ComponentType<IconProps>;
  export const TrendingDown: ComponentType<IconProps>;
  export const BarChart: ComponentType<IconProps>;
  export const BarChart2: ComponentType<IconProps>;
  export const PieChart: ComponentType<IconProps>;
  export const LineChart: ComponentType<IconProps>;
  export const Target: ComponentType<IconProps>;
  export const Crosshair: ComponentType<IconProps>;
  export const Compass: ComponentType<IconProps>;
  export const Map: ComponentType<IconProps>;
  export const Layers: ComponentType<IconProps>;
  export const Layout: ComponentType<IconProps>;
  export const LayoutGrid: ComponentType<IconProps>;
  export const LayoutList: ComponentType<IconProps>;
  export const LayoutDashboard: ComponentType<IconProps>;
  export const Grid: ComponentType<IconProps>;
  export const List: ComponentType<IconProps>;
  export const Table: ComponentType<IconProps>;
  export const Columns: ComponentType<IconProps>;
  export const Rows: ComponentType<IconProps>;
  export const SplitSquareHorizontal: ComponentType<IconProps>;
  export const SplitSquareVertical: ComponentType<IconProps>;
  export const Sidebar: ComponentType<IconProps>;
  export const PanelLeft: ComponentType<IconProps>;
  export const PanelRight: ComponentType<IconProps>;
  export const PanelTop: ComponentType<IconProps>;
  export const PanelBottom: ComponentType<IconProps>;
  export const Palette: ComponentType<IconProps>;
  export const Paintbrush: ComponentType<IconProps>;
  export const Pipette: ComponentType<IconProps>;
  export const Droplet: ComponentType<IconProps>;
  export const Sparkles: ComponentType<IconProps>;
  export const Wand: ComponentType<IconProps>;
  export const Wand2: ComponentType<IconProps>;
  export const Eraser: ComponentType<IconProps>;
  export const Highlighter: ComponentType<IconProps>;
  export const PenTool: ComponentType<IconProps>;
  export const Pencil: ComponentType<IconProps>;
  export const Pen: ComponentType<IconProps>;
  export const Type: ComponentType<IconProps>;
  export const Bold: ComponentType<IconProps>;
  export const Italic: ComponentType<IconProps>;
  export const Underline: ComponentType<IconProps>;
  export const Strikethrough: ComponentType<IconProps>;
  export const AlignLeft: ComponentType<IconProps>;
  export const AlignCenter: ComponentType<IconProps>;
  export const AlignRight: ComponentType<IconProps>;
  export const AlignJustify: ComponentType<IconProps>;
  export const Indent: ComponentType<IconProps>;
  export const Outdent: ComponentType<IconProps>;
  export const ListOrdered: ComponentType<IconProps>;
  export const ListTree: ComponentType<IconProps>;
  export const ListChecks: ComponentType<IconProps>;
  export const CheckSquare: ComponentType<IconProps>;
  export const Square: ComponentType<IconProps>;
  export const Circle: ComponentType<IconProps>;
  export const CircleDot: ComponentType<IconProps>;
  export const Disc: ComponentType<IconProps>;
  export const CircleCheck: ComponentType<IconProps>;
  export const CircleX: ComponentType<IconProps>;
  export const CircleAlert: ComponentType<IconProps>;
  export const CircleHelp: ComponentType<IconProps>;
  export const BadgeCheck: ComponentType<IconProps>;
  export const BadgeX: ComponentType<IconProps>;
  export const BadgeAlert: ComponentType<IconProps>;
  export const BadgeInfo: ComponentType<IconProps>;
  export const BadgePlus: ComponentType<IconProps>;
  export const BadgeMinus: ComponentType<IconProps>;
  export const BadgeDollarSign: ComponentType<IconProps>;
  export const BadgePercent: ComponentType<IconProps>;
  export const Infinity: ComponentType<IconProps>;
  export const Timer: ComponentType<IconProps>;
  export const TimerOff: ComponentType<IconProps>;
  export const Hourglass: ComponentType<IconProps>;
  export const Alarm: ComponentType<IconProps>;
  export const AlarmClock: ComponentType<IconProps>;
  export const Watch: ComponentType<IconProps>;
  export const Stopwatch: ComponentType<IconProps>;
  export const CalendarDays: ComponentType<IconProps>;
  export const CalendarClock: ComponentType<IconProps>;
  export const CalendarCheck: ComponentType<IconProps>;
  export const CalendarX: ComponentType<IconProps>;
  export const CalendarPlus: ComponentType<IconProps>;
  export const CalendarMinus: ComponentType<IconProps>;
  export const CalendarRange: ComponentType<IconProps>;
  export const CalendarSearch: ComponentType<IconProps>;
  export const History: ComponentType<IconProps>;
  export const Undo: ComponentType<IconProps>;
  export const Undo2: ComponentType<IconProps>;
  export const Redo: ComponentType<IconProps>;
  export const Redo2: ComponentType<IconProps>;
  export const RotateCw: ComponentType<IconProps>;
  export const Repeat: ComponentType<IconProps>;
  export const Repeat2: ComponentType<IconProps>;
  export const Shuffle: ComponentType<IconProps>;
  export const Play: ComponentType<IconProps>;
  export const Pause: ComponentType<IconProps>;
  export const Stop: ComponentType<IconProps>;
  export const SkipBack: ComponentType<IconProps>;
  export const SkipForward: ComponentType<IconProps>;
  export const FastForward: ComponentType<IconProps>;
  export const Rewind: ComponentType<IconProps>;
  export const Volume: ComponentType<IconProps>;
  export const Volume1: ComponentType<IconProps>;
  export const Volume2: ComponentType<IconProps>;
  export const VolumeX: ComponentType<IconProps>;
  export const Mic: ComponentType<IconProps>;
  export const MicOff: ComponentType<IconProps>;
  export const Camera: ComponentType<IconProps>;
  export const CameraOff: ComponentType<IconProps>;
  export const Video: ComponentType<IconProps>;
  export const VideoOff: ComponentType<IconProps>;
  export const Film: ComponentType<IconProps>;
  export const Clapperboard: ComponentType<IconProps>;
  export const Tv: ComponentType<IconProps>;
  export const Tv2: ComponentType<IconProps>;
  export const Cast: ComponentType<IconProps>;
  export const Airplay: ComponentType<IconProps>;
  export const Radio: ComponentType<IconProps>;
  export const Podcast: ComponentType<IconProps>;
  export const Music: ComponentType<IconProps>;
  export const Music2: ComponentType<IconProps>;
  export const Music3: ComponentType<IconProps>;
  export const Music4: ComponentType<IconProps>;
  export const Headphones: ComponentType<IconProps>;
  export const Speaker: ComponentType<IconProps>;
  export const Disc2: ComponentType<IconProps>;
  export const Disc3: ComponentType<IconProps>;
  export const SlidersHorizontal: ComponentType<IconProps>;
  export const SlidersVertical: ComponentType<IconProps>;
  export const Sliders: ComponentType<IconProps>;
  export const Gauge: ComponentType<IconProps>;
  export const Thermometer: ComponentType<IconProps>;
  export const ThermometerSun: ComponentType<IconProps>;
  export const ThermometerSnowflake: ComponentType<IconProps>;
  export const Flame: ComponentType<IconProps>;
  export const Snowflake: ComponentType<IconProps>;
  export const CloudRain: ComponentType<IconProps>;
  export const CloudSnow: ComponentType<IconProps>;
  export const CloudLightning: ComponentType<IconProps>;
  export const CloudSun: ComponentType<IconProps>;
  export const CloudMoon: ComponentType<IconProps>;
  export const Sunrise: ComponentType<IconProps>;
  export const Sunset: ComponentType<IconProps>;
  export const Wind: ComponentType<IconProps>;
  export const Umbrella: ComponentType<IconProps>;
  export const Rainbow: ComponentType<IconProps>;
  export const MountainSnow: ComponentType<IconProps>;
  export const Mountain: ComponentType<IconProps>;
  export const Waves: ComponentType<IconProps>;
  export const Trees: ComponentType<IconProps>;
  export const TreePine: ComponentType<IconProps>;
  export const TreeDeciduous: ComponentType<IconProps>;
  export const Flower: ComponentType<IconProps>;
  export const Flower2: ComponentType<IconProps>;
  export const Leaf: ComponentType<IconProps>;
  export const Sprout: ComponentType<IconProps>;
  export const Shrub: ComponentType<IconProps>;
  export const Salad: ComponentType<IconProps>;
  export const Apple: ComponentType<IconProps>;
  export const Cherry: ComponentType<IconProps>;
  export const Citrus: ComponentType<IconProps>;
  export const Grape: ComponentType<IconProps>;
  export const Banana: ComponentType<IconProps>;
  export const Carrot: ComponentType<IconProps>;
  export const Wheat: ComponentType<IconProps>;
  export const Coffee: ComponentType<IconProps>;
  export const CupSoda: ComponentType<IconProps>;
  export const Wine: ComponentType<IconProps>;
  export const Beer: ComponentType<IconProps>;
  export const Martini: ComponentType<IconProps>;
  export const GlassWater: ComponentType<IconProps>;
  export const Milk: ComponentType<IconProps>;
  export const IceCream: ComponentType<IconProps>;
  export const IceCream2: ComponentType<IconProps>;
  export const Cake: ComponentType<IconProps>;
  export const CakeSlice: ComponentType<IconProps>;
  export const Cookie: ComponentType<IconProps>;
  export const Croissant: ComponentType<IconProps>;
  export const Sandwich: ComponentType<IconProps>;
  export const Pizza: ComponentType<IconProps>;
  export const Soup: ComponentType<IconProps>;
  export const Beef: ComponentType<IconProps>;
  export const Ham: ComponentType<IconProps>;
  export const Egg: ComponentType<IconProps>;
  export const EggFried: ComponentType<IconProps>;
  export const Popcorn: ComponentType<IconProps>;
  export const Candy: ComponentType<IconProps>;
  export const Lollipop: ComponentType<IconProps>;
  export const Utensils: ComponentType<IconProps>;
  export const UtensilsCrossed: ComponentType<IconProps>;
  export const CookingPot: ComponentType<IconProps>;
  export const ChefHat: ComponentType<IconProps>;
  export const Refrigerator: ComponentType<IconProps>;
  export const Microwave: ComponentType<IconProps>;
}
