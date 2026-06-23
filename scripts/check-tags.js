const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');

const lines = content.split('\n');
const jsxLines = lines.slice(1839, 2566); // 1840 to 2566

let tags = [];
let lineNum = 1840;

const regex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;

for (const line of jsxLines) {
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        if (fullMatch.endsWith('/>')) {
            // Self-closing
            continue;
        }
        if (fullMatch.startsWith('</')) {
            if (tags.length > 0 && tags[tags.length - 1].name === tagName) {
                tags.pop();
            } else {
                console.log(`Mismatch at line ${lineNum}: Expected closing for ${tags.length > 0 ? tags[tags.length - 1].name : 'none'}, but found </${tagName}>`);
                if (tags.length > 0) tags.pop();
            }
        } else if (fullMatch.startsWith('<')) {
            // Ignore some tags if they are in comments, but simple regex should suffice
            tags.push({ name: tagName, line: lineNum });
        }
    }
    lineNum++;
}

console.log("Unclosed tags:");
for (const tag of tags) {
    console.log(`<${tag.name}> opened at line ${tag.line}`);
}
