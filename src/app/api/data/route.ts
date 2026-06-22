import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

async function getDataFile() {
  let baseDir = '/home/apollon/Documents/Uni';
  try {
    const settingsRaw = await fs.readFile(path.join(process.cwd(), 'settings.json'), 'utf-8');
    const settings = JSON.parse(settingsRaw);
    if (settings.homeFolder) baseDir = settings.homeFolder;
  } catch(e) {}
  return path.join(baseDir, 'workspace_data.json');
}

const defaultData = {
  exams: [
    { id: '1', name: 'Bahnmechanik Exam', date: '2026-07-15', link: 'Semester 2/Bahnmechanik' },
    { id: '2', name: 'Raumsonden Project', date: '2026-07-25', link: 'Semester 2/Raumsonden' }
  ],
  todos: [
    { id: '1', title: 'Finish orbital mechanics assignment', status: false, link: 'Semester 2/Bahnmechanik' },
    { id: '2', title: 'Read SPICE documentation', status: false, link: 'Semester 2/SPICE' },
    { id: '3', title: 'Revise Tsiolkovsky derivation', status: true, link: '' }
  ],
  notes: '>> DAILY LOG\n\nDate: 2026.06.21\n- Focus on Raumsonden today.\n- Remember to verify the Delta-V budgets.'
};

export async function GET() {
  try {
    const file = await getDataFile();
    const data = await fs.readFile(file, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json(defaultData);
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const file = await getDataFile();
    await fs.writeFile(file, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
