import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "e2e",
	use: { baseURL: "http://localhost:4173", channel: "chrome" },
	webServer: { command: "pnpm build && pnpm preview --port 4173 --strictPort", url: "http://localhost:4173", reuseExistingServer: true },
	projects: [
		{ name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
		{ name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
	],
});
