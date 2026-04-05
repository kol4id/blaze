import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
        return new Response('Missing "url" parameter', { status: 400 });
    }

    const rangeHeader = url.searchParams.get('range') || undefined;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...(rangeHeader && { 'Range': rangeHeader }),
            },
        });

        const data = await response.arrayBuffer();
        return new Response(data, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'application/vnd.apple.mpegurl',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Range, User-Agent',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
};

export const OPTIONS: RequestHandler = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, User-Agent',
        },
    });
};