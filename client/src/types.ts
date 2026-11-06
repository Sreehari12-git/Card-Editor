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
  imglyTemplate: any;
}
