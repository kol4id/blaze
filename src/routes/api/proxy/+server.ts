import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url, fetch }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		return new Response('Missing "url" parameter', { status: 400 });
	}

	const rangeHeader = url.searchParams.get('range') || undefined;
	const origin = request.headers.get('origin');

	try {
		const response = await fetch(targetUrl, {
			signal: request.signal,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				...(rangeHeader && { Range: rangeHeader })
			}
		});

		const headers: Record<string, string> = {
			'Content-Type': response.headers.get('content-type') || 'application/vnd.apple.mpegurl',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Range, User-Agent'
		};

		if (origin === url.origin) {
			headers['Access-Control-Allow-Origin'] = origin;
		}

		return new Response(response.body, {
			status: response.status,
			headers
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		// Suppress server console spam for expected network failures on dead streams
		// The error is still sent to the client via the HTTP response body
		return new Response(`Proxy error: ${message}`, { status: 500 });
	}
};

export const OPTIONS: RequestHandler = async ({ request, url }) => {
	const origin = request.headers.get('origin');

	const headers: Record<string, string> = {
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Range, User-Agent'
	};

	if (origin === url.origin) {
		headers['Access-Control-Allow-Origin'] = origin;
	}

	return new Response(null, {
		headers
	});
};
