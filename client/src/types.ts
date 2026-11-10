export interface DesignCategory {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

export interface DesignTemplate {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  countryCode: string | null;
  style: string | null;
  widthPx: number;
  heightPx: number;
  dpi: number;
  polotnoJson: any;
  editableVariables: any;
  isSystemTemplate: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  imglyTemplate?: any;
}

export interface CardDetails {
  fullName: string;
  email: string;
  phone: string;
  tagline: string;
  website: string;
  logoText: string;
  city?: string;
  province?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  widthPx: number;
  heightPx: number;
  sidesCount: number;
}

export const PRODUCTS: ProductItem[] = [
  {
    id: 'business-card',
    name: 'Business card',
    subtitle: '3.5 × 2 in',
    badge: '2 sides',
    widthPx: 1050,
    heightPx: 600,
    sidesCount: 2,
  },
  {
    id: 'folded-card',
    name: 'Folded card',
    subtitle: 'A6 panels · folds in half',
    badge: '4 panels',
    widthPx: 1240,
    heightPx: 874,
    sidesCount: 4,
  },
  {
    id: 'tri-fold-brochure',
    name: 'Tri-fold brochure',
    subtitle: 'US Letter · 3 panels a side',
    badge: '6 panels',
    widthPx: 1200,
    heightPx: 776,
    sidesCount: 6,
  },
  {
    id: 'booklet',
    name: 'Booklet',
    subtitle: 'A5 · saddle-stitched',
    badge: '8+ pages',
    widthPx: 700,
    heightPx: 990,
    sidesCount: 8,
  },
  {
    id: 'flyer',
    name: 'Flyer',
    subtitle: 'A4 · single sheet',
    badge: '1–2 sides',
    widthPx: 794,
    heightPx: 1123,
    sidesCount: 2,
  },
];

export type SidebarTab =
  | 'product'
  | 'details'
  | 'text'
  | 'graphics'
  | 'qrcode'
  | 'colours'
  | 'background'
  | 'layers';
