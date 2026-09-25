import { readFileSync } from "node:fs";
import { expect, type Page, test } from "@playwright/test";

const title = (page: Page) => page.getByRole("textbox", { name: /Document title|Judul dokumen/ });
const editor = (page: Page) => page.locator(".bn-editor");

async function write(page: Page, heading: string, body: string) {
	await title(page).fill(heading);
	await title(page).press("Enter");
	await page.keyboard.type(body);
	// Autosave debounce is 400ms.
	await page.waitForTimeout(700);
}

async function openMenu(page: Page) {
	await page.locator("#fab").click();
	await expect(page.getByRole("menu", { name: "Menu" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
	await page.goto("/");
	await expect(title(page)).toBeVisible();
});

test("autosaves and restores the document after reload (FR-20/21)", async ({ page }) => {
	await write(page, "Meeting Notes", "Content that must survive.");
	await page.reload();
	await expect(title(page)).toHaveValue("Meeting Notes");
	await expect(editor(page)).toContainText("Content that must survive.");
	await expect(page).toHaveTitle("Meeting Notes — Inkwell");
});

test("command palette searches content and opens the page (FR-30/31)", async ({ page, isMobile }) => {
	test.skip(isMobile, "keyboard shortcut");
	await write(page, "Recipe", "Spicy shrimp paste sambal.");
	await page.keyboard.press("Control+Alt+KeyN");
	await expect(title(page)).toHaveValue("");
	await write(page, "Other", "Not relevant.");

	await page.keyboard.press("Control+KeyK");
	await page.keyboard.type("shrimp");
	const hit = page.getByRole("option", { name: /Recipe/ });
	await expect(hit.locator("mark")).toHaveText("shrimp");
	await page.keyboard.press("Enter");
	await expect(title(page)).toHaveValue("Recipe");
});

test("trash with undo, then restore from Trash (FR-06)", async ({ page }) => {
	await write(page, "Temporary", "Will be deleted.");
	await openMenu(page);
	await page.getByRole("menuitem", { name: /Pages/ }).click();
	await page.getByRole("button", { name: "Options for Temporary" }).click();
	await page.getByRole("menuitem", { name: "Move to Trash" }).click();
	await expect(page.getByText("No documents yet.")).toBeVisible();

	await openMenu(page);
	await page.getByRole("menuitem", { name: /Trash/ }).click();
	await page.getByRole("button", { name: "Restore" }).click();
	await expect(title(page)).toHaveValue("Temporary");
});

test("FAB drags, snaps to the nearest edge and remembers it (FR-56/57)", async ({ page, isMobile }) => {
	test.skip(isMobile, "mouse drag");
	const fab = page.locator("#fab");
	const box = await fab.boundingBox();
	if (!box) throw new Error("no fab");
	await page.mouse.move(box.x + 20, box.y + 20);
	await page.mouse.down();
	await page.mouse.move(300, 300, { steps: 10 });
	await page.mouse.up();
	await expect.poll(async () => (await fab.boundingBox())?.x).toBe(20);
	await page.reload();
	await expect.poll(async () => (await fab.boundingBox())?.x).toBe(20);
	// Dragging must not open the menu.
	await expect(page.getByRole("menu", { name: "Menu" })).toHaveCount(0);
});

test("exports and imports markdown (FR-40/41)", async ({ page }) => {
	await write(page, "Export", "A **bold** line here.");
	await openMenu(page);
	const download = page.waitForEvent("download");
	await page.getByRole("menuitem", { name: /Export \.md/ }).click();
	const file = await (await download).path();
	const md = readFileSync(file, "utf8");
	expect(md).toContain("# Export");
	expect(md).toContain("**bold**");

	await openMenu(page);
	const chooser = page.waitForEvent("filechooser");
	await page.getByRole("menuitem", { name: /Import \.md/ }).click();
	await (await chooser).setFiles({
		name: "notes.md",
		mimeType: "text/markdown",
		buffer: Buffer.from("# From File\n\n- one\n- two\n"),
	});
	await expect(title(page)).toHaveValue("From File");
	await expect(editor(page)).toContainText("two");
});

test("theme toggles from the menu (FR-50)", async ({ page }) => {
	await openMenu(page);
	await page.getByRole("button", { name: "Dark" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("works offline after the first visit (FR-24/77)", async ({ page, context }) => {
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.reload(); // now controlled by the SW
	await write(page, "Offline", "Written without internet.");
	await context.setOffline(true);
	await page.reload();
	await expect(title(page)).toHaveValue("Offline");
	await expect(editor(page)).toContainText("Written without internet.");
	await context.setOffline(false);
});

test("switches the UI language and remembers it", async ({ page }) => {
	await openMenu(page);
	await page.getByRole("menuitem", { name: "Settings" }).click();
	await page.getByRole("combobox", { name: "Language" }).selectOption("id");
	await expect(page.getByRole("button", { name: "Tampilan" })).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(title(page)).toHaveAttribute("placeholder", "Tanpa judul");
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("lang", "id");
	await expect(page.getByRole("textbox", { name: "Judul dokumen" })).toBeVisible();
});
