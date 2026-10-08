import os

def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

s_path = 'src/utils/storage.ts'
replace_in_file(s_path, "ANH HÙNG NGUYỄN VĂN TRỖI", "TOÁN PRO")
replace_in_file(s_path, "Khí phách lẫm liệt của người chiến sĩ Biệt động Sài Gòn bất tử", "Nền tảng học toán tương tác và luyện thi thông minh")
replace_in_file(s_path, "Trường THPT Nguyễn Văn Trỗi", "LỚP TOÁN THẦY HÙNG")
replace_in_file(s_path, "Anh hùng Liệt sĩ Nguyễn Văn Trỗi", "Lớp Toán Thầy Hùng")

q_path = 'src/data/defaultQuestions.ts'
replace_in_file(q_path, "Anh hùng Nguyễn Văn Trỗi", "Thầy Hùng")
replace_in_file(q_path, "Nguyễn Văn Trỗi", "Thầy Hùng")
replace_in_file(q_path, "anh hùng Nguyễn Văn Trỗi", "Thầy Hùng")
replace_in_file(q_path, "anh Trỗi", "Thầy Hùng")
