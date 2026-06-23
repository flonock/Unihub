import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const file = url.searchParams.get('file');
    if (!file) return new Response('No file', { status: 400 });
    
    // Prevent directory traversal
    const normalizedFile = path.basename(file);
    
    try {
        const filePath = path.join(process.cwd(), 'public', normalizedFile);
        const buffer = await fs.readFile(filePath);
        
        let contentType = 'image/jpeg';
        if (normalizedFile.endsWith('.png')) contentType = 'image/png';
        if (normalizedFile.endsWith('.svg')) contentType = 'image/svg+xml';
        if (normalizedFile.endsWith('.gif')) contentType = 'image/gif';
        
        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch(e) {
        console.error('Media API failed to serve:', normalizedFile, e);
        return new Response('Not found', { status: 404 });
    }
}
