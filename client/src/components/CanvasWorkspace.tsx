import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { CardDetails, DesignTemplate } from '../types';
import { FontPickerDropdown } from './FontPickerDropdown';
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

  // Active text object state
  const [isTextSelected, setIsTextSelected] = useState<boolean>(false);
  const [selectedFont, setSelectedFont] = useState<string>('Inter');
  const [selectedFontSize, setSelectedFontSize] = useState<number>(24);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

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

    const updateSelectionState = () => {
      const activeObj = canvas.getActiveObject();
      setHasSelection(!!activeObj);
      if (activeObj && 'fill' in activeObj && typeof activeObj.fill === 'string') {
        setSelectedColor(activeObj.fill);
      }

      if (activeObj && 'fontFamily' in activeObj) {
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
    };

    canvas.on('selection:created', updateSelectionState);
    canvas.on('selection:updated', updateSelectionState);
    canvas.on('selection:cleared', updateSelectionState);

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

  // Generate mock QR Code matrix
  const createQrCode = useCallback(() => {
    const group = new fabric.Group([], {
      left: 840,
      top: 420,
      selectable: true,
    });

    const qrBg = new fabric.Rect({
      width: 140,
      height: 140,
      fill: '#ffffff',
      stroke: '#e2e8f0',
      strokeWidth: 1,
    });
    group.add(qrBg);

    const size = 14;
    const count = 9;
    const matrix = [
      [1, 1, 1, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1],
      [0, 0, 0, 0, 0, 1, 0, 0, 0],
      [1, 0, 1, 1, 0, 1, 1, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 0],
      [1, 0, 1, 0, 0, 1, 0, 1, 1],
      [1, 1, 1, 1, 0, 1, 1, 0, 1],
    ];

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (matrix[r][c] === 1) {
          const pixel = new fabric.Rect({
            left: 7 + c * size,
            top: 7 + r * size,
            width: size - 1,
            height: size - 1,
            fill: '#0f172a',
          });
          group.add(pixel);
        }
      }
    }

    return group;
  }, []);

  // Re-render template layout whenever selectedTemplate changes
  useEffect(() => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

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

    // 7. QR Code
    const qrObj = createQrCode();

    canvas.add(
      logoObj,
      starObj,
      nameObj,
      taglineObj,
      specialtyObj,
      phoneObj,
      emailObj,
      websiteObj,
      qrObj,
    );

    canvas.renderAll();

    // Initialize the baseline history state
    const initialJson = JSON.stringify(canvas.toJSON());
    history.current = [initialJson];
    historyIndex.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    isHistoryProcessing.current = false;
  }, [selectedTemplate]);

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
      canvas.renderAll();
      saveHistoryState();
    }
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

  const changeZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(200, Math.max(50, prev + delta)));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f5] overflow-hidden select-none">
      {/* Sub-toolbar right above canvas */}
      <div className="h-10 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
        {/* Left tools: Exact Undo & Redo curved arrows matching the reference image */}
        <div className="flex items-center gap-2">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
              canUndo
                ? 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer active:scale-95'
                : 'text-neutral-300 cursor-not-allowed opacity-50'
            }`}
            title="Undo (Ctrl + Z)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              {/* Arrowhead pointing left */}
              <path d="M8 5L3 10l5 5" />
              {/* Stem curving down and right */}
              <path d="M3 10h11a5 5 0 0 1 5 5v2" />
            </svg>
          </button>

          {/* Redo Button */}
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
              canRedo
                ? 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer active:scale-95'
                : 'text-neutral-300 cursor-not-allowed opacity-50'
            }`}
            title="Redo (Ctrl + Y)"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              {/* Arrowhead pointing right */}
              <path d="M16 5l5 5-5 5" />
              {/* Stem curving down and left */}
              <path d="M21 10H10a5 5 0 0 0-5 5v2" />
            </svg>
          </button>

          {/* Color swatch picker */}
          <div className="relative flex items-center ml-2 pl-2 border-l border-neutral-200">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-5 h-5 rounded-full border border-neutral-300 cursor-pointer p-0"
              title="Change element color"
            />
          </div>

          {/* Contextual Text Formatting Toolbar (visible when text is selected) */}
          {isTextSelected && (
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-neutral-200 animate-in fade-in duration-150">
              {/* Font Family Dropdown */}
              <FontPickerDropdown
                currentFont={selectedFont}
                onSelectFont={handleFontChange}
              />

              {/* Font Size Controls */}
              <div className="flex items-center border border-neutral-300 rounded h-7 bg-white">
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(-2)}
                  className="w-6 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-l cursor-pointer text-xs font-bold"
                  title="Decrease font size"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-medium text-neutral-800">
                  {selectedFontSize}
                </span>
                <button
                  type="button"
                  onClick={() => handleFontSizeChange(2)}
                  className="w-6 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 rounded-r cursor-pointer text-xs font-bold"
                  title="Increase font size"
                >
                  +
                </button>
              </div>

              {/* Bold Toggle */}
              <button
                type="button"
                onClick={handleToggleBold}
                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                  isBold
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-neutral-700 hover:bg-neutral-100 border border-transparent'
                }`}
                title="Bold"
              >
                B
              </button>

              {/* Italic Toggle */}
              <button
                type="button"
                onClick={handleToggleItalic}
                className={`w-7 h-7 rounded flex items-center justify-center text-xs italic font-serif transition-colors cursor-pointer ${
                  isItalic
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-neutral-700 hover:bg-neutral-100 border border-transparent'
                }`}
                title="Italic"
              >
                I
              </button>

              {/* Alignment Controls */}
              <div className="flex items-center border border-neutral-200 rounded h-7 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => handleTextAlignChange('left')}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    textAlign === 'left' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                  title="Align Left"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleTextAlignChange('center')}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    textAlign === 'center' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                  title="Align Center"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleTextAlignChange('right')}
                  className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    textAlign === 'right' ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                  title="Align Right"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right tools: Position, Info, Duplicate, Trash */}
        <div className="flex items-center gap-3 text-neutral-600 text-xs font-medium">
          <button className="flex items-center gap-1 px-2 py-1 hover:bg-neutral-100 rounded">
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <span>Position</span>
          </button>

          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-100 text-neutral-500" title="Lock">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>

          <button
            onClick={handleDuplicate}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-100 text-neutral-500"
            title="Duplicate selected"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {hasSelection && (
            <button
              onClick={handleDelete}
              className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-50"
              title="Delete selected"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          <button className="w-7 h-7 rounded flex items-center justify-center hover:bg-neutral-100 text-neutral-400" title="Help">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Viewport Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-auto relative"
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
          className="relative p-6 border-2 border-sky-400 rounded bg-white shadow-2xl"
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Bottom Zoom Toolbar */}
      <div className="h-10 bg-white border-t border-neutral-200 px-4 flex items-center justify-center gap-2 select-none">
        <button
          onClick={() => changeZoom(-10)}
          className="w-7 h-7 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold"
          title="Zoom out"
        >
          -
        </button>
        <span className="text-xs font-medium text-neutral-700 min-w-12 text-center">
          {zoomLevel}%
        </span>
        <button
          onClick={() => changeZoom(10)}
          className="w-7 h-7 rounded flex items-center justify-center text-neutral-600 hover:bg-neutral-100 font-bold"
          title="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
};
