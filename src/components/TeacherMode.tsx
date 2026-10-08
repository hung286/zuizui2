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
