import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

function getSettings() {
    try {
        const settingsPath = path.join(process.cwd(), 'settings.json');
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading settings.json:', e);
    }
    return { homeFolder: '/home/apollon/Documents/Uni' };
}

export async function POST(request: Request) {
  try {
    const { filePath, type } = await request.json();
    if (!filePath) return NextResponse.json({ error: 'No file path provided' }, { status: 400 });

    const settings = getSettings();
    const BASE_DIR = settings.homeFolder;

    const fullPath = path.join(BASE_DIR, filePath);
    
    if (!fullPath.startsWith(BASE_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    let targetFile = fullPath;

    if (type === 'xournal') {
       if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
           const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.xopp'));
           if (files.length > 0) {
               const sortedFiles = files.map(f => {
                   const p = path.join(fullPath, f);
                   return { name: f, path: p, mtime: fs.statSync(p).mtimeMs };
               }).sort((a, b) => b.mtime - a.mtime);
               targetFile = sortedFiles[0].path;
           } else {
               const dirName = path.basename(fullPath);
               targetFile = path.join(fullPath, `${dirName}.xopp`);
           }
       }
    }

    // Template copying logic for any .xopp file that doesn't exist yet
    if (targetFile.endsWith('.xopp') && !fs.existsSync(targetFile)) {
        const templatePath = path.join(BASE_DIR, 'template.xopp');
        if (fs.existsSync(templatePath)) {
            fs.copyFileSync(templatePath, targetFile);
            console.log(`Copied template.xopp to ${targetFile}`);
        } else {
            console.log(`No template.xopp found at ${templatePath}, opening empty/missing file.`);
        }
    }

    let command = `xdg-open "${targetFile}"`;
    if (targetFile.endsWith('.xopp') || type === 'xournal') {
        command = `xournalpp "${targetFile}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.error(`Error opening file: ${error}`);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to open file' }, { status: 500 });
  }
}
