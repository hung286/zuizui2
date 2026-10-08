import os
import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

modal_path = 'src/components/ApiKeyModal.tsx'
modal = read_file(modal_path)

# Replace the body of handleClose
pattern = re.compile(r'const handleClose = \(\) => \{.*?\};', re.DOTALL)
replacement = '''const handleClose = () => {
    soundFx.playClick();
    setIsOpen(false);
  };'''

modal = pattern.sub(replacement, modal)

write_file(modal_path, modal)
print("Regex patch applied")
