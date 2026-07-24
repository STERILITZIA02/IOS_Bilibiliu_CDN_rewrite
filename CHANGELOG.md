# Changelog

All notable changes to this project are documented here.

## [1.0.0] - 2026-07-24

- Add a directly installable Shadowrocket module for iOS 26 and iOS 27.
- Add JSON playback-response rewriting for UGC, PGC, PUGV, DASH, and DURL.
- Add dependency-free gRPC framing and recursive Protobuf URL rewriting for
  current Bilibili iOS playback services.
- Add a focused Bilibili rule set covering API, static, VOD CDN, and live CDN
  traffic.
- Preserve signed live CDN hosts and route them through the selected policy.
- Add deterministic builds, checksums, tests, CI, and tagged-release automation.
