import { db } from "./db";

/** Locally uploaded images are referenced in documents by this URL scheme, never uploaded anywhere. */
export const ASSET_PREFIX = "inkwell-asset:";

export async function putAsset(docId: string, blob: Blob) {
	const id = crypto.randomUUID();
	await db.assets.add({
		id,
		docId,
		blob,
		mimeType: blob.type,
		createdAt: Date.now(),
	});
	return `${ASSET_PREFIX}${id}`;
}

const urlCache = new Map<string, string>();

/** Turns an asset URL into a blob: URL; passes other URLs through. */
export async function resolveAssetUrl(url: string) {
	if (!url.startsWith(ASSET_PREFIX)) return url;
	const cached = urlCache.get(url);
	if (cached) return cached;
	const asset = await db.assets.get(url.slice(ASSET_PREFIX.length));
	if (!asset) return url;
	const blobUrl = URL.createObjectURL(asset.blob);
	urlCache.set(url, blobUrl);
	return blobUrl;
}

export function allAssets() {
	return db.assets.toArray();
}

export function putAssets(assets: Awaited<ReturnType<typeof allAssets>>) {
	return db.assets.bulkPut(assets);
}
