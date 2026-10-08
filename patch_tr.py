import os

def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

q_path = 'src/data/defaultQuestions.ts'
replace_in_file(q_path, "Trỗi", "Thầy Hùng")
