# Contributing to HPC Study

HPC Study accepts improvements to both the learning content and the web
application. Contributions must respect the project's dual-license model and
source policy.

## License of contributions

Unless a contribution explicitly states otherwise and is accepted as such:

- source code, stylesheets, tooling, and visualization implementation code are
  contributed under the MIT License in `LICENSE-CODE`;
- educational prose, curriculum data, labs, troubleshooting guidance, and
  original educational diagrams/visual compositions are contributed under
  CC BY 4.0 as described in `LICENSE-CONTENT`.

By opening a pull request, you confirm that the contribution is your original
work or that you have the right to submit it under these terms.

## Third-party material

Do not paste vendor manuals, screenshots, diagrams, tables, source code, or
other copyrighted material into the textbook merely because the original URL is
cited.

Preferred workflow:

1. use official documentation to verify facts;
2. write the explanation independently;
3. create examples, labs, diagrams, and animations specifically for HPC Study;
4. add the source to `docs/SOURCES.md` and `assets/js/content/sources.js`;
5. if direct quotation, code reuse, or adaptation is genuinely necessary,
   identify the exact upstream license and update `NOTICE.md`.

A citation does not itself provide reuse permission.

## Content shape

A chapter should support the teaching sequence used throughout the project:

`개념 → 왜 필요한가 → 구조/동작 → 시각화 → 명령어 → 실습 → 흔한 실수 → troubleshooting`

Keep vendor-specific behavior clearly separated from portable HPC concepts.

## Validation

Run the same validation used by GitHub Actions:

```bash
npm run ci
```

The checks cover JavaScript syntax, imports, chapter schema, visualization
registry, HTML assets, theme tokens, and licensing/source metadata.
