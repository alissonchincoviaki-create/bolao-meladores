import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt, system } = await request.json();
    
    const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: system || 'Você é o narrador do Bolão dos Meladores.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim();

    if (text) {
      return NextResponse.json({ text });
    } else {
      return NextResponse.json({ error: 'No text generated', details: data }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
