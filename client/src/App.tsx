import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { TopNav } from './components/TopNav';
import { Header } from './components/Header';
import { SidebarRail } from './components/SidebarRail';
import { DetailsPanel } from './components/DetailsPanel';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { PreviewModal } from './components/PreviewModal';
import { CardDetails, DesignTemplate, PRODUCTS, SidebarTab } from './types';
import { ensureFontLoaded, applyFontToActiveText } from './utils/fontLoader';

export function App() {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('product');
  const [selectedProductId, setSelectedProductId] = useState<string>('business-card');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  // Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Initial card details matching the user reference image
  const [details, setDetails] = useState<CardDetails>({
    fullName: 'Sreehari K P',
    email: 'ncoder08@gmail.com',
    phone: '',
    tagline: 'CPA, Accountant',
    website: '',
    logoText: 'Logo',
  });

  const canvasInstanceRef = useRef<fabric.Canvas | null>(null);

  // Fetch templates from local NestJS backend
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch('http://localhost:3001/templates');
        if (res.ok) {
          const data: DesignTemplate[] = await res.json();
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplate(data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching templates from backend:', err);
      }
    }
    fetchTemplates();
  }, []);

  const handleUpdateDetails = (updated: Partial<CardDetails>) => {
    setDetails((prev) => ({ ...prev, ...updated }));
  };

  const handleAddText = async (text: string, style: any = {}) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const fontFamily = style.fontFamily || 'Inter';
    await ensureFontLoaded(fontFamily, style.fontWeight || 400);

    const textObj = new fabric.Textbox(text, {
      left: 150,
      top: 150,
      width: 300,
      fontFamily,
      ...style,
    });
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
  };

  const handleSelectFont = async (fontFamily: string) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj && 'fontFamily' in activeObj) {
      await applyFontToActiveText(canvas, fontFamily);
    } else {
      handleAddText('Sample Text', { fontFamily, fontSize: 32 });
    }
  };

  const handleAddShape = (type: 'rect' | 'circle' | 'star') => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;

    if (type === 'rect') {
      const rect = new fabric.Rect({
        left: 200,
        top: 200,
        width: 150,
        height: 90,
        fill: '#38bdf8',
      });
      canvas.add(rect);
      canvas.setActiveObject(rect);
    } else if (type === 'circle') {
      const circle = new fabric.Circle({
        left: 200,
        top: 200,
        radius: 50,
        fill: '#38bdf8',
      });
      canvas.add(circle);
      canvas.setActiveObject(circle);
    } else if (type === 'star') {
      const pathData = 'M 50 0 L 62 38 L 100 50 L 62 62 L 50 100 L 38 62 L 0 50 L 38 38 Z';
      const star = new fabric.Path(pathData, {
        left: 200,
        top: 200,
        fill: '#7dd3fc',
        scaleX: 0.6,
        scaleY: 0.6,
      });
      canvas.add(star);
      canvas.setActiveObject(star);
    }
    canvas.renderAll();
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = PRODUCTS.find((p) => p.id === productId);
    if (prod) {
      setSelectedTemplate((prev) => ({
        id: prev?.id || prod.id,
        slug: prod.id,
        name: prod.name,
        categoryId: prev?.categoryId || null,
        countryCode: prev?.countryCode || null,
        style: prev?.style || null,
        widthPx: prod.widthPx,
        heightPx: prod.heightPx,
        dpi: 300,
        polotnoJson: null,
        editableVariables: null,
        isSystemTemplate: true,
        isActive: true,
      }));
    }
  };

  const handleChangeBackground = (color: string) => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    canvas.backgroundColor = color;
    canvas.renderAll();
  };

  // Export card as PNG file
  const handleExport = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    });
    const link = document.createElement('a');
    link.download = `${selectedTemplate?.slug || 'card-design'}-${activeSide}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Open Preview Modal with high-res render of current canvas
  const handleOpenPreview = () => {
    const canvas = canvasInstanceRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    });
    setPreviewImageUrl(dataUrl);
    setIsPreviewOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#faf8f5]">
      {/* Top Global Navigation Bar (Gnapi Cards) */}
      <TopNav />

      {/* Editor Sub-Header Bar */}
      <Header
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={(t) => setSelectedTemplate(t)}
        activeSide={activeSide}
        onToggleSide={() => setActiveSide((prev) => (prev === 'front' ? 'back' : 'front'))}
        onSave={handleExport}
        onPreview={handleOpenPreview}
      />

      {/* Main Studio Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Far-left Navigation Rail */}
        <SidebarRail activeTab={activeTab} onSelectTab={(t) => setActiveTab(t)} />

        {/* Secondary Details / Tools Panel */}
        <DetailsPanel
          activeTab={activeTab}
          details={details}
          onChangeDetails={handleUpdateDetails}
          onAddText={handleAddText}
          onAddShape={handleAddShape}
          onChangeBackground={handleChangeBackground}
          onSelectFont={handleSelectFont}
          selectedProductId={selectedProductId}
          onSelectProduct={handleSelectProduct}
        />

        {/* Center Canvas Workspace */}
        <CanvasWorkspace
          selectedTemplate={selectedTemplate}
          details={details}
          canvasInstanceRef={canvasInstanceRef}
        />
      </div>

      {/* Preview Modal Popup */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={previewImageUrl}
        side={activeSide === 'front' ? 'Front' : 'Back'}
      />
    </div>
  );
}

export default App;
