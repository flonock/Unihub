import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

async function getDataFile() {
  let baseDir = '/home/apollon/Documents/Uni';
  try {
    const settingsRaw = await fs.readFile(path.join(process.cwd(), 'settings.json'), 'utf-8');
    const settings = JSON.parse(settingsRaw);
    if (settings.homeFolder) baseDir = settings.homeFolder;
  } catch(e) {}
  return path.join(baseDir, 'workspace_data.json');
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb' // To handle large base64 image payloads
    }
  }
};

export async function POST(request: Request) {
    // Add CORS headers so the extension can fetch from http://localhost:3000
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const { cards, images } = body;

        if (!cards || !Array.isArray(cards)) {
            return NextResponse.json({ error: 'Invalid payload: missing cards' }, { status: 400, headers: corsHeaders });
        }

        // 1. Save images to /public
        if (images && Array.isArray(images)) {
            const publicDir = path.join(process.cwd(), 'public');
            await fs.mkdir(publicDir, { recursive: true });
            
            for (const img of images) {
                const base64Data = img.dataUrl.split(',')[1];
                if (base64Data) {
                    const buffer = Buffer.from(base64Data, 'base64');
                    await fs.writeFile(path.join(publicDir, img.filename), buffer);
                }
            }
        }

        // 2. Read workspace data
        const dataFile = await getDataFile();
        let data: any = { decks: [] };
        try {
            const dataRaw = await fs.readFile(dataFile, 'utf-8');
            data = JSON.parse(dataRaw);
        } catch (e) {
            // If it doesn't exist, use default structure
        }

        if (!data.decks) data.decks = [];

        // 3. Create Deck
        const deckId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
        const deckName = `Buffl Import ${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        
        const newDeck = {
            id: deckId,
            name: deckName,
            cards: cards.map((c: any) => ({
                id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
                front: c.front,
                back: c.back,
                ease: 2.5,
                interval: 0,
                nextReview: new Date().toISOString()
            }))
        };

        data.decks.push(newDeck);

        // 4. Save workspace data
        await fs.writeFile(dataFile, JSON.stringify(data, null, 2));

        return NextResponse.json({ success: true, message: `Successfully imported ${cards.length} cards into deck "${deckName}"!` }, { headers: corsHeaders });

    } catch (e: any) {
        console.error('Error processing Buffl Extension Import:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
    }
}
