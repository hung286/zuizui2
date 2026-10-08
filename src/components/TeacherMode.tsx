import React, { useState, useEffect } from 'react';
import { TeachingTool, ToolCategory } from '../types';
import { getTeachingTools } from '../utils/storage';
import { MonitorPlay, ExternalLink, Calculator, Gamepad2, Cuboid, Target, PackageOpen, ArrowLeft, Search, Maximize, Minimize } from 'lucide-react';
import { soundFx } from '../utils/sound';

const categories: { id: ToolCategory; label: string; icon: React.ReactNode; color: string; bg: string; desc: string }[] = [
  { id: 'thao-tac', label: 'Trợ lý Thao tác', icon: <Calculator className="w-10 h-10" />, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Công cụ tính toán, đồ thị' },
  { id: 'tro-choi', label: 'Trò chơi Dạy học', icon: <Gamepad2 className="w-10 h-10" />, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Mini game tương tác' },
  { id: 'mo-phong', label: 'Mô phỏng 3D', icon: <Cuboid className="w-10 h-10" />, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Hình học & Không gian' },
  { id: 'chon-hs', label: 'Chọn học sinh', icon: <Target className="w-10 h-10" />, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Vòng quay, gọi tên' },
  { id: 'khac', label: 'Công cụ khác', icon: <PackageOpen className="w-10 h-10" />, color: 'text-slate-500', bg: 'bg-slate-50', desc: 'Các công cụ mở rộng' },
];

export const TeacherMode: React.FC = () => {
  const [tools, setTools] = useState<TeachingTool[]>([]);
  const [activeTool, setActiveTool] = useState<TeachingTool | null>(null);
  
  // View states: 'dashboard' | 'category'
  const [view, setView] = useState<'dashboard' | 'category'>('dashboard');
  const [currentCategory, setCurrentCategory] = useState<ToolCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setTools(getTeachingTools().filter(t => t.isActive));
  }, []);

  const handleToolClick = (tool: TeachingTool) => {
    soundFx.playClick();
    if (tool.type === 'url') {
      window.open(tool.url, '_blank');
    } else {
      setActiveTool(tool);
    }
  };

  const openCategory = (cat: ToolCategory) => {
    soundFx.playClick();
    setCurrentCategory(cat);
    setSearchQuery('');
    setView('category');
  };

  const closeCategory = () => {
    soundFx.playClick();
    setCurrentCategory(null);
    setView('dashboard');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // IFRAME VIEW
  if (activeTool) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col h-screen w-screen">
        <div className="flex justify-between items-center p-3 bg-slate-900 border-b border-slate-700 shadow-lg relative z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setActiveTool(null); soundFx.playClick(); }} 
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg transition font-medium border border-rose-500/30 flex items-center gap-2"
            >
              ✕ <span className="hidden sm:inline">Đóng</span>
            </button>
            <h3 className="text-lg font-bold text-white truncate max-w-xs sm:max-w-md ml-2 drop-shadow-md">
              {activeTool.name}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleFullscreen} 
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition font-medium flex items-center gap-2"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          </div>
        </div>
        
        <div className="flex-grow w-full relative bg-slate-800">
          {activeTool.type === 'geogebra' ? (
            <iframe
              src={`https://www.geogebra.org/material/iframe/id/${activeTool.url}/width/1280/height/720/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/true/rc/false/ld/false/sdz/true/ctl/false`}
              width="100%"
              height="100%"
              style={{ border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              allowFullScreen
              title={activeTool.name}
            />
          ) : (
            <iframe
              src={activeTool.url}
              width="100%"
              height="100%"
              style={{ border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              allowFullScreen
              title={activeTool.name}
            />
          )}
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD OR CATEGORY VIEW
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Area */}
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-5xl font-extrabold mb-3 text-slate-900 tracking-tight">
          Không gian <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Sáng tạo</span>
        </h2>
        <p className="text-slate-500 font-medium">Trợ lý hỗ trợ giảng dạy trực quan dành cho Giáo viên</p>
      </div>

      {view === 'dashboard' ? (
        // DASHBOARD CATEGORIES
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 justify-center">
          {categories.filter(c => c.id !== 'khac' || tools.some(t => t.category === 'khac')).map(cat => {
            const toolCount = tools.filter(t => (t.category || 'khac') === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => openCategory(cat.id)}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center group relative overflow-hidden"
              >
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-5 ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  {cat.icon}
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{cat.label}</h3>
                <p className="text-slate-500 text-sm mb-4">{cat.desc}</p>
                
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {toolCount} công cụ
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        // CATEGORY TOOLS LIST
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={closeCategory}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Quay lại
              </button>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                {categories.find(c => c.id === currentCategory)?.icon}
                {categories.find(c => c.id === currentCategory)?.label}
              </h2>
            </div>
            
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Tìm công cụ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools
              .filter(t => (t.category || 'khac') === currentCategory)
              .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group flex items-start gap-4 bg-slate-50 hover:bg-blue-50/50"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${categories.find(c => c.id === currentCategory)?.bg} ${categories.find(c => c.id === currentCategory)?.color} group-hover:scale-105 transition`}>
                    {tool.type === 'geogebra' ? <span className="font-black text-xs">GGB</span> : <MonitorPlay className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-blue-700 transition-colors mb-1 line-clamp-2">
                      {tool.name}
                    </h4>
                    {tool.description && <p className="text-xs text-slate-500 line-clamp-2">{tool.description}</p>}
                    {tool.type === 'url' && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 mt-2 bg-blue-100 px-2 py-0.5 rounded-full">
                        Mở liên kết ngoài <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
            ))}
            
            {tools.filter(t => (t.category || 'khac') === currentCategory).length === 0 && (
              <div className="col-span-full text-center py-12">
                <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Chưa có công cụ nào trong chuyên mục này.</p>
                <p className="text-slate-400 text-sm mt-1">Vui lòng thêm công cụ từ Admin Studio.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
