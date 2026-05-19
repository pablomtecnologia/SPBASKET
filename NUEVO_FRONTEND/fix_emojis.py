import os
import re

def fix_mojibake(text):
    def repl(match):
        s = match.group(0)
        try:
            return s.encode('cp1252').decode('utf-8')
        except:
            return s
    
    # We look for sequences of characters that are in the upper half of Latin-1
    # which typically represent utf-8 bytes misinterpreted as cp1252.
    # A utf-8 sequence starts with a byte >= 0xC2 (Ã, Ä, etc or ð, etc)
    return re.sub(r'[\xC2-\xF4][\x80-\xFF\u0100-\uFFFF]*', repl, text)

for filepath in ['frontend/src/components/ScheduleManager.jsx', 'frontend/src/components/TournamentManager.jsx', 'README.md']:
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    fixed = fix_mojibake(text)
    if fixed != text:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"Fixed {filepath}")
    else:
        print(f"No changes in {filepath}")
