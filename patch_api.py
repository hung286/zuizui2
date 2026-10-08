import os
import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# Patch ApiKeyModal.tsx
modal_path = 'src/components/ApiKeyModal.tsx'
modal = read_file(modal_path)

# Remove the forced popup on mount
modal = modal.replace('''    if (!savedKey) {
      setIsOpen(true);
    } else {
      setApiKey(savedKey);
      if (savedModel) setSelectedModel(savedModel);
    }''', '''    if (savedKey) {
      setApiKey(savedKey);
      if (savedModel) setSelectedModel(savedModel);
    }''')

# Always show Close button, so change `{hasKey && (` to just show the button always or `{true && (`
modal = modal.replace('{hasKey && (', '{true && (')

# Let's change the handleClose to not alert and just close
modal = modal.replace('''    const savedKey = localStorage.getItem('edu_gemini_api_key');
    if (savedKey) {
      setIsOpen(false);
    } else {
      alert('Bn phi nh-p API Key ` s- dng cAc tA-nh nng AI c a cng dng!');
    }''', '    setIsOpen(false);')
    
# Change the fallback handleClose in the JSX (the Cancel button at the bottom)
modal = modal.replace('''          {hasKey && (
            <button
              onClick={handleClose}''', '''          {true && (
            <button
              onClick={handleClose}''')
              
# Change the close button text from 'Hủy' to 'Bỏ qua / Hủy' or just keep it as 'Đóng / Bỏ qua'
modal = modal.replace('H\u00f7 y', 'Bỏ qua') # The weird 'H\u00f7 y' is likely 'Hủy', let's just replace 'Hủy' correctly

# But it's encoded weirdly in my console, let's just use regex
modal = re.sub(r'>\s*H[^<]*y\s*<', '> Bỏ qua <', modal)

write_file(modal_path, modal)


# Patch gemini.ts to also support import.meta.env.VITE_GEMINI_API_KEY
gemini_path = 'src/utils/gemini.ts'
gemini = read_file(gemini_path)

gemini = gemini.replace("const apiKey = localStorage.getItem('edu_gemini_api_key');", "const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('edu_gemini_api_key');")

write_file(gemini_path, gemini)

print("Patch applied successfully")
