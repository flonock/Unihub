import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    let baseDir = '/home/apollon/Documents/Uni';
    try {
        const settingsRaw = await fs.readFile(path.join(process.cwd(), 'settings.json'), 'utf-8');
        const settings = JSON.parse(settingsRaw);
        if (settings.homeFolder) baseDir = settings.homeFolder;
    } catch(e) {}

    try {
        const body = await request.json();
        const existingNames = body.existingDeckNames || [];
        
        const availableApkgs: { path: string, name: string, semester: string, lecture: string }[] = [];
        
        const semEntries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const sem of semEntries) {
            if (!sem.isDirectory() || !sem.name.startsWith('Semester')) continue;
            const semPath = path.join(baseDir, sem.name);
            
            const lecEntries = await fs.readdir(semPath, { withFileTypes: true });
            for (const lec of lecEntries) {
                if (!lec.isDirectory()) continue;
                const lecPath = path.join(semPath, lec.name);
                
                const getApkgFiles = async (dirPath: string): Promise<string[]> => {
                    let results: string[] = [];
                    try {
                        const entries = await fs.readdir(dirPath, { withFileTypes: true });
                        for (const entry of entries) {
                            const full = path.join(dirPath, entry.name);
                            if (entry.isDirectory()) {
                                results = results.concat(await getApkgFiles(full));
                            } else if (entry.isFile() && (entry.name.endsWith('.apkg') || entry.name.endsWith('.colpkg'))) {
                                results.push(full);
                            }
                        }
                    } catch (e) {}
                    return results;
                };

                const apkgFiles = await getApkgFiles(lecPath);
                for (const filePath of apkgFiles) {
                    const fileName = path.basename(filePath);
                    const deckName = fileName.replace('.apkg', '').replace('.colpkg', '');
                    if (!existingNames.includes(deckName)) {
                        availableApkgs.push({
                            path: filePath,
                            name: deckName,
                            semester: sem.name,
                            lecture: lec.name
                        });
                    }
                }
            }
        }
        
        return NextResponse.json({ available: availableApkgs });
    } catch(e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
