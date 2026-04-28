import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, OPTIONS } from './+server';

describe('Proxy API CORS', () => {
	const appOrigin = 'http://localhost';
	const otherOrigin = 'http://evil.com';

	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn(() =>
			Promise.resolve(new Response('dummy', {
				status: 200,
				headers: { 'content-type': 'application/vnd.apple.mpegurl' }
			}))
		));
	});

	it('GET should allow same origin', async () => {
		const url = new URL(`${appOrigin}/api/proxy?url=http://example.com/stream.m3u8`);
		const request = new Request(url, {
			headers: { 'Origin': appOrigin }
		});

		const event = {
			request,
			url,
			fetch: vi.fn().mockImplementation(() => Promise.resolve(new Response('dummy', {
				status: 200,
				headers: { 'content-type': 'application/vnd.apple.mpegurl' }
			})))
		};

		// @ts-ignore
		const response = await GET(event);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(appOrigin);
	});

	it('GET should deny different origin', async () => {
		const url = new URL(`${appOrigin}/api/proxy?url=http://example.com/stream.m3u8`);
		const request = new Request(url, {
			headers: { 'Origin': otherOrigin }
		});

		const event = {
			request,
			url,
			fetch: vi.fn()
		};

		// @ts-ignore
		const response = await GET(event);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
	});

	it('OPTIONS should allow same origin', async () => {
		const url = new URL(`${appOrigin}/api/proxy`);
		const request = new Request(url, {
			headers: { 'Origin': appOrigin }
		});

		const event = {
			request,
			url
		};

		// @ts-ignore
		const response = await OPTIONS(event);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe(appOrigin);
	});

	it('OPTIONS should deny different origin', async () => {
		const url = new URL(`${appOrigin}/api/proxy`);
		const request = new Request(url, {
			headers: { 'Origin': otherOrigin }
		});

		const event = {
			request,
			url
		};

		// @ts-ignore
		const response = await OPTIONS(event);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
	});
});
