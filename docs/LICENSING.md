# Licensing policy

HPC Study separates the license of the textbook content from the license of the
web application and visualization code.

## Project-owned material

| Material | License |
| --- | --- |
| Original educational prose, curriculum, examples, labs, troubleshooting guidance, original educational diagrams/visual compositions | CC BY 4.0 |
| HTML/CSS/JavaScript application logic, visualization implementations, validation scripts, tooling | MIT |
| Third-party material | Original upstream license |

The canonical notices are `LICENSE-CONTENT` and `LICENSE-CODE`.

The boundary is now physical as well as legal:

- `content/**` contains educational chapter data and reference metadata and is
  licensed under CC BY 4.0 unless a file states otherwise.
- `assets/js/**`, `assets/css/**`, and `scripts/**` contain application,
  visualization, styling, and validation code and are licensed under MIT.
- `assets/third-party/**` is reserved for material that retains an upstream
  license.

The chapter files currently use JavaScript module syntax as a static-data
container. That syntax does not change the licensing boundary: the educational
material under `content/` is governed by `LICENSE-CONTENT`.

## Reference-first rule

External documentation is used primarily to verify technical facts, command
behavior, API semantics, terminology, and implementation details. HPC Study
then writes its own explanation and creates its own examples, labs, diagrams,
and interactive visualizations.

Default rule:

> External official documentation is a reference for fact checking. It is not
> source material to copy into the textbook.

A citation does not grant permission to reproduce copyrighted material.

## Usage classes

HPC Study tracks external sources using these usage classes:

- `technical-reference` — facts or terminology are checked; no source text or
  artwork is reproduced.
- `api-semantics` — standards/API behavior is checked; explanations are
  rewritten independently.
- `command-reference` — command behavior/options are checked; command names and
  short invocation examples may be used where copyright does not protect the
  underlying facts/syntax.
- `quoted-text` — a short direct quotation is used. This requires explicit
  attribution and a license/permission review.
- `adapted-diagram` — an upstream diagram is modified or redrawn from a specific
  copyrighted composition. This requires a license/permission review and must
  not be confused with independently designed diagrams about the same facts.
- `included-code` — upstream code is copied or adapted. Its original license and
  required notices must be preserved.

The repository should normally remain in the first three classes.

## External licenses and compatibility

Different reference projects use different licenses. Some are permissive; some
are copyleft; some vendor documentation is proprietary or subject to website or
SDK terms. Therefore HPC Study does **not** assume that a reference document can
be relicensed under CC BY 4.0.

Examples recorded in `docs/SOURCES.md` include Linux Kernel, MPI Forum, Open MPI,
MPICH, Slurm, NVIDIA CUDA, AMD ROCm, Intel, OpenHPC, and Red Hat documentation.
These notes are operational guidance, not legal advice. Before copying or
adapting third-party material, verify the license on the exact file/document and
version being used.

## Attribution for HPC Study

Suggested attribution for CC BY 4.0 textbook content:

> HPC Study contributors, “HPC Study”, CC BY 4.0,
> https://github.com/ictseoyoungmin/HPC-study

For MIT-licensed code, retain the copyright and MIT permission notice from
`LICENSE-CODE`.

## Contributions

Contributors must submit only material they have the right to contribute.
Unless explicitly stated otherwise:

- code contributions are accepted under MIT;
- educational content contributions are accepted under CC BY 4.0;
- third-party material must be clearly identified with its source and license.

See `CONTRIBUTING.md`.
