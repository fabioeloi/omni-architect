# Changelog

## 1.1.0 (In Development)

### Added

- **Figma Agent API Integration**: New REST API client for direct canvas manipulation
  - `lib/figma-client.js`: Complete REST API client with rate limiting, retries, and batch operations
  - Support for creating frames, text, rectangles, vectors, and connectors
  - Design variables integration for design system binding
  - Deep link generation for Figma nodes

- **Flexible Integration Modes**: Three modes for Figma integration
  - `rest_api`: Fully automated via REST API (requires service token)
  - `plugin`: Manual import via plugin (existing workflow)
  - `auto`: Intelligent selection based on available credentials (default)

- **Configuration Enhancements**
  - `figma_service_token`: Service account authentication for REST API
  - `figma_integration_mode`: Control integration approach
  - Environment variables: `FIGMA_SERVICE_TOKEN`, `FIGMA_INTEGRATION_MODE`
  - Backward compatible: `figma_access_token` no longer strictly required

- **Comprehensive Documentation**
  - `docs/figma-agent-api-assessment.md`: Full impact assessment and roadmap
  - `docs/figma-agent-api-examples.md`: Configuration, usage, and migration examples
  - Updated README with integration mode comparison

- **Testing**
  - 11 new unit tests for `FigmaAgentClient`
  - 11 new config validation tests
  - All tests passing (25 total)

### Changed

- Configuration validation now accepts either `figma_service_token` OR `figma_access_token`
- Default `figma_integration_mode` is `auto` (intelligently selects based on tokens)
- Updated config resolution to apply defaults for integration mode

### Documentation

- Detailed assessment of Figma Agent API impact
- CI/CD integration examples (GitHub Actions, GitLab CI)
- Migration guide from plugin to REST API mode
- Troubleshooting guide and best practices

## 1.0.0

- pipeline funcional `run -> plugin/wrapper -> resume`
- harness local para preview Mermaid e wrapper do plugin
- scripts públicos para e2e local, bootstrap Figma e preparo de release
- documentação técnica e guia leigo do PRD de exemplo
