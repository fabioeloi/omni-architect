const DEFAULT_DIAGRAM_TYPES = [
  'flowchart',
  'sequence',
  'erDiagram',
  'stateDiagram',
  'C4Context'
];

const DEFAULTS = {
  design_system: 'material-3',
  locale: 'pt-BR',
  validation_mode: 'interactive',
  validation_threshold: 0.85,
  diagram_types: DEFAULT_DIAGRAM_TYPES,
  output_dir: 'output',
  figma_integration_mode: 'auto' // auto | rest_api | plugin
};

module.exports = {
  DEFAULTS,
  DEFAULT_DIAGRAM_TYPES
};
