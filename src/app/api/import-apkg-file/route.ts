import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const filePath = body.path;
        const deckName = body.name;
        const semester = body.semester;
        const lecture = body.lecture;

        const tempDir = path.join(process.cwd(), '.next', `temp_import_${Date.now()}_${Math.random().toString(36).substring(7)}`);
        await fs.mkdir(tempDir, { recursive: true });
        
        try {
            const zip = require('fs').createReadStream(filePath).pipe(unzipper.Parse({forceStream: true}));
            for await (const entry of zip) {
                const dest = path.join(tempDir, entry.path);
                await require('fs/promises').mkdir(path.dirname(dest), { recursive: true });
                await new Promise((resolve, reject) => {
                    entry.pipe(require('fs').createWriteStream(dest))
                         .on('finish', resolve)
                         .on('error', reject);
                });
            }
            
            let dbPath = path.join(tempDir, 'collection.anki21b');
            try {
                await fs.access(dbPath);
                try {
                    require('child_process').execSync(`zstd -d "${dbPath}" -o "${dbPath}.db"`);
                    dbPath = dbPath + '.db';
                } catch (e) {
                    console.error('Failed to decompress zstd:', e);
                }
            } catch {
                dbPath = path.join(tempDir, 'collection.anki21');
                try {
                    await fs.access(dbPath);
                } catch {
                    dbPath = path.join(tempDir, 'collection.anki2');
                }
            }
            
            const db = new sqlite3.Database(dbPath);
            const all = promisify(db.all.bind(db));
            
            const notes: any = await all('SELECT id, flds FROM notes');
            
            const newCards = notes.map((n: any) => {
                const flds = n.flds.split('\x1f');
                return {
                    id: Date.now().toString() + Math.random().toString(),
                    front: flds[0] || '',
                    back: flds[1] || '',
                    ease: 2.5,
                    interval: 0,
                    nextReview: new Date().toISOString()
                };
            });
            
            db.close();
            
            try {
                const mediaPath = path.join(tempDir, 'media');
                const mediaRaw = await fs.readFile(mediaPath, 'utf-8');
                const mediaJson = JSON.parse(mediaRaw);
                
                const publicDir = path.join(process.cwd(), 'public');
                await fs.mkdir(publicDir, { recursive: true });
                
                for (const [key, filename] of Object.entries(mediaJson)) {
                    const sourceFile = path.join(tempDir, key);
                    const destFile = path.join(publicDir, filename as string);
                    await fs.copyFile(sourceFile, destFile).catch(() => {});
                }
            } catch (e) {}
            
            return NextResponse.json({
                deck: {
                    id: Date.now().toString() + Math.random().toString(),
                    name: deckName,
                    linkedSemester: semester,
                    linkedLecture: lecture,
                    cards: newCards
                }
            });
        } finally {
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
    } catch(e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
