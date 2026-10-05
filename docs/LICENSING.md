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

The current content modules contain educational text inside JavaScript data
objects. In those mixed files, the educational text/data remains CC BY 4.0 while
the surrounding program logic is MIT. A future content-storage migration may
make this boundary physical as well as legal.

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

Examples recorded in `docs/SOURCES.md` include:

- Linux kernel source/documentation: kernel-wide GPL-2.0-only framework with
  per-file SPDX identifiers that may differ.
- Slurm code and documentation: GNU GPL v2 or later according to upstream
  `COPYING`.
- Open MPI: Open MPI BSD 3-clause variant.
- MPICH: upstream permissive COPYRIGHT notice with attribution/notice terms.
- AMD ROCm top-level documentation repository: MIT.
- OpenHPC repository: Apache-2.0.
- Red Hat documentation: generally CC BY-SA 3.0 except where a document says
  otherwise.
- NVIDIA CUDA documentation: governed by NVIDIA SDK/documentation terms; treat
  as reference-only unless a specific item grants broader reuse rights.
- Intel documents: Intel website/document terms restrict redistribution and
  modification; treat as reference-only unless the specific material grants a
  broader license.

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
