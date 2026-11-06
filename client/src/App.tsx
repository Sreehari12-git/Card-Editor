import { useEffect, useState } from 'react';
import { CardEditor } from './components/CardEditor';
import { DesignCategory, DesignTemplate } from './types';

export function App() {
  const [categories, setCategories] = useState<DesignCategory[]>([]);
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [catsRes, tmplsRes] = await Promise.all([
          fetch('http://localhost:3001/categories'),
          fetch('http://localhost:3001/templates'),
        ]);

        if (!catsRes.ok || !tmplsRes.ok) {
          throw new Error('Failed to fetch from backend server');
        }

        const catsData: DesignCategory[] = await catsRes.json();
        const tmplsData: DesignTemplate[] = await tmplsRes.json();

        setCategories(catsData);
        setTemplates(tmplsData);

        if (tmplsData.length > 0) {
          setSelectedTemplate(tmplsData[0]);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Could not connect to backend');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredTemplates =
    selectedCategory === 'all'
      ? templates
      : templates.filter((t) => t.categoryId === selectedCategory);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100">
      {/* App Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎴</span>
          <h1 className="text-base font-semibold text-white">
            Card Editor{' '}
            <span className="text-xs font-normal text-slate-400">
              (React + TypeScript + Fabric.js + Tailwind)
            </span>
          </h1>
        </div>
        {selectedTemplate && (
          <div className="text-xs text-sky-400 bg-sky-950/60 border border-sky-800/50 px-3 py-1 rounded-full">
            {selectedTemplate.name} ({selectedTemplate.widthPx} × {selectedTemplate.heightPx} px)
          </div>
        )}
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Templates */}
        <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
          {/* Category Filter */}
          <div className="p-4 border-b border-slate-800">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Categories ({templates.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-6">Loading templates from Postgres...</p>
            ) : error ? (
              <div className="p-3 text-xs text-red-300 bg-red-950/50 border border-red-800/40 rounded-lg">
                <p className="font-medium">{error}</p>
                <p className="text-[11px] text-red-400 mt-1">Make sure your NestJS backend is running on port 3001.</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No templates found</p>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-slate-800 border-sky-500 ring-1 ring-sky-500/30'
                        : 'bg-slate-800/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`text-xs font-semibold ${isSelected ? 'text-sky-400' : 'text-slate-200'}`}>
                      {template.name}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                      <span className="capitalize">{template.style || 'Standard'}</span>
                      <span>{template.widthPx} × {template.heightPx}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center Canvas Area */}
        <main className="flex-1 flex overflow-hidden">
          <CardEditor selectedTemplate={selectedTemplate} />
        </main>
      </div>
    </div>
  );
}

export default App;
