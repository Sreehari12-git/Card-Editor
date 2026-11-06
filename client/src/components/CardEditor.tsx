import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { DesignTemplate } from '../types';

interface CardEditorProps {
  selectedTemplate: DesignTemplate | null;
}

export const CardEditor: React.FC<CardEditorProps> = ({ selectedTemplate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedColor, setSelectedColor] = useState<string>('#ffffff');
  const [fontSize, setFontSize] = useState<number>(24);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = selectedTemplate?.widthPx || 1050;
    const height = selectedTemplate?.heightPx || 600;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    fabricCanvasRef.current = canvas;

    const updateSelection = () => {
      const activeObj = canvas.getActiveObject();
      setHasSelection(!!activeObj);
      if (activeObj && 'fill' in activeObj && typeof activeObj.fill === 'string') {
        setSelectedColor(activeObj.fill);
      }
      if (activeObj && 'fontSize' in activeObj && typeof activeObj.fontSize === 'number') {
        setFontSize(activeObj.fontSize);
      }
    };

    canvas.on('selection:created', updateSelection);
    canvas.on('selection:updated', updateSelection);
    canvas.on('selection:cleared', updateSelection);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Update canvas when selectedTemplate changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedTemplate) return;

    canvas.setDimensions({
      width: selectedTemplate.widthPx,
      height: selectedTemplate.heightPx,
    });

    // Clear existing objects
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // Parse Polotno JSON if available to load default text elements
    if (selectedTemplate.polotnoJson?.pages?.[0]?.children) {
      const children = selectedTemplate.polotnoJson.pages[0].children;
      for (const item of children) {
        if (item.type === 'text') {
          const text = new fabric.Textbox(item.text || 'Sample Text', {
            left: item.x || 50,
            top: item.y || 50,
            width: item.width || 300,
            fontSize: item.fontSize || 24,
            fill: item.fill || '#1e293b',
            fontFamily: item.fontFamily || 'Inter',
            fontWeight: item.fontWeight || 'normal',
          });
          canvas.add(text);
        }
      }
    } else {
      // Add default placeholder text
      const title = new fabric.Textbox(selectedTemplate.name, {
        left: 60,
        top: 60,
        width: 600,
        fontSize: 36,
        fill: '#0f172a',
        fontFamily: 'Inter',
        fontWeight: 'bold',
      });
      const subtitle = new fabric.Textbox('Double-click to edit your card details', {
        left: 60,
        top: 130,
        width: 500,
        fontSize: 20,
        fill: '#64748b',
        fontFamily: 'Inter',
      });
      canvas.add(title, subtitle);
    }

    canvas.renderAll();
  }, [selectedTemplate]);

  // Actions
  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const text = new fabric.Textbox('New Text', {
      left: 100,
      top: 100,
      width: 250,
      fontSize: 28,
      fill: selectedColor,
      fontFamily: 'Inter',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRectangle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const rect = new fabric.Rect({
      left: 120,
      top: 120,
      width: 150,
      height: 100,
      fill: selectedColor,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const circle = new fabric.Circle({
      left: 150,
      top: 150,
      radius: 60,
      fill: selectedColor,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set('fill', color);
      canvas.renderAll();
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active && 'fontSize' in active) {
      (active as fabric.Textbox).set('fontSize', size);
      canvas.renderAll();
    }
  };

  const deleteSelected = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const exportAsPng = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `${selectedTemplate?.slug || 'card-design'}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-slate-800 border-b border-slate-700 flex-wrap">
        <button
          onClick={addText}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-100 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
        >
          ➕ Add Text
        </button>
        <button
          onClick={addRectangle}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-100 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
        >
          ⬛ Add Box
        </button>
        <button
          onClick={addCircle}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-100 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
        >
          ⚪ Add Circle
        </button>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        {/* Color Picker */}
        <label className="flex items-center gap-2 text-xs text-slate-300">
          Color:
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded border border-slate-600 cursor-pointer bg-transparent"
          />
        </label>

        {/* Font Size */}
        <label className="flex items-center gap-2 text-xs text-slate-300">
          Size:
          <input
            type="number"
            min="10"
            max="120"
            value={fontSize}
            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            className="w-16 px-2 py-1.5 text-xs text-white bg-slate-900 border border-slate-600 rounded-md focus:outline-none focus:border-blue-500"
          />
        </label>

        {hasSelection && (
          <button
            onClick={deleteSelected}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors"
          >
            🗑️ Delete
          </button>
        )}

        <div className="ml-auto flex gap-2.5">
          <button
            onClick={exportAsPng}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow transition-colors"
          >
            💾 Export PNG
          </button>
        </div>
      </div>

      {/* Canvas Workspace */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-slate-950 p-8 overflow-auto"
      >
        <div className="shadow-2xl rounded-lg overflow-hidden border border-slate-800">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};
