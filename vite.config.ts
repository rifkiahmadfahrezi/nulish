/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			strategies: "injectManifest",
			srcDir: "src",
			filename: "sw.ts",
			registerType: "prompt",
			injectRegister: false,
			injectManifest: {
				globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
				// Shiki grammars/themes are large but must work offline (FR-75).
				maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
			},
			manifest: {
				id: "/",
				name: "Nulish",
				short_name: "Nulish",
				description: "Local-first markdown editor. No account, no server.",
				start_url: "/",
				scope: "/",
				display: "standalone",
				display_override: ["standalone", "minimal-ui"],
				theme_color: "#ffffff",
				background_color: "#ffffff",
				icons: [
					{ src: "pwa-192.png", sizes: "192x192", type: "image/png" },
					{ src: "pwa-512.png", sizes: "512x512", type: "image/png" },
					{
						src: "maskable-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "monochrome-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "monochrome",
					},
					{ src: "favicon.svg", sizes: "any", type: "image/svg+xml" },
				],
				shortcuts: [
					{
						name: "New page",
						url: "/?action=new",
						icons: [{ src: "pwa-192.png", sizes: "192x192" }],
					},
					{
						name: "Search",
						url: "/?action=search",
						icons: [{ src: "pwa-192.png", sizes: "192x192" }],
					},
				],
				// FR-84 / FR-85 / FR-86
				file_handlers: [
					{
						action: "/?action=open-file",
						accept: { "text/markdown": [".md", ".markdown"] },
					},
				],
				share_target: {
					action: "/",
					method: "GET",
					params: {
						title: "share_title",
						text: "share_text",
						url: "share_url",
					},
				},
				launch_handler: { client_mode: "focus-existing" },
			} as Record<string, unknown>,
		}),
	],
	test: {
		include: ["src/**/*.test.{ts,tsx}"],
		environment: "jsdom",
		setupFiles: ["fake-indexeddb/auto"],
	},
});
