const path = require('node:path');
const { run } = require('../index');

async function main() {
  const outputDir = path.join(process.cwd(), 'output', 'example');
  const result = await run({
    prd_source: path.join(process.cwd(), 'examples', 'prd-ecommerce.md'),
    project_name: 'E-Commerce Platform',
    figma_file_key: 'EXAMPLE_FILE_KEY',
    figma_access_token: 'EXAMPLE_TOKEN',
    validation_mode: 'auto',
    diagram_types: [
      'flowchart',
      'sequence',
      'erDiagram',
      'stateDiagram',
      'C4Context',
      'journey'
    ],
    output_dir: outputDir
  });

  console.log(
    JSON.stringify(
      {
        status: result.status,
        output_dir: result.output_dir,
        validation_score: result.validation_report.overall_score,
        output_paths: result.output_paths
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
