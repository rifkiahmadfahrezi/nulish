/// <reference lib="webworker" />
import { ExpirationPlugin } from "workbox-expiration";
import {
	cleanupOutdatedCaches,
	createHandlerBoundToURL,
	precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// FR-75: precache the app shell + every build asset (JS, CSS, fonts, icons, Shiki grammars).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// FR-76: SPA navigations always get the cached shell — works in airplane mode.
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

// FR-76: external images in documents. Locally uploaded images never hit the network (blob: URLs).
registerRoute(
	({ request, url }) =>
		request.destination === "image" && url.origin !== self.location.origin,
	new StaleWhileRevalidate({
		cacheName: "external-images",
		plugins: [
			new ExpirationPlugin({ maxEntries: 100, purgeOnQuotaError: true }),
		],
	}),
);

// FR-80: never take over on our own; the page asks after flushing autosave (FR-82).
self.addEventListener("message", (e) => {
	if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
