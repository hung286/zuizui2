import os
import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Update TeacherMode.tsx
tm_path = 'src/components/TeacherMode.tsx'
tm = read_file(tm_path)
tm = tm.replace("import { getTeachingTools } from '../utils/storage';", "import { getTeachingTools } from '../utils/storage';\nimport { getToolEmbedUrl } from '../utils/tools';")

# Regex to replace the IFFE body
pattern = re.compile(r'let finalUrl = activeTool\.url;.*?return \(\s*<iframe.*?title=\{activeTool\.name\}\s*/>\s*\);', re.DOTALL)
replacement = '''const src = getToolEmbedUrl(activeTool);
              return (
                <iframe
                  src={src}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  allowFullScreen
                  title={activeTool.name}
                />
              );'''

tm_new = pattern.sub(replacement, tm)
write_file(tm_path, tm_new)

# Update ToolsTab.tsx
tt_path = 'src/components/admin/ToolsTab.tsx'
tt = read_file(tt_path)

if 'getToolEmbedUrl' not in tt:
    tt = tt.replace("import { getTeachingTools, saveTeachingTools } from '../../utils/storage';", "import { getTeachingTools, saveTeachingTools } from '../../utils/storage';\nimport { getToolEmbedUrl } from '../../utils/tools';")
    
    tt = tt.replace('const [tools, setTools] = useState<TeachingTool[]>([]);', 'const [tools, setTools] = useState<TeachingTool[]>([]);\n  const [previewTool, setPreviewTool] = useState<TeachingTool | null>(null);')

    tt = tt.replace('''onClick={e => tool.type !== 'url' && e.preventDefault()}''', '''onClick={e => {
                if (tool.type !== 'url') {
                  e.preventDefault();
                  setPreviewTool(tool);
                  soundFx.playClick();
                }
              }}''')

    modal_code = '''
      {previewTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col p-4 md:p-8">
          <div className="flex justify-between items-center mb-4 max-w-6xl mx-auto w-full">
            <h3 className="text-white text-xl font-bold">{previewTool.name}</h3>
            <button 
              onClick={() => { setPreviewTool(null); soundFx.playClick(); }} 
              className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition"
            >
              Đóng xem trước
            </button>
          </div>
          <div className="flex-1 bg-white rounded-xl overflow-hidden max-w-6xl mx-auto w-full relative">
            <iframe 
              src={getToolEmbedUrl(previewTool)} 
              className="absolute inset-0 w-full h-full border-0" 
              allowFullScreen
              title={previewTool.name}
            />
          </div>
        </div>
      )}
    </div>
  );
};'''

    tt = tt.replace('    </div>\n  );\n};', modal_code)
    write_file(tt_path, tt)

print("Patched successfully!")
