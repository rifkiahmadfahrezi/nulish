import { describe, expect, it } from "vitest";
import { catalogsForTest, resolveLocale, setLocale, t } from "#/lib/i18n";

const { en, ...others } = catalogsForTest;
const keys = (c: object) => Object.keys(c).filter((k) => k !== "_meta");
const text = (v: unknown) =>
	typeof v === "string" ? v : (v as { other: string }).other;
const vars = (v: unknown) =>
	[...text(v).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("locale files", () => {
	for (const [code, catalog] of Object.entries(others)) {
		describe(code, () => {
			it("has a display name", () => expect(catalog._meta?.name).toBeTruthy());

			it("translates every key and nothing unknown", () => {
				const mine = new Set(keys(catalog));
				expect(
					keys(en).filter((k) => !mine.has(k)),
					"missing keys",
				).toEqual([]);
				expect(
					[...mine].filter((k) => !(k in en)),
					"unknown keys",
				).toEqual([]);
			});

			it("keeps the same {placeholders} as English", () => {
				for (const key of keys(catalog)) {
					const k = key as keyof typeof en;
					expect(vars(catalog[k]), key).toEqual(vars(en[k]));
				}
			});
		});
	}
});

describe("t()", () => {
	it("interpolates, pluralizes and falls back to English", () => {
		setLocale("en");
		expect(t("io.imported", { count: 1 })).toBe("1 document imported");
		expect(t("io.imported", { count: 3 })).toBe("3 documents imported");
		setLocale("id");
		expect(t("io.imported", { count: 3 })).toBe("3 dokumen diimpor");
		expect(t("pages.options", { title: "X" })).toBe("Opsi untuk X");
	});

	it("resolves 'auto' from browser languages", () => {
		expect(resolveLocale("auto", ["id-ID", "en"])).toBe("id");
		expect(resolveLocale("auto", ["fr-FR"])).toBe("en");
		expect(resolveLocale("id", ["en"])).toBe("id");
		expect(resolveLocale("xx", ["en-GB"])).toBe("en");
	});
});
