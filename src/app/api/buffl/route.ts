import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { input, targetPath } = await request.json();
    if (!input) return NextResponse.json({ error: 'No input provided' }, { status: 400 });

    let rawJson = '';

    if (input.startsWith('http')) {
        // It's a share link, we need to fetch and extract
        const res = await fetch(input);
        const html = await res.text();
        
        // TODO: Reverse engineer the HTML to find the JSON payload
        // This is a placeholder until we get a real link to inspect
        return NextResponse.json({ error: 'URL fetching not yet fully implemented. Please provide a sample link to calibrate the extractor.' }, { status: 501 });
    } else {
        // Assume it's raw JSON pasted directly
        try {
            const parsed = JSON.parse(input);
            
            // Recursive function to hunt for flashcard-like structures
            let extractedCards: any[] = [];
            const huntForCards = (obj: any) => {
                if (Array.isArray(obj)) {
                    for (const item of obj) {
                        if (item && typeof item === 'object') {
                            if (item.front || item.back || item.question || item.answer || item.content) {
                                extractedCards.push({
                                    question: item.front || item.question || item.content || '[Empty Question]',
                                    answer: item.back || item.answer || '[Empty Answer]'
                                });
                            } else {
                                huntForCards(item);
                            }
                        }
                    }
                } else if (typeof obj === 'object' && obj !== null) {
                    for (const key of Object.keys(obj)) {
                        huntForCards(obj[key]);
                    }
                }
            };
            
            huntForCards(parsed);
            
            if (extractedCards.length === 0) {
                return NextResponse.json({ error: 'No recognizable flashcard objects found in the provided JSON.' }, { status: 400 });
            }

            // In the future: Write the extractedCards to targetPath as a JSON or XOPP file
            return NextResponse.json({ success: true, count: extractedCards.length, cards: extractedCards, message: `Successfully extracted ${extractedCards.length} cards from the JSON!` });

        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON format provided.' }, { status: 400 });
        }
    }

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Failed to process Buffl import' }, { status: 500 });
  }
}
