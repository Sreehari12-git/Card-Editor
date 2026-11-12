import * as fabric from 'fabric';
import { CardDetails, DesignTemplate } from '../types';
import { ensureFontLoaded } from './fontLoader';

export interface ParsedTemplateResult {
  objects: fabric.FabricObject[];
  backgroundColor: string;
  textObjectMap: { [key: string]: fabric.Textbox };
}

/**
 * Safely encodes SVG data URLs to ensure full cross-browser compatibility
 */
function normalizeSvgDataUrl(src: string): string {
  if (
    src.startsWith('data:image/svg+xml;utf8,') &&
    !src.includes('%3Csvg') &&
    src.includes('<svg')
  ) {
    const svgPart = src.slice('data:image/svg+xml;utf8,'.length);
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPart);
  }
  return src;
}

/**
 * Determines which CardDetails field maps to a given template text object name
 */
function mapTextNameToDetailKey(name?: string): keyof CardDetails | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  if (['name', 'fullname', 'full name'].includes(n)) return 'fullName';
  if (['subtitle', 'job title', 'profession', 'tagline'].includes(n)) return 'tagline';
  if (['phone'].includes(n)) return 'phone';
  if (['email'].includes(n)) return 'email';
  if (['website', 'web'].includes(n)) return 'website';
  if (
    ['firm name', 'brand name', 'logoname', 'logotext', 'companyname', 'clinicname'].includes(n)
  )
    return 'logoText';
  return null;
}

/**
 * Parses a database template (Polotno JSON) into Fabric.js objects
 */
export async function parseTemplateToFabric(
  template: DesignTemplate | null,
  details: CardDetails
): Promise<ParsedTemplateResult> {
  const objects: fabric.FabricObject[] = [];
  const textObjectMap: { [key: string]: fabric.Textbox } = {};

  const page = template?.polotnoJson?.pages?.[0];
  const backgroundColor = page?.background || '#ffffff';

  if (!page || !Array.isArray(page.children) || page.children.length === 0) {
    // If no Polotno JSON, return empty objects to let caller fall back to standard card
    return { objects: [], backgroundColor: '#ffffff', textObjectMap: {} };
  }

  for (const child of page.children) {
    try {
      if (child.type === 'svg' && child.src) {
        const safeSrc = normalizeSvgDataUrl(child.src);
        const img = await fabric.FabricImage.fromURL(safeSrc);

        const targetW = child.width || img.width || 100;
        const targetH = child.height || img.height || 100;
        const scaleX = img.width ? targetW / img.width : 1;
        const scaleY = img.height ? targetH / img.height : 1;

        img.set({
          left: child.x ?? 0,
          top: child.y ?? 0,
          originX: 'left',
          originY: 'top',
          scaleX,
          scaleY,
          opacity: child.opacity !== undefined ? child.opacity : 1,
          angle: child.rotation || 0,
          selectable: child.selectable !== false,
        });

        if (child.name) {
          (img as any).name = child.name;
        }

        objects.push(img);
      } else if (child.type === 'text') {
        const fontFamily = child.fontFamily || 'Inter';
        const fontWeight = child.fontWeight || 'normal';
        await ensureFontLoaded(fontFamily, fontWeight);

        const detailKey = mapTextNameToDetailKey(child.name);
        let textValue = child.text || '';
        if (detailKey && details[detailKey]) {
          textValue = details[detailKey]!;
        }

        const textbox = new fabric.Textbox(textValue, {
          left: child.x ?? 50,
          top: child.y ?? 50,
          originX: 'left',
          originY: 'top',
          width: child.width || 300,
          fontSize: child.fontSize || 24,
          fontFamily,
          fontWeight,
          fontStyle: child.fontStyle || 'normal',
          fill: child.fill || '#1e293b',
          textAlign: child.align || 'left',
          opacity: child.opacity !== undefined ? child.opacity : 1,
          angle: child.rotation || 0,
          selectable: child.selectable !== false,
        });

        if (child.name) {
          (textbox as any).name = child.name;
        }

        if (detailKey) {
          textObjectMap[detailKey] = textbox;
        }

        objects.push(textbox);
      } else if (child.type === 'line') {
        const line = new fabric.Line(
          [
            child.x || 0,
            child.y || 0,
            (child.x || 0) + (child.width || 100),
            child.y || 0,
          ],
          {
            stroke: child.fill || '#000000',
            strokeWidth: child.strokeWidth || 2,
            opacity: child.opacity !== undefined ? child.opacity : 1,
            angle: child.rotation || 0,
            selectable: child.selectable !== false,
          }
        );
        if (child.name) {
          (line as any).name = child.name;
        }
        objects.push(line);
      }
    } catch (err) {
      console.warn(`Could not parse template child ${child.name || child.type}:`, err);
    }
  }

  return { objects, backgroundColor, textObjectMap };
}
