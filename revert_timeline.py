import re

with open('src/app/page.tsx.bak', 'r') as f:
    old_content = f.read()

pattern = re.compile(r"  const renderTimeline = \(\) => \{.*?(?=  const pathParts = currentPath\.split)", re.DOTALL)
match = pattern.search(old_content)
if not match:
    print("Could not find old renderTimeline")
    exit(1)

old_timeline = match.group(0)

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

new_content = pattern.sub(old_timeline, content)

with open('src/app/page.tsx', 'w') as f:
    f.write(new_content)

print("Reverted renderTimeline successfully.")
