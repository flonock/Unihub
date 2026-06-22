import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BASE_DIR = '/home/apollon/Documents/Uni';

export async function POST(request: Request) {
  try {
    const { folderPath } = await request.json();
    if (!folderPath) throw new Error("Invalid path");
    
    const target = path.join(BASE_DIR, folderPath);
    
    // Prevent directory traversal
    if (!target.startsWith(BASE_DIR)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    
    await fs.mkdir(target, { recursive: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create folder' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { folderPath } = await request.json();
    if (!folderPath) throw new Error("Invalid path");
    
    const target = path.join(BASE_DIR, folderPath);
    
    if (!target.startsWith(BASE_DIR)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    
    await fs.rm(target, { recursive: true, force: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete folder' }, { status: 500 });
  }
}
