import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

// Needed for native nextjs route
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const textData = formData.get('textData') as string | null;
        
        // Handle Buffl text input fallback
        if (!file && textData) {
            // Forward to buffl logic or handle raw JSON
            try {
                const parsed = JSON.parse(textData);
                // Try to infer if it's Anki JSON or Buffl JSON
                if (parsed.cards && Array.isArray(parsed.cards)) {
                    return NextResponse.json({ message: "Successfully parsed JSON deck.", cards: parsed.cards });
                }
            } catch (e) {
                // Not JSON. Check if it's Anki TSV format in text
                const lines = textData.split('\n');
                const newCards = [];
                for (const line of lines) {
                    if (!line.trim() || line.startsWith('#')) continue;
                    let parts = line.split('\t');
                    if (parts.length < 2) parts = line.split(',');
                    if (parts.length >= 2) {
                        newCards.push({
                            id: Date.now().toString() + Math.random().toString(),
                            front: parts[0].trim(),
                            back: parts[1].trim(),
                            ease: 2.5,
                            interval: 0,
                            nextReview: new Date().toISOString()
                        });
                    }
                }
                if (newCards.length > 0) {
                    return NextResponse.json({ message: `Successfully parsed ${newCards.length} cards from text.`, cards: newCards });
                }
            }
            return NextResponse.json({ error: 'Could not parse text input.' }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        if (file.name.endsWith('.apkg') || file.name.endsWith('.colpkg')) {
            const tempDir = path.join(process.cwd(), '.next', `temp_${Date.now()}`);
            await fs.mkdir(tempDir, { recursive: true });
            
            const tempZipPath = path.join(tempDir, `archive.apkg`);
            await fs.writeFile(tempZipPath, buffer);
            
            const zip = require('fs').createReadStream(tempZipPath).pipe(unzipper.Parse({forceStream: true}));
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
            
            // Handle Media
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
            } catch (e) {
                // No media or failed to extract
            }
            
            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });
            
            return NextResponse.json({ message: `Successfully imported ${newCards.length} cards from Anki package.`, cards: newCards });

        } else if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
            const text = buffer.toString('utf-8');
            const lines = text.split('\n');
            const newCards = [];
            for (const line of lines) {
                if (!line.trim() || line.startsWith('#')) continue;
                let parts = line.split('\t');
                if (parts.length < 2) parts = line.split(',');
                if (parts.length >= 2) {
                    newCards.push({
                        id: Date.now().toString() + Math.random().toString(),
                        front: parts[0].trim(),
                        back: parts[1].trim(),
                        ease: 2.5,
                        interval: 0,
                        nextReview: new Date().toISOString()
                    });
                }
            }
            return NextResponse.json({ message: `Successfully parsed ${newCards.length} cards from text file.`, cards: newCards });
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Please upload .apkg or .txt/.csv' }, { status: 400 });
        }
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Unknown error during import' }, { status: 500 });
    }
}
