import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { CardDetails, DesignTemplate, CanvasWorkspaceHandle, CanvasSideData } from '../types';
import { FloatingElementToolbar } from './FloatingElementToolbar';
import { applyFontToActiveText, ensureFontLoaded } from '../utils/fontLoader';
import { parseTemplateToFabric } from '../utils/templateParser';

// Rotation icon SVG image loaded for crisp rendering on canvas control
const rotateIconImg = typeof window !== 'undefined' ? new Image() : null;
if (rotateIconImg) {
  rotateIconImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpolyline points='21 3 21 8 16 8'/%3E%3C/svg%3E`;
}

// Global live rotation tracking flags for control renderer
let isRotatingWithMouse = false;
let activeRotatingAngle: number | null = null;

// Custom rotation handle rendering: circular button with 🔄 rotation arrows matching the reference image
function renderRotationHandle(
  this: any,
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: any,
  _fabricObject: fabric.FabricObject
) {
  const size = 26;
  const radius = size / 2;

  ctx.save();
  ctx.translate(left, top);

  // 1. White circular button background with soft drop shadow
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.fill();

  // 2. Crisp cyan/blue circular border
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.75;
  ctx.stroke();

  // 3. Circular rotation arrows inside
  if (rotateIconImg && rotateIconImg.complete && rotateIconImg.naturalWidth > 0) {
    const iconSize = 14;
    ctx.drawImage(rotateIconImg, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
  } else {
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';

    const r = 5.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.stroke();

    const a1Angle = -Math.PI * 0.15;
    const a1X = r * Math.cos(a1Angle);
    const a1Y = r * Math.sin(a1Angle);
    ctx.beginPath();
    ctx.moveTo(a1X - 2.5, a1Y - 3);
    ctx.lineTo(a1X + 2, a1Y);
    ctx.lineTo(a1X - 2.5, a1Y + 3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    const a2Angle = Math.PI * 0.85;
    const a2X = r * Math.cos(a2Angle);
    const a2Y = r * Math.sin(a2Angle);
    ctx.beginPath();
    ctx.moveTo(a2X + 2.5, a2Y + 3);
    ctx.lineTo(a2X - 2, a2Y);
    ctx.lineTo(a2X + 2.5, a2Y - 3);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Live degree tooltip directly above the handle while rotating
  if (isRotatingWithMouse && activeRotatingAngle !== null) {
    const angleText = `${activeRotatingAngle}°`;
    ctx.save();
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    const textWidth = ctx.measureText(angleText).width;
    const pillW = Math.max(textWidth + 14, 40);
    const pillH = 22;
    const pillY = -28;

    ctx.beginPath();
    const px = -pillW / 2;
    const py = pillY - pillH / 2;
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(px, py, pillW, pillH, 6);
    } else {
      ctx.rect(px, py, pillW, pillH);
    }
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(angleText, 0, pillY);
    ctx.restore();
  }

  ctx.restore();
}

// Global handle defaults matching user screenshot: white square corners with blue border
fabric.FabricObject.ownDefaults.cornerColor = '#ffffff';
fabric.FabricObject.ownDefaults.cornerStrokeColor = '#0284c7';
fabric.FabricObject.ownDefaults.cornerStyle = 'rect';
fabric.FabricObject.ownDefaults.cornerSize = 9;
fabric.FabricObject.ownDefaults.touchCornerSize = 24;
fabric.FabricObject.ownDefaults.transparentCorners = false;
fabric.FabricObject.ownDefaults.borderColor = '#0284c7';
fabric.FabricObject.ownDefaults.borderScaleFactor = 1.5;

// Customize interactive controls for all fabric objects to attach the rotation handle
const origCreateControls = fabric.InteractiveFabricObject.createControls;
fabric.InteractiveFabricObject.createControls = function () {
  const result = origCreateControls.call(this);
  if (result.controls.mtr) {
    result.controls.mtr.sizeX = 26;
    result.controls.mtr.sizeY = 26;
    result.controls.mtr.touchSizeX = 36;
    result.controls.mtr.touchSizeY = 36;
    result.controls.mtr.offsetY = -34;
    result.controls.mtr.cursorStyleHandler = () => 'grab';
    result.controls.mtr.render = renderRotationHandle;
  }
  return result;
};

interface CanvasWorkspaceProps {
  selectedTemplate: DesignTemplate | null;
  details: CardDetails;
  canvasInstanceRef: React.MutableRefObject<fabric.Canvas | null>;
  workspaceRef?: React.MutableRefObject<CanvasWorkspaceHandle | null>;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  selectedTemplate,
  details,
  canvasInstanceRef,
  workspaceRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skipTemplateResetRef = useRef<boolean>(false);

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedColor, setSelectedColor] = useState<string>('#1e3a8a');
  const [hasSelection, setHasSelection] = useState<boolean>(false);
  const [canvasVersion, setCanvasVersion] = useState<number>(0);

  // Active text object state
  const [isTextSelected, setIsTextSelected] = useState<boolean>(false);
  const [toolbarPosition, setToolbarPosition] = useState<{
    x: number;
    y: number;
    placeBelow?: boolean;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const [selectedFont, setSelectedFont] = useState<string>('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState<number>(24);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // Active side state for Front and Back of the card
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  // Whether the card has a back side (defaults to false until user adds it)
  const [hasBackSide, setHasBackSide] = useState<boolean>(false);
  const frontJsonRef = useRef<any>(null);
  const backJsonRef = useRef<any>(null);

  // Undo / Redo History state
  const history = useRef<string[]>([]);
  const historyIndex = useRef<number>(-1);
  const isHistoryProcessing = useRef<boolean>(false);
  const [, setCanUndo] = useState<boolean>(false);
  const [, setCanRedo] = useState<boolean>(false);

  // References to keep track of specific variable text boxes on canvas
  const textObjectMap = useRef<{ [key: string]: fabric.Textbox }>({});

  // Save current canvas state to history
  const saveHistoryState = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || isHistoryProcessing.current) return;

    try {
      const json = JSON.stringify((canvas as any).toObject(['name']));

      // Avoid pushing identical duplicate consecutive states
      if (
        history.current.length > 0 &&
        history.current[historyIndex.current] === json
      ) {
        return;
      }

      // Truncate any redo steps ahead if we made a new action
      history.current = history.current.slice(0, historyIndex.current + 1);
      history.current.push(json);

      // Keep up to 40 history steps to prevent excessive memory usage
      if (history.current.length > 40) {
        history.current.shift();
      }

      historyIndex.current = history.current.length - 1;

      setCanUndo(historyIndex.current > 0);
      setCanRedo(false);
    } catch (err) {
      console.error('Error saving history snapshot:', err);
    }
  }, [canvasInstanceRef]);

  // Perform Undo
  const handleUndo = useCallback(async () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || historyIndex.current <= 0 || isHistoryProcessing.current) return;

    try {
      isHistoryProcessing.current = true;
      historyIndex.current -= 1;
      const targetState = history.current[historyIndex.current];

      canvas.discardActiveObject();
      await canvas.loadFromJSON(JSON.parse(targetState));
      canvas.renderAll();

      setCanUndo(historyIndex.current > 0);
      setCanRedo(historyIndex.current < history.current.length - 1);
    } catch (err) {
      console.error('Error performing undo:', err);
    } finally {
      isHistoryProcessing.current = false;
    }
  }, [canvasInstanceRef]);

  // Perform Redo
  const handleRedo = useCallback(async () => {
    const canvas = canvasInstanceRef.current;
    if (
      !canvas ||
      historyIndex.current >= history.current.length - 1 ||
      isHistoryProcessing.current
    )
      return;

    try {
      isHistoryProcessing.current = true;
      historyIndex.current += 1;
      const targetState = history.current[historyIndex.current];

      canvas.discardActiveObject();
      await canvas.loadFromJSON(JSON.parse(targetState));
      canvas.renderAll();

      setCanUndo(historyIndex.current > 0);
      setCanRedo(historyIndex.current < history.current.length - 1);
    } catch (err) {
      console.error('Error performing redo:', err);
    } finally {
      isHistoryProcessing.current = false;
    }
  }, [canvasInstanceRef]);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = 1050;
    const height = 600;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
    });

    canvasInstanceRef.current = canvas;
    setCanvasVersion((v) => v + 1);

    const computeToolbarPosition = (activeObj: fabric.FabricObject) => {
      const bound = activeObj.getBoundingRect();
      // By default, the toolbar should always be ON TOP of the element.
      // Only when placed in/near a top corner or top edge (bound.top < 85) does it dock UNDER the element.
      const placeBelow = bound.top < 85;

      const canvasW = canvas.getWidth();
      const centerX = bound.left + bound.width / 2;
      const clampedX = Math.max(90, Math.min(canvasW - 90, centerX));

      return {
        x: clampedX,
        // Distance ensures that whether at 0° or 180° rotation,
        // the rotation handle never collides with the toolbar and maintains comfortable breathing room.
        y: placeBelow ? bound.top + bound.height + 72 : bound.top - 66,
        placeBelow,
      };
    };

    const updateSelectionState = () => {
      const activeObj = canvas.getActiveObject();
      setHasSelection(!!activeObj);
      if (activeObj && 'fill' in activeObj && typeof activeObj.fill === 'string') {
        setSelectedColor(activeObj.fill);
      }

      if (activeObj) {
        setToolbarPosition(computeToolbarPosition(activeObj));

        if ('fontFamily' in activeObj) {
          setIsTextSelected(true);
          const objAny = activeObj as any;
          setSelectedFont(objAny.fontFamily || 'Inter');
          setSelectedFontSize(Math.round(objAny.fontSize || 24));
          setIsBold(objAny.fontWeight === 'bold' || Number(objAny.fontWeight) >= 700);
          setIsItalic(objAny.fontStyle === 'italic');
          setTextAlign(objAny.textAlign || 'left');
        } else {
          setIsTextSelected(false);
        }
      } else {
        setToolbarPosition(null);
        setIsTextSelected(false);
      }
    };

    const updatePositionOnly = () => {
      const activeObj = canvas.getActiveObject();
      if (activeObj) {
        setToolbarPosition(computeToolbarPosition(activeObj));
      }
    };

    const handleTransformStart = () => {
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }
    };

    const handleRotating = (e: any) => {
      handleTransformStart();
      const target = e.target;
      if (target) {
        const raw = Math.round(target.angle || 0) % 360;
        const deg = (raw + 360) % 360;
        isRotatingWithMouse = true;
        activeRotatingAngle = deg;
      }
    };

    const handleTransformEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
      isRotatingWithMouse = false;
      activeRotatingAngle = null;
      updatePositionOnly();
    };

    canvas.on('selection:created', updateSelectionState);
    canvas.on('selection:updated', updateSelectionState);
    canvas.on('selection:cleared', () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      isRotatingWithMouse = false;
      activeRotatingAngle = null;
      setHasSelection(false);
      setIsTextSelected(false);
      setToolbarPosition(null);
    });
    canvas.on('object:moving', handleTransformStart);
    canvas.on('object:scaling', handleTransformStart);
    canvas.on('object:rotating', handleRotating);

    // Track user canvas modifications into history & finish dragging
    canvas.on('object:modified', () => {
      handleTransformEnd();
      saveHistoryState();
    });
    canvas.on('mouse:up', handleTransformEnd);

    // Keyboard shortcuts for Undo (Ctrl+Z) & Redo (Ctrl+Y / Ctrl+Shift+Z)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
      canvasInstanceRef.current = null;
      setCanvasVersion(0);
    };
  }, [saveHistoryState, handleUndo, handleRedo]);

  // Generate SVG Star Emblem
  const createStarEmblem = useCallback(() => {
    const pathData =
      'M 50 0 L 62 38 L 100 50 L 62 62 L 50 100 L 38 62 L 0 50 L 38 38 Z';
    const star = new fabric.Path(pathData, {
      left: 880,
      top: 50,
      fill: '#7dd3fc',
      scaleX: 0.7,
      scaleY: 0.7,
      selectable: true,
    });
    return star;
  }, []);

  // Generate standard fallback card elements if template has no Polotno design
  const createDefaultTemplateObjects = useCallback(() => {
    const textMap: { [key: string]: fabric.Textbox } = {};

    // 1. Logo
    const logoObj = new fabric.Textbox(details.logoText || 'Logo', {
      left: 70,
      top: 55,
      width: 250,
      fontSize: 28,
      fontFamily: 'Inter',
      fontWeight: '600',
      fill: '#1e293b',
      selectable: true,
    });
    (logoObj as any).name = 'logoText';
    textMap['logoText'] = logoObj;

    // 2. Star Emblem
    const starObj = createStarEmblem();

    // 3. Full Name
    const nameObj = new fabric.Textbox(details.fullName || 'Sreehari K P', {
      left: 70,
      top: 175,
      width: 600,
      fontSize: 42,
      fontFamily: 'Inter',
      fontWeight: 'bold',
      fill: '#1e3a8a',
      selectable: true,
    });
    (nameObj as any).name = 'fullName';
    textMap['fullName'] = nameObj;

    // 4. Tagline / Profession
    const taglineObj = new fabric.Textbox(
      (details.tagline || 'CPA, ACCOUNTANT').toUpperCase(),
      {
        left: 70,
        top: 245,
        width: 600,
        fontSize: 20,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        fill: '#60a5fa',
        selectable: true,
      },
    );
    (taglineObj as any).name = 'tagline';
    textMap['tagline'] = taglineObj;

    // 5. Specialty
    const specialtyObj = new fabric.Textbox('Tagline / specialty', {
      left: 70,
      top: 310,
      width: 500,
      fontSize: 18,
      fontFamily: 'Inter',
      fontWeight: '500',
      fill: '#334155',
      selectable: true,
    });

    // 6. Contact Stack
    const phoneObj = new fabric.Textbox(details.phone || 'Phone', {
      left: 70,
      top: 390,
      width: 450,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#334155',
      selectable: true,
    });
    (phoneObj as any).name = 'phone';
    textMap['phone'] = phoneObj;

    const emailObj = new fabric.Textbox(details.email || 'ncoder08@gmail.com', {
      left: 70,
      top: 425,
      width: 500,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#334155',
      selectable: true,
    });
    (emailObj as any).name = 'email';
    textMap['email'] = emailObj;

    const websiteObj = new fabric.Textbox(details.website || 'Website', {
      left: 70,
      top: 460,
      width: 450,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#0284c7',
      selectable: true,
    });
    (websiteObj as any).name = 'website';
    textMap['website'] = websiteObj;

    return {
      objects: [
        logoObj,
        starObj,
        nameObj,
        taglineObj,
        specialtyObj,
        phoneObj,
        emailObj,
        websiteObj,
      ],
      backgroundColor: '#ffffff',
      textObjectMap: textMap,
    };
  }, [details, createStarEmblem]);

  // Render front template (converts Polotno template if available, else uses default layout)
  const renderFrontTemplate = useCallback(
    async (canvas: fabric.Canvas) => {
      isHistoryProcessing.current = true;
      canvas.discardActiveObject();
      setHasSelection(false);
      setIsTextSelected(false);
      setToolbarPosition(null);

      const width = selectedTemplate?.widthPx || 1050;
      const height = selectedTemplate?.heightPx || 600;
      canvas.setDimensions({ width, height });

      let templateData: {
        objects: fabric.FabricObject[];
        backgroundColor: string;
        textObjectMap: { [key: string]: fabric.Textbox };
      } | null = null;

      if (selectedTemplate?.polotnoJson?.pages?.[0]?.children?.length) {
        try {
          templateData = await parseTemplateToFabric(selectedTemplate, details);
        } catch (err) {
          console.warn('Failed to parse Polotno template, using fallback layout:', err);
        }
      }

      if (!templateData || templateData.objects.length === 0) {
        templateData = createDefaultTemplateObjects();
      }

      canvas.clear();
      canvas.backgroundColor = templateData.backgroundColor;
      textObjectMap.current = templateData.textObjectMap;

      templateData.objects.forEach((obj) => canvas.add(obj));
      canvas.renderAll();

      const json = (canvas as any).toObject(['name']);
      frontJsonRef.current = json;
      history.current = [JSON.stringify(json)];
      historyIndex.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      isHistoryProcessing.current = false;
    },
    [selectedTemplate, details, createDefaultTemplateObjects]
  );

  // Re-render template layout whenever selectedTemplate changes or a new canvas is mounted
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    if (skipTemplateResetRef.current) {
      skipTemplateResetRef.current = false;
      return;
    }

    // When template changes, reset to front side view
    setActiveSide('front');
    backJsonRef.current = null;
    setHasBackSide(false);

    renderFrontTemplate(canvas);
  }, [selectedTemplate, canvasVersion, renderFrontTemplate]);

  // Render Back Side Card with default white color
  const renderBackSide = useCallback((canvas: fabric.Canvas) => {
    isHistoryProcessing.current = true;
    canvas.clear();
    // Default white background color for the backside of the card
    canvas.backgroundColor = '#ffffff';

    const width = selectedTemplate?.widthPx || 1050;
    const height = selectedTemplate?.heightPx || 600;
    canvas.setDimensions({ width, height });

    // Stylized emblem box on white background
    const emblemBox = new fabric.Rect({
      left: 485,
      top: 130,
      width: 80,
      height: 80,
      rx: 16,
      ry: 16,
      fill: '#f1f5f9',
      stroke: '#cbd5e1',
      strokeWidth: 1.5,
      selectable: true,
    });

    const initials = details.logoText ? details.logoText.slice(0, 2).toUpperCase() : 'MV';
    const emblemText = new fabric.Textbox(initials, {
      left: 485,
      top: 150,
      width: 80,
      fontSize: 34,
      fontFamily: 'Space Grotesk, Inter, sans-serif',
      fontWeight: 'bold',
      fill: '#0f172a',
      textAlign: 'center',
      selectable: true,
    });

    // Back Name
    const backName = new fabric.Textbox((details.fullName || 'Enter name').toUpperCase(), {
      left: 175,
      top: 245,
      width: 700,
      fontSize: 32,
      fontFamily: 'Space Grotesk, Inter, sans-serif',
      fontWeight: 'bold',
      fill: '#0f172a',
      textAlign: 'center',
      charSpacing: 140,
      selectable: true,
    });

    // Back Tagline / Title
    const backTagline = new fabric.Textbox((details.tagline || 'CPA, Accountant').toUpperCase(), {
      left: 175,
      top: 298,
      width: 700,
      fontSize: 16,
      fontFamily: 'Space Grotesk, Inter, sans-serif',
      fontWeight: '600',
      fill: '#2563eb',
      textAlign: 'center',
      charSpacing: 100,
      selectable: true,
    });

    // Back Contact / Web
    const backWeb = new fabric.Textbox(details.website || 'www.website.com', {
      left: 175,
      top: 410,
      width: 700,
      fontSize: 17,
      fontFamily: 'Space Grotesk, Inter, sans-serif',
      fontWeight: '500',
      fill: '#64748b',
      textAlign: 'center',
      charSpacing: 50,
      selectable: true,
    });

    canvas.add(emblemBox, emblemText, backName, backTagline, backWeb);
    canvas.renderAll();
    isHistoryProcessing.current = false;
  }, [selectedTemplate, details]);

  // Handle switching between Front and Back of the card
  const handleSwitchSide = useCallback(
    async (targetSide: 'front' | 'back') => {
      const canvas = canvasInstanceRef.current;
      if (!canvas || activeSide === targetSide) return;

      canvas.discardActiveObject();
      setHasSelection(false);
      setIsTextSelected(false);
      setToolbarPosition(null);

      // Save current side state
      if (activeSide === 'front') {
        frontJsonRef.current = (canvas as any).toObject(['name']);
      } else {
        backJsonRef.current = (canvas as any).toObject(['name']);
      }

      // Switch and load or render the target side
      if (targetSide === 'front') {
        if (frontJsonRef.current) {
          await canvas.loadFromJSON(frontJsonRef.current);
          canvas.renderAll();
        } else {
          await renderFrontTemplate(canvas);
        }
      } else {
        if (backJsonRef.current) {
          await canvas.loadFromJSON(backJsonRef.current);
          canvas.renderAll();
        } else {
          renderBackSide(canvas);
        }
      }

      setActiveSide(targetSide);
    },
    [activeSide, canvasInstanceRef, renderBackSide, renderFrontTemplate]
  );

  // Add Back Side to the card
  const handleAddBackSide = useCallback(async () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    setHasBackSide(true);

    // Save front side state
    canvas.discardActiveObject();
    setHasSelection(false);
    setIsTextSelected(false);
    setToolbarPosition(null);
    frontJsonRef.current = (canvas as any).toObject(['name']);

    // Render back side
    renderBackSide(canvas);
    setActiveSide('back');
  }, [canvasInstanceRef, renderBackSide]);

  // Remove Back Side from the card
  const handleRemoveBackSide = useCallback(async () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    // Discard back side state
    backJsonRef.current = null;
    setHasBackSide(false);

    // Switch back to front
    canvas.discardActiveObject();
    setHasSelection(false);
    setIsTextSelected(false);
    setToolbarPosition(null);

    if (frontJsonRef.current) {
      await canvas.loadFromJSON(frontJsonRef.current);
      canvas.renderAll();
    } else {
      await renderFrontTemplate(canvas);
    }

    setActiveSide('front');
  }, [canvasInstanceRef, renderFrontTemplate]);

  // Expose entire card data (both front and back sides + rendered PNG images)
  const getCardCanvasData = useCallback(async (): Promise<CanvasSideData> => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) {
      return {
        front: null,
        back: null,
        hasBackSide,
        activeSide,
        frontImage: null,
        backImage: null,
      };
    }

    // Save active side current state
    const currentJson = (canvas as any).toObject(['name']);
    const currentDataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    });

    let frontJson = activeSide === 'front' ? currentJson : frontJsonRef.current;
    let backJson = activeSide === 'back' ? currentJson : backJsonRef.current;

    let frontImage: string | null = activeSide === 'front' ? currentDataUrl : null;
    let backImage: string | null = activeSide === 'back' ? currentDataUrl : null;

    const renderSideToDataUrl = async (sideJson: any): Promise<string | null> => {
      if (!sideJson) return null;
      try {
        const tempEl = document.createElement('canvas');
        const w = sideJson.width || canvas.getWidth() || 1050;
        const h = sideJson.height || canvas.getHeight() || 600;
        tempEl.width = w;
        tempEl.height = h;
        const tempCanvas = new fabric.Canvas(tempEl, { width: w, height: h });
        if (sideJson.objects && Array.isArray(sideJson.objects)) {
          for (const obj of sideJson.objects) {
            if (obj.fontFamily) {
              await ensureFontLoaded(obj.fontFamily, obj.fontWeight || 400);
            }
          }
        }
        await tempCanvas.loadFromJSON(sideJson);
        tempCanvas.renderAll();
        const url = tempCanvas.toDataURL({ format: 'png', multiplier: 2 });
        tempCanvas.dispose();
        return url;
      } catch (err) {
        console.warn('Could not render offscreen canvas side:', err);
        return null;
      }
    };

    if (!frontImage && frontJson) {
      frontImage = await renderSideToDataUrl(frontJson);
    }

    if (hasBackSide && !backImage && backJson) {
      backImage = await renderSideToDataUrl(backJson);
    }

    return {
      front: frontJson,
      back: hasBackSide ? backJson : null,
      hasBackSide,
      activeSide,
      frontImage,
      backImage: hasBackSide ? backImage : null,
    };
  }, [activeSide, hasBackSide, canvasInstanceRef]);

  // Load imported card data into the canvas
  const loadCardCanvasData = useCallback(
    async (canvasData: {
      front: any;
      back: any | null;
      hasBackSide: boolean;
    }) => {
      const canvas = canvasInstanceRef.current;
      if (!canvas) return;

      isHistoryProcessing.current = true;
      skipTemplateResetRef.current = true;

      canvas.discardActiveObject();
      setHasSelection(false);
      setIsTextSelected(false);
      setToolbarPosition(null);

      const hasBack = !!canvasData.hasBackSide || !!canvasData.back;
      setHasBackSide(hasBack);
      frontJsonRef.current = canvasData.front;
      backJsonRef.current = canvasData.back || null;

      // Preload fonts for front objects
      if (canvasData.front?.objects && Array.isArray(canvasData.front.objects)) {
        for (const obj of canvasData.front.objects) {
          if (obj.fontFamily) {
            await ensureFontLoaded(obj.fontFamily, obj.fontWeight || 400);
          }
        }
      }

      if (canvasData.front) {
        if (canvasData.front.width && canvasData.front.height) {
          canvas.setDimensions({
            width: canvasData.front.width,
            height: canvasData.front.height,
          });
        }
        await canvas.loadFromJSON(canvasData.front);
        canvas.renderAll();

        // Reconnect textObjectMap references
        textObjectMap.current = {};
        canvas.getObjects().forEach((obj) => {
          const name = (obj as any).name;
          if (name && obj instanceof fabric.Textbox) {
            textObjectMap.current[name] = obj;
          }
        });
      }

      setActiveSide('front');

      // Reset history to loaded state
      const initialJson = JSON.stringify(canvas.toJSON());
      history.current = [initialJson];
      historyIndex.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      isHistoryProcessing.current = false;
    },
    [canvasInstanceRef],
  );

  // Bind methods to workspaceRef
  useEffect(() => {
    if (workspaceRef) {
      workspaceRef.current = {
        getCardCanvasData,
        loadCardCanvasData,
      };
    }
    return () => {
      if (workspaceRef) {
        workspaceRef.current = null;
      }
    };
  }, [workspaceRef, getCardCanvasData, loadCardCanvasData]);

  // Synchronize sidebar input changes into the live canvas & record to history
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || isHistoryProcessing.current) return;

    let hasChange = false;

    if (textObjectMap.current['fullName']) {
      textObjectMap.current['fullName'].set('text', details.fullName || 'Full name');
      hasChange = true;
    }
    if (textObjectMap.current['email']) {
      textObjectMap.current['email'].set('text', details.email || 'Email');
      hasChange = true;
    }
    if (textObjectMap.current['phone']) {
      textObjectMap.current['phone'].set('text', details.phone || 'Phone');
      hasChange = true;
    }
    if (textObjectMap.current['tagline']) {
      textObjectMap.current['tagline'].set(
        'text',
        (details.tagline || 'Tagline / specialty').toUpperCase(),
      );
      hasChange = true;
    }
    if (textObjectMap.current['website']) {
      textObjectMap.current['website'].set('text', details.website || 'Website');
      hasChange = true;
    }
    if (textObjectMap.current['logoText']) {
      textObjectMap.current['logoText'].set('text', details.logoText || 'Logo');
      hasChange = true;
    }

    if (hasChange) {
      canvas.renderAll();
      saveHistoryState();
    }
  }, [details, saveHistoryState]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set('fill', color);
      canvas.renderAll();
      saveHistoryState();
    }
  };

  const handleDelete = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      setHasSelection(false);
      setIsTextSelected(false);
      setToolbarPosition(null);
      canvas.renderAll();
      saveHistoryState();
    }
  };

  const handleCycleAlign = () => {
    const nextAlign = textAlign === 'left' ? 'center' : textAlign === 'center' ? 'right' : 'left';
    handleTextAlignChange(nextAlign);
  };

  const handleFontChange = async (fontFamily: string) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    setSelectedFont(fontFamily);
    await applyFontToActiveText(canvas, fontFamily, () => {
      saveHistoryState();
    });
  };

  const handleFontSizeChange = (deltaOrValue: number, isAbsolute: boolean = false) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || !('fontSize' in active)) return;

    const current = (active as any).fontSize || 24;
    const newSize = Math.max(8, Math.min(200, isAbsolute ? deltaOrValue : current + deltaOrValue));

    (active as any).set('fontSize', newSize);
    if (typeof (active as any).initDimensions === 'function') {
      (active as any).initDimensions();
    }
    active.setCoords();
    canvas.requestRenderAll();
    setSelectedFontSize(newSize);
    saveHistoryState();
  };

  const handleToggleBold = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || !('fontWeight' in active)) return;

    const nextBold = !isBold;
    (active as any).set('fontWeight', nextBold ? 'bold' : 'normal');
    if (typeof (active as any).initDimensions === 'function') {
      (active as any).initDimensions();
    }
    active.setCoords();
    canvas.requestRenderAll();
    setIsBold(nextBold);
    saveHistoryState();
  };

  const handleToggleItalic = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || !('fontStyle' in active)) return;

    const nextItalic = !isItalic;
    (active as any).set('fontStyle', nextItalic ? 'italic' : 'normal');
    if (typeof (active as any).initDimensions === 'function') {
      (active as any).initDimensions();
    }
    active.setCoords();
    canvas.requestRenderAll();
    setIsItalic(nextItalic);
    saveHistoryState();
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || !('textAlign' in active)) return;

    (active as any).set('textAlign', align);
    canvas.requestRenderAll();
    setTextAlign(align);
    saveHistoryState();
  };

  // Fit specifically based on Business Card dimensions (1050 × 600 px)
  const fitBusinessCard = useCallback(() => {
    if (!containerRef.current) return;
    const cardWidth = 1050;
    const cardHeight = 600;
    const availableW = containerRef.current.clientWidth - 100;
    // Account for top spacing, thumbnail buttons (~50px), and bottom zoom pill (~50px)
    const availableH = containerRef.current.clientHeight - 220;

    if (availableW > 0 && availableH > 0) {
      const scaleX = availableW / cardWidth;
      const scaleY = availableH / cardHeight;
      const fitScale = Math.min(scaleX, scaleY);
      const optimalZoom = Math.min(100, Math.max(30, Math.round(fitScale * 100)));
      setZoomLevel(optimalZoom);
    }
  }, []);

  // Automatically fit Business Card on initial mount and on window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      fitBusinessCard();
    }, 100);

    window.addEventListener('resize', fitBusinessCard);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', fitBusinessCard);
    };
  }, [fitBusinessCard]);

  const changeZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(200, Math.max(30, prev + delta)));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#eceef2] overflow-hidden select-none relative">
      {/* Top Header: Front/Back Segmented Switcher & Spec Tag */}
      <div className="flex items-center justify-between px-6 py-4 z-20">
        {hasBackSide ? (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-[#dfe2e8] p-1 rounded-xl shadow-xs">
              <button
                type="button"
                onClick={() => handleSwitchSide('front')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSide === 'front'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSide('back')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSide === 'back'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Back
              </button>
            </div>

            {/* Remove Back Side Option */}
            {activeSide === 'back' && (
              <button
                type="button"
                onClick={handleRemoveBackSide}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-600 text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Remove back side from card"
              >
                <svg className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Remove back side</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="bg-[#dfe2e8] p-1 rounded-xl shadow-xs">
              <span className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 shadow-sm inline-block">
                Front
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddBackSide}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-blue-600 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Add back side to this card"
            >
              <span className="text-blue-600 font-bold text-sm leading-none">+</span>
              <span>Add back side</span>
            </button>
          </div>
        )}

        {/* Top Right: Specifications badge */}
        <div className="text-xs font-medium text-slate-500 select-none">
          3.5 × 2 in · 16 pt matte
        </div>
      </div>

      {/* Canvas Viewport Container */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center p-6 pb-20 overflow-auto relative"
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
          className="relative bg-white shadow-2xl rounded-xs select-none"
        >
          <canvas ref={canvasRef} />

          {/* Floating Contextual Popup Toolbar directly above the active element */}
          {hasSelection && toolbarPosition && !isDragging && (
            <FloatingElementToolbar
              position={toolbarPosition}
              isText={isTextSelected}
              fontFamily={selectedFont}
              fontSize={selectedFontSize}
              isBold={isBold}
              isItalic={isItalic}
              textAlign={textAlign}
              color={selectedColor}
              onFontChange={handleFontChange}
              onFontSizeChange={(delta) => handleFontSizeChange(delta)}
              onToggleBold={handleToggleBold}
              onToggleItalic={handleToggleItalic}
              onCycleAlign={handleCycleAlign}
              onColorChange={handleColorChange}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Directly Below Card: Front & Back Miniature Thumbnail Switcher */}
        {hasBackSide ? (
          <div className="flex items-center justify-center gap-3 mt-6 mb-12 z-20 select-none">
            {/* Front Thumbnail */}
            <button
              type="button"
              onClick={() => handleSwitchSide('front')}
              className={`w-18 h-12 rounded-lg bg-white flex items-end p-2 transition-all cursor-pointer ${
                activeSide === 'front'
                  ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'border border-slate-300 hover:border-slate-400 opacity-80 hover:opacity-100 shadow-xs'
              }`}
              title="Switch to Front"
            >
              <span className="text-[11px] font-bold text-slate-900 leading-none">Front</span>
            </button>

            {/* Back Thumbnail with Remove Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => handleSwitchSide('back')}
                className={`w-18 h-12 rounded-lg bg-white flex items-end p-2 transition-all cursor-pointer ${
                  activeSide === 'back'
                    ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                    : 'border border-slate-300 hover:border-blue-500 opacity-80 hover:opacity-100 shadow-xs'
                }`}
                title="Switch to Back"
              >
                <span className="text-[11px] font-bold text-slate-900 leading-none">Back</span>
              </button>

              {/* Remove Back Side Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveBackSide();
                }}
                title="Remove back side"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-600 hover:bg-red-600 text-white flex items-center justify-center text-xs shadow-md transition-all hover:scale-110 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 mt-6 mb-12 z-20 select-none">
            {/* Front Thumbnail */}
            <div
              className="w-18 h-12 rounded-lg bg-white flex items-end p-2 border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20"
              title="Front side (active)"
            >
              <span className="text-[11px] font-bold text-slate-900 leading-none">Front</span>
            </div>

            {/* Add Back Side Button */}
            <button
              type="button"
              onClick={handleAddBackSide}
              className="h-12 px-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white/70 hover:bg-white text-slate-600 hover:text-blue-600 flex items-center gap-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
              title="Add back side to this card"
            >
              <span className="text-base font-bold text-blue-600 transition-transform group-hover:scale-125">+</span>
              <span>Add back side</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Center Floating Zoom Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white rounded-xl shadow-md border border-slate-200/70 px-4 py-1.5 flex items-center gap-3 select-none">
        <button
          onClick={() => changeZoom(-10)}
          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold cursor-pointer transition-colors"
          title="Zoom out"
        >
          -
        </button>
        <span className="text-xs font-semibold text-slate-700 min-w-10 text-center">
          {zoomLevel}%
        </span>
        <button
          onClick={() => changeZoom(10)}
          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 font-bold cursor-pointer transition-colors"
          title="Zoom in"
        >
          +
        </button>
        <div className="w-px h-3.5 bg-slate-200" />
        <button
          onClick={fitBusinessCard}
          className="text-xs font-semibold text-slate-700 hover:text-blue-600 cursor-pointer transition-colors"
          title="Fit to screen"
        >
          Fit
        </button>
      </div>
    </div>
  );
};
