# Third-Party Research Notices

The runtime and build have no third-party package dependencies. The project
implementation was written independently in this repository.

The following public projects were inspected to cross-check endpoint coverage,
interoperability field meanings, Shadowrocket module syntax, conservative
network rules, and known compatibility risks. Unless explicitly stated below,
their source code is not incorporated into this repository.

## BiliUniverse/ADBlock

- Repository: https://github.com/BiliUniverse/ADBlock
- Reviewed commit: `43b07841fa55ba77e29d478cab0be44c8b49a3c2`
- License: Apache License 2.0
- Use: endpoint scope and high-confidence advertisement semantics were
  researched; filtering code was independently implemented.

## BiliUniverse/Enhanced

- Repository: https://github.com/BiliUniverse/Enhanced
- Reviewed commit: `6fcb1be0fb6d97e01123da4a3e2fd9a345f49840`
- License: Apache License 2.0
- Use: navigation field semantics were researched; the project does not copy
  its response-replacement implementation.

## BiliUniverse/Redirect

- Repository: https://github.com/BiliUniverse/Redirect
- Reviewed commit: `7e446284790953ad690fee5fa21afe78f00232f5`
- License: Apache License 2.0
- Use: CDN families, regional behavior, and reported MCDN/TLS compatibility
  risks were cross-checked; redirect code was not copied.

## Maasea/sgmodule

- Repository: https://github.com/Maasea/sgmodule
- Reviewed commit: `65075cdb388fc5e3094afd7e7314c67b243f3525`
- License: Apache License 2.0
- Use: Shadowrocket module endpoint conventions and the narrow
  `DOMAIN-WILDCARD,*pcdn*.biliapi.net` rule were cross-checked. No JavaScript
  implementation was copied.

## app2smile/rules

- Repository: https://github.com/app2smile/rules
- Reviewed commit: `df6366a7024e0b3f0aa3510c5b791eea6f3cba89`
- License: MIT License, Copyright (c) 2023 app2smile
- Use: advertisement response features were cross-checked; filtering code and
  rule collections were not copied.

## bilibili-API-collect public mirror

- Repository: https://gitea.s1f.ren/shiran/bilibili-API-collect
- Reviewed commit: `cfc5fddcc8a94b74d91970bb5b4eaeb349addc47`
- License: Creative Commons Attribution-NonCommercial 4.0 International
- Use: public Protobuf field-number and field-meaning facts were used only for
  interoperability review. No `.proto` schema or generated implementation is
  distributed by this repository.

## pskdje/bilibili-API-collect

- Repository: https://github.com/pskdje/bilibili-API-collect
- Reviewed commit: `271b123a083698bf576101c21f534b3418768a43`
- License: no standard SPDX license was declared by the repository at review
  time.
- Use: the public JSON field separation for the VIP-center combine endpoint was
  inspected as an interoperability fact. No documentation text, example data,
  schema, or implementation is incorporated.

## Shadowrocket documentation

- Repository: https://github.com/LOWERTOP/Shadowrocket
- Use: public module, script, MITM, installation, and update behavior was
  consulted. Shadowrocket is a third-party application and is not distributed
  by this repository.

## User-provided Tampermonkey reference

The initial user-provided script informed the general requirement to preserve
URL paths and signed query strings. Its code is not included in this project;
the JSON and Protobuf implementations were written for Shadowrocket from
scratch.

The notices above do not change the license of this repository's independent
code, which is released under the [MIT License](LICENSE).
