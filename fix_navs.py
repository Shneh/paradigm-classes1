import os
import glob

exclude = ['student-dashboard.html', 'teacher-dashboard.html', 'admin-dashboard.html']
html_files = glob.glob('/Users/shnehrawat/paradigm-classes1/*.html')

for filepath in html_files:
    filename = os.path.basename(filepath)
    if filename in exclude:
        continue
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    with open(filepath, 'w') as f:
        for line in lines:
            if 'href="video-lectures.html"' in line and '>Videos<' in line:
                continue
            f.write(line)
print("Removed video links from public pages.")
