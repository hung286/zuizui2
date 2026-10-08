import os

def replace_in_file(path, old, new):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

s_path = 'src/utils/storage.ts'
replace_in_file(s_path, "'edu_app_config_v31'", "'edu_app_config_v32'")
replace_in_file(s_path, "'edu_question_bank_v31'", "'edu_question_bank_v32'")
replace_in_file(s_path, "'edu_play_history_v31'", "'edu_play_history_v32'")
replace_in_file(s_path, "'edu_student_profile_v31'", "'edu_student_profile_v32'")

# Also let's check App.tsx for any references to LỚP TOÁN THẦY HÙNG or Nguyễn Văn Trỗi
a_path = 'src/App.tsx'
replace_in_file(a_path, "Anh hùng Nguyễn Văn Trỗi", "TOÁN PRO")
replace_in_file(a_path, "Nguyễn Văn Trỗi", "TOÁN PRO")
