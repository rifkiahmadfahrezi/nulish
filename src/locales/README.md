# Translations

Every UI string in Inkwell lives in this folder, one JSON file per language. Files are picked up automatically, so adding a language needs no code changes.

## Add a language

1. Copy `en.json` to `<code>.json`, using a [BCP 47](https://www.ietf.org/rfc/bcp/bcp47.txt) language code: `fr`, `de`, `pt-br`, `zh-tw`, …
2. Set `_meta.name` to the language's own name, e.g. `"Français"`. This is what appears in **Settings → Appearance → Language**.
3. Translate the values. Leave the keys as they are.
4. Run `pnpm test`. It fails if a key is missing or unknown, or if a `{placeholder}` doesn't match English.
5. Open a pull request.

With **Automatic** selected, the app picks the first browser language that has a file here. It matches either the full code or its prefix, so `fr-CA` loads `fr.json`.

## Format

```json
"trash.deletedAgo": "Deleted {time}",
"io.imported": { "one": "1 document imported", "other": "{count} documents imported" }
```

- **`{name}` placeholders** are filled in by the app. Keep them exactly as they are; you can move them anywhere in the sentence.
- **Plurals** are objects keyed by [plural category](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html): `zero`, `one`, `two`, `few`, `many`, `other`. Only `other` is required. Include the categories your language uses. For example, Indonesian needs only `other`, while Russian uses `one`, `few`, `many` and `other`.
- **Numbers and dates** are formatted for your language automatically.
- **Missing keys** fall back to English at runtime, but the tests require a complete file.

## Editor menus

The slash menu, the formatting toolbar and the block menu come from [BlockNote](https://www.blocknotejs.org/). BlockNote has its own translations and Inkwell uses them automatically when one exists for your language code. If your language isn't one of them, those menus stay in English. Contribute that translation upstream to BlockNote.
