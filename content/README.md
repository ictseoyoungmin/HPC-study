# Educational content

This directory is the physical boundary for HPC Study educational material.
Unless a file says otherwise, material under `content/` is licensed under
**CC BY 4.0** as described in `../LICENSE-CONTENT`.

## Structure

```text
content/
├─ chapters/        base chapter prose, commands, labs and troubleshooting guidance
├─ enrichments/     Quality Pass rich-schema editorial overlays
└─ sources.js       source registry and chapter-to-reference mapping
```

The chapter and enrichment files use JavaScript module syntax only as a lightweight
static-data container. The educational data in these files is content, not
application logic. Application code lives under `assets/js/` and `scripts/` and
is licensed separately under MIT.

`content/enrichments/` is used during staged textbook-quality rewrites. The base
chapter object keeps stable command/lab metadata while an enrichment adds
`learningObjectives`, `terms`, explanatory `sections`, worked `example`, and
`selfCheck`. `assets/js/core/curriculum.js` merges them by chapter ID. Once a
stage is fully consolidated, the rich fields may be moved into the base module
without changing the rendered schema.

When adding or editing a chapter:

1. keep educational text in `content/chapters/` or `content/enrichments/`;
2. keep UI, routing, state and visualization implementation in `assets/js/`;
3. add material reference IDs in `content/sources.js` when an external source
   materially informs the chapter;
4. update `docs/SOURCES.md` for newly introduced reference sources;
5. run `npm run ci` before merging.

Third-party text, figures or code must not be copied into this directory merely
because a source appears in References. Follow `../docs/LICENSING.md` and
`../docs/SOURCES.md` before any direct reuse or adaptation.
