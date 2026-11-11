import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { CardDetails, DesignTemplate } from '../types';
import { FloatingElementToolbar } from './FloatingElementToolbar';
import { applyFontToActiveText } from '../utils/fontLoader';

interface CanvasWorkspaceProps {
  selectedTemplate: DesignTemplate | null;
  details: CardDetails;
  canvasInstanceRef: React.MutableRefObject<fabric.Canvas | null>;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  selectedTemplate,
  details,
  canvasInstanceRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedColor, setSelectedColor] = useState<string>('#1e3a8a');
  const [hasSelection, setHasSelection] = useState<boolean>(false);
  const [canvasVersion, setCanvasVersion] = useState<number>(0);

  // Active text object state
  const [isTextSelected, setIsTextSelected] = useState<boolean>(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
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
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // References to keep track of specific variable text boxes on canvas
  const textObjectMap = useRef<{ [key: string]: fabric.Textbox }>({});

  // Save current canvas state to history
  const saveHistoryState = useCallback(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || isHistoryProcessing.current) return;

    try {
      const json = JSON.stringify(canvas.toJSON());

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

    const updateSelectionState = () => {
      const activeObj = canvas.getActiveObject();
      setHasSelection(!!activeObj);
      if (activeObj && 'fill' in activeObj && typeof activeObj.fill === 'string') {
        setSelectedColor(activeObj.fill);
      }

      if (activeObj) {
        const bound = activeObj.getBoundingRect();
        setToolbarPosition({
          x: bound.left + bound.width / 2,
          y: bound.top,
        });

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
        const bound = activeObj.getBoundingRect();
        setToolbarPosition({
          x: bound.left + bound.width / 2,
          y: bound.top,
        });
      }
    };

    canvas.on('selection:created', updateSelectionState);
    canvas.on('selection:updated', updateSelectionState);
    canvas.on('selection:cleared', () => {
      setHasSelection(false);
      setIsTextSelected(false);
      setToolbarPosition(null);
    });
    canvas.on('object:moving', updatePositionOnly);
    canvas.on('object:scaling', updatePositionOnly);

    // Track user canvas modifications into history
    canvas.on('object:modified', () => saveHistoryState());

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

  // Re-render template layout whenever selectedTemplate changes or a new canvas is mounted
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    // Reset selection & toolbar to prevent ghost floating toolbars on remount
    setHasSelection(false);
    setIsTextSelected(false);
    setToolbarPosition(null);

    isHistoryProcessing.current = true;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    textObjectMap.current = {};

    const width = selectedTemplate?.widthPx || 1050;
    const height = selectedTemplate?.heightPx || 600;

    canvas.setDimensions({ width, height });

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
    textObjectMap.current['logoText'] = logoObj;

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
    textObjectMap.current['fullName'] = nameObj;

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
    textObjectMap.current['tagline'] = taglineObj;

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
    textObjectMap.current['phone'] = phoneObj;

    const emailObj = new fabric.Textbox(details.email || 'ncoder08@gmail.com', {
      left: 70,
      top: 425,
      width: 500,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#334155',
      selectable: true,
    });
    textObjectMap.current['email'] = emailObj;

    const websiteObj = new fabric.Textbox(details.website || 'Website', {
      left: 70,
      top: 460,
      width: 450,
      fontSize: 16,
      fontFamily: 'Inter',
      fill: '#0284c7',
      selectable: true,
    });
    textObjectMap.current['website'] = websiteObj;

    canvas.add(
      logoObj,
      starObj,
      nameObj,
      taglineObj,
      specialtyObj,
      phoneObj,
      emailObj,
      websiteObj,
    );

    canvas.renderAll();

    // Initialize the baseline history state
    const initialJson = JSON.stringify(canvas.toJSON());
    history.current = [initialJson];
    historyIndex.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    isHistoryProcessing.current = false;
  }, [selectedTemplate, canvasVersion]);

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
  const handleSwitchSide = useCallback(async (targetSide: 'front' | 'back') => {
    const canvas = canvasInstanceRef.current;
    if (!canvas || activeSide === targetSide) return;

    canvas.discardActiveObject();
    setHasSelection(false);
    setIsTextSelected(false);
    setToolbarPosition(null);

    // Save current side state
    if (activeSide === 'front') {
      frontJsonRef.current = canvas.toJSON();
    } else {
      backJsonRef.current = canvas.toJSON();
    }

    // Switch and load or render the target side
    if (targetSide === 'front') {
      if (frontJsonRef.current) {
        await canvas.loadFromJSON(frontJsonRef.current);
        canvas.renderAll();
      } else {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        setCanvasVersion((v) => v + 1);
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
  }, [activeSide, canvasInstanceRef, renderBackSide]);

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
    frontJsonRef.current = canvas.toJSON();

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
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      setCanvasVersion((v) => v + 1);
    }

    setActiveSide('front');
  }, [canvasInstanceRef]);

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

  const handleDuplicate = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.clone().then((cloned: fabric.FabricObject) => {
        cloned.set({
          left: (active.left || 0) + 20,
          top: (active.top || 0) + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveHistoryState();
      });
    }
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
          {hasSelection && toolbarPosition && (
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
