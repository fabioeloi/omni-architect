const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const skillPath = path.join(process.cwd(), 'SKILL.md');
  const readmePath = path.join(process.cwd(), 'README.md');
  const [skill, readme] = await Promise.all([
    fs.readFile(skillPath, 'utf8'),
    fs.readFile(readmePath, 'utf8')
  ]);

  const errors = [];
  if (!/^---[\s\S]+---/m.test(skill)) {
    errors.push('SKILL.md is missing frontmatter.');
  }
  if (!/##\s+Usage/i.test(skill)) {
    errors.push('SKILL.md is missing a Usage section.');
  }
  if (!/#\s+🗗?️?\s*Omni Architect/i.test(readme) && !/#\s+🏗️\s+Omni Architect/i.test(readme)) {
    errors.push('README.md does not contain the project title.');
  }

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }

  console.log('Skill documentation looks valid.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
