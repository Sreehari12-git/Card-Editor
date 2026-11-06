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

export type SidebarTab =
  | 'details'
  | 'text'
  | 'graphics'
  | 'qrcode'
  | 'colours'
  | 'background'
  | 'layers';
