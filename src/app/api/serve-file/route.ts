import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get('path');

        if (!filePath) {
            return new NextResponse('Missing path parameter', { status: 400 });
        }

        const settings = getSettings();
        const BASE_DIR = settings.homeFolder;

        // Ensure the filePath is resolved relative to BASE_DIR and starts with it for safety
        const resolvedPath = path.resolve(path.join(BASE_DIR, filePath));
        if (!resolvedPath.startsWith(BASE_DIR)) {
            return new NextResponse('Access denied: ' + resolvedPath, { status: 403 });
        }

        if (!fs.existsSync(resolvedPath)) {
            return new NextResponse('File not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(resolvedPath);
        
        const ext = path.extname(resolvedPath).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.txt' || ext === '.md' || ext === '.js' || ext === '.ts' || ext === '.json' || ext === '.py') contentType = 'text/plain';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${path.basename(resolvedPath)}"`,
            },
        });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
