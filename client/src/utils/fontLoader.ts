import * as fabric from 'fabric';
import { GOOGLE_FONTS_STYLESHEET } from '../data/fonts';

const loadedFonts = new Set<string>();
let isMasterStylesheetInjected = false;

/**
 * Injects the master Google Fonts stylesheet so all 20 fonts are pre-connected and available for preview.
 */
export function injectMasterFontStylesheet(): void {
  if (isMasterStylesheetInjected) return;
  if (typeof document === 'undefined') return;

  const existingLink = document.querySelector(`link[data-card-fonts="true"]`);
  if (!existingLink) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_STYLESHEET;
    link.setAttribute('data-card-fonts', 'true');
    document.head.appendChild(link);
  }
  isMasterStylesheetInjected = true;
}

/**
 * Ensures a specific font family is fully loaded into the browser before applying it to canvas.
 * Avoids Fabric.js fallback measurement bugs.
 */
export async function ensureFontLoaded(fontFamily: string, weight: string | number = 400): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  injectMasterFontStylesheet();

  const fontDescriptor = `${weight} 16px "${fontFamily}"`;

  // Check if browser already loaded this font
  try {
    if (document.fonts && document.fonts.check(fontDescriptor)) {
      loadedFonts.add(fontFamily);
      return true;
    }
  } catch {
    // document.fonts.check might fail on unusual syntax, continue to load
  }

  // Load the font explicitly using document.fonts.load with a timeout
  try {
    const loadPromise = document.fonts.load(fontDescriptor);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Font load timeout')), 3500)
    );

    await Promise.race([loadPromise, timeoutPromise]);
    loadedFonts.add(fontFamily);
    return true;
  } catch (err) {
    console.warn(`Font "${fontFamily}" load failed or timed out. Falling back gracefully.`, err);
    // Even if load fails, allow the canvas to attempt rendering with fallback
    return false;
  }
}

/**
 * Applies a font to the currently active Fabric.js text object (or all text objects in an active group).
 * Properly recalculates dimensions and bounding boxes.
 */
export async function applyFontToActiveText(
  canvas: fabric.Canvas | null,
  fontFamily: string,
  onAfterApply?: () => void
): Promise<boolean> {
  if (!canvas) return false;

  const activeObj = canvas.getActiveObject();
  if (!activeObj) return false;

  // Load the font first
  await ensureFontLoaded(fontFamily);

  let modified = false;

  const updateTextObject = (obj: fabric.FabricObject) => {
    if ('fontFamily' in obj) {
      obj.set('fontFamily', fontFamily);
      // Recalculate dimensions for Textbox / Text objects in Fabric v6
      if (typeof (obj as any).initDimensions === 'function') {
        (obj as any).initDimensions();
      }
      obj.setCoords();
      modified = true;
    }
  };

  if ('getObjects' in activeObj && typeof (activeObj as any).getObjects === 'function') {
    // If multiple selection or group
    const objects = (activeObj as any).getObjects();
    objects.forEach(updateTextObject);
  } else {
    updateTextObject(activeObj);
  }

  if (modified) {
    canvas.requestRenderAll();
    onAfterApply?.();
    return true;
  }

  return false;
}
