import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

const defaultSettings = {
  homeFolder: '/home/apollon/Documents/Uni',
  workspaceTitle: 'AeroSpace Workspace',
  enableFlicker: true,
  pomoWorkTime: 25,
  pomoBreakTime: 5
};

export async function GET() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json(defaultSettings);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
