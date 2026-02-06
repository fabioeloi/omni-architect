# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-06

### Added
- 🏗️ Complete orchestration pipeline: PRD → Mermaid → Validation → Figma
- 📄 **Phase 1 - PRD Parser**: Semantic extraction of features, user stories, entities, flows
- 📊 **Phase 2 - Mermaid Generator**: Auto-generation of flowchart, sequence, ER, state, C4, journey, gantt diagrams
- ✅ **Phase 3 - Logic Validator**: Weighted coherence scoring (coverage, consistency, completeness, traceability, naming, dependencies)
- 🎨 **Phase 4 - Figma Generator**: Automated asset creation via Figma API with design system support
- 📦 **Phase 5 - Asset Delivery**: Consolidated deliverables package
- 🔄 Feedback loop for rejected validations
- ⚙️ Configuration via `.omni-architect.yml`
- 🌐 Multi-locale support (default: pt-BR)
- 🎨 Design system presets: Material 3, Apple HIG, Tailwind, Custom
- 📖 Complete SKILL.md following agentskills.io standard
- 📚 Documentation: architecture, configuration, API reference
- 🧪 Test suite for all phases
- 📂 E-Commerce example with full pipeline output

[1.0.0]: https://github.com/fabioeloi/omni-architect/releases/tag/v1.0.0