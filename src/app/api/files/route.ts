import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  let baseDir = '/home/apollon/Documents/Uni';
  try {
    const settingsRaw = await fs.readFile(path.join(process.cwd(), 'settings.json'), 'utf-8');
    const settings = JSON.parse(settingsRaw);
    if (settings.homeFolder) baseDir = settings.homeFolder;
  } catch(e) {}

  const { searchParams } = new URL(request.url);
  const dirPath = searchParams.get('path') || '';
  const fullPath = path.join(baseDir, dirPath);

  try {
    if (!fullPath.startsWith(baseDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = entries.map(entry => {
      const ext = path.extname(entry.name).toLowerCase().replace('.', '');
      return {
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(dirPath, entry.name),
        ext: ext,
        isPdf: entry.name.endsWith('.pdf'),
        isXopp: entry.name.endsWith('.xopp'),
      };
    });

    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ files, currentPath: dirPath });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
  }
}
