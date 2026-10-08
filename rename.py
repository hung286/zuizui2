import os

def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Replaced in {path}')

files = [
    'src/components/admin/ConfigTab.tsx',
    'src/components/admin/MaterialsTab.tsx',
    'src/components/admin/QuestionBankTab.tsx',
    'src/App.tsx'
]

# ConfigTab.tsx
replace_in_file(files[0], "name: 'TOÁN HỌC', org: 'LỚP TOÁN THẦY HÙNG'", "name: 'TOÁN PRO', org: 'LỚP TOÁN THẦY HÙNG'")

# MaterialsTab.tsx
replace_in_file(files[1], "Anh hùng Liệt sĩ Nguyễn Văn Trỗi", "Lớp Toán Thầy Hùng")
replace_in_file(files[1], "TIỂU SỬ VÀ SỰ NGHIỆP CÁCH MẠNG ANH HÙNG NGUYỄN VĂN TRỖI", "GIỚI THIỆU LỚP TOÁN THẦY HÙNG")
replace_in_file(files[1], "Anh hùng Nguyễn Văn Trỗi", "Lớp Toán Thầy Hùng")
replace_in_file(files[1], "anh Trỗi", "Thầy Hùng")
replace_in_file(files[1], "Nguyễn Văn Trỗi", "Thầy Hùng")

# QuestionBankTab.tsx
replace_in_file(files[2], "Anh hùng Nguyễn Văn Trỗi", "Lớp Toán Thầy Hùng")
replace_in_file(files[2], "Nguyễn Văn Trỗi", "Lớp Toán Thầy Hùng")
replace_in_file(files[2], "anh hùng", "lớp toán")

