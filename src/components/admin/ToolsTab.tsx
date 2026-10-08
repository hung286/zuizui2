import React, { useState, useEffect } from 'react';
import { TeachingTool, ToolType } from '../../types';
import { getTeachingTools, saveTeachingTools } from '../../utils/storage';
import { Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { soundFx } from '../../utils/sound';

export const ToolsTab: React.FC = () => {
  const [tools, setTools] = useState<TeachingTool[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTool, setCurrentTool] = useState<Partial<TeachingTool>>({});

  useEffect(() => {
    setTools(getTeachingTools());
  }, []);

  const handleSave = () => {
    if (!currentTool.name || !currentTool.url) return;
    
    let updatedTools;
    if (currentTool.id) {
      updatedTools = tools.map(t => t.id === currentTool.id ? { ...t, ...currentTool } as TeachingTool : t);
    } else {
      const newTool: TeachingTool = {
        id: Math.random().toString(36).substr(2, 9),
        name: currentTool.name,
        type: currentTool.type || 'geogebra',
        category: currentTool.category || 'khac',
        url: currentTool.url,
        description: currentTool.description || '',
        isActive: currentTool.isActive ?? true,
        createdAt: new Date().toISOString()
      };
      updatedTools = [...tools, newTool];
    }
    
    setTools(updatedTools);
    saveTeachingTools(updatedTools);
    setIsEditing(false);
    setCurrentTool({});
    soundFx.playClick();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa công cụ này?')) {
      const updatedTools = tools.filter(t => t.id !== id);
      setTools(updatedTools);
      saveTeachingTools(updatedTools);
      soundFx.playClick();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Quản lý Công cụ & Geogebra</h3>
        <button
          onClick={() => {
            setCurrentTool({ type: 'geogebra', isActive: true });
            setIsEditing(true);
            soundFx.playClick();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm công cụ
        </button>
      </div>

      {isEditing && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h4 className="font-bold">{currentTool.id ? 'Sửa công cụ' : 'Thêm công cụ mới'}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1">Tên công cụ</label>
              <input
                className="w-full p-2 border rounded-lg"
                value={currentTool.name || ''}
                onChange={e => setCurrentTool({...currentTool, name: e.target.value})}
                placeholder="VD: Mô phỏng hình học Geogebra"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Loại Nhúng</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={currentTool.type || 'geogebra'}
                onChange={e => setCurrentTool({...currentTool, type: e.target.value as ToolType})}
              >
                <option value="geogebra">Geogebra</option>
                <option value="iframe">Nhúng (Iframe)</option>
                <option value="url">Link mở ngoài</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Chuyên mục</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={currentTool.category || 'khac'}
                onChange={e => setCurrentTool({...currentTool, category: e.target.value as any})}
              >
                <option value="thao-tac">Trợ lý Thao tác</option>
                <option value="tro-choi">Trò chơi Dạy học</option>
                <option value="mo-phong">Mô phỏng 3D</option>
                <option value="chon-hs">Chọn học sinh</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Đường dẫn (URL / ID Geogebra)</label>
              <input
                className="w-full p-2 border rounded-lg"
                value={currentTool.url || ''}
                onChange={e => setCurrentTool({...currentTool, url: e.target.value})}
                placeholder="VD: Link hoặc mã Geogebra ID"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Mô tả ngắn</label>
              <input
                className="w-full p-2 border rounded-lg"
                value={currentTool.description || ''}
                onChange={e => setCurrentTool({...currentTool, description: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border rounded-lg text-sm font-bold"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
            >
              Lưu lại
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(tool => (
          <div key={tool.id} className="border p-4 rounded-xl shadow-sm bg-white flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-slate-800">{tool.name}</h4>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">{tool.type}</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 flex-1">{tool.description}</p>
            
            <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-100">
              <a 
                href={tool.type === 'url' ? tool.url : '#'} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-600 font-bold flex items-center gap-1"
                onClick={e => tool.type !== 'url' && e.preventDefault()}
              >
                <ExternalLink className="w-3 h-3" />
                {tool.type === 'url' ? 'Mở link' : 'Xem trước'}
              </a>
              <div className="flex gap-2">
                <button onClick={() => { setCurrentTool(tool); setIsEditing(true); }} className="text-slate-400 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(tool.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {tools.length === 0 && !isEditing && (
          <div className="col-span-full text-center py-8 text-slate-500 text-sm">
            Chưa có công cụ nào. Hãy thêm công cụ cho học sinh!
          </div>
        )}
      </div>
    </div>
  );
};
