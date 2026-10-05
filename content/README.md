# Educational content

This directory is the physical boundary for HPC Study educational material.
Unless a file says otherwise, material under `content/` is licensed under
**CC BY 4.0** as described in `../LICENSE-CONTENT`.

## Structure

```text
content/
├─ chapters/        base chapter prose, commands, labs and troubleshooting guidance
├─ enrichments/     Quality Pass rich-schema editorial overlays
├─ code-lessons.js  language-aware educational code/script examples
└─ sources.js       source registry and chapter-to-reference mapping
```

The chapter, enrichment, and code-lesson files use JavaScript module syntax only
as a lightweight static-data container. The educational data in these files is
content, not application logic. Application code lives under `assets/js/` and
`scripts/` and is licensed separately under MIT.

`content/enrichments/` is used during staged textbook-quality rewrites. The base
chapter object keeps stable command/lab metadata while an enrichment adds
`learningObjectives`, `terms`, explanatory `sections`, worked `example`, and
`selfCheck`. `assets/js/core/curriculum.js` merges them by chapter ID. Once a
stage is fully consolidated, the rich fields may be moved into the base module
without changing the rendered schema.

`content/code-lessons.js` stores longer educational examples such as diagnostic
shell scripts, utilities, automation snippets, and future C/C++/Python/MPI/OpenMP
source examples. Presentation and copy behavior are implemented separately by
`assets/js/ui/code-block.js`; educational source code itself remains under the
content license.

When adding or editing educational code:

1. declare a language (`bash`, `c`, `cpp`, `python`, `slurm`, `text`, `output`);
2. distinguish `command`, `script`, `source`, `output`, or `config` intent;
3. include a filename when the example is intended to be saved and executed;
4. explain what the learner should observe instead of presenting code without context;
5. keep third-party code out unless its reuse terms have been explicitly reviewed.

When adding or editing a chapter:

1. keep educational text in `content/chapters/`, `content/enrichments/`, or `content/code-lessons.js`;
2. keep UI, routing, state and visualization implementation in `assets/js/`;
3. add material reference IDs in `content/sources.js` when an external source materially informs the chapter;
4. update `docs/SOURCES.md` for newly introduced reference sources;
5. run `npm run ci` before merging.

Third-party text, figures or code must not be copied into this directory merely
because a source appears in References. Follow `../docs/LICENSING.md` and
`../docs/SOURCES.md` before any direct reuse or adaptation.
