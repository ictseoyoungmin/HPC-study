# Educational content

This directory is the physical boundary for HPC Study educational material.
Unless a file says otherwise, material under `content/` is licensed under
**CC BY 4.0** as described in `../LICENSE-CONTENT`.

## Structure

```text
content/
├─ chapters/        chapter prose, examples, labs and troubleshooting guidance
└─ sources.js       source registry and chapter-to-reference mapping
```

The chapter files use JavaScript module syntax only as a lightweight static-data
container (`export const chapters = [...]`). The educational data in these files
is content, not application logic. Application code lives under `assets/js/` and
`scripts/` and is licensed separately under MIT.

When adding or editing a chapter:

1. keep educational text in `content/chapters/`;
2. keep UI, routing, state and visualization implementation in `assets/js/`;
3. add material reference IDs in `content/sources.js` when an external source
   materially informs the chapter;
4. run `npm run ci` before merging.

Third-party text, figures or code must not be copied into this directory merely
because a source appears in References. Follow `../docs/LICENSING.md` and
`../docs/SOURCES.md` before any direct reuse or adaptation.
