export function formatLabel(url: string) {
	try {
		const u = new URL(url);
		const parts = u.pathname.split('/').filter(Boolean);
		const last = parts.pop() || u.hostname;
		return last.length > 30 ? last.substring(0, 27) + '...' : last;
	} catch {
		return url.length > 30 ? url.substring(0, 27) + '...' : url;
	}
}
