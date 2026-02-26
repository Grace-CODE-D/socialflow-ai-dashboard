const fs = require('fs');
const path = require('path');

const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(coveragePath)) {
  console.error('Coverage summary not found. Run tests with coverage first.');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const total = coverage.total;

const metrics = {
  lines: total.lines.pct,
  statements: total.statements.pct,
  functions: total.functions.pct,
  branches: total.branches.pct
};

const getColor = (pct) => {
  if (pct >= 80) return 'brightgreen';
  if (pct >= 60) return 'yellow';
  return 'red';
};

const badges = Object.entries(metrics).map(([key, value]) => {
  const color = getColor(value);
  return `![${key} coverage](https://img.shields.io/badge/${key}-${value.toFixed(1)}%25-${color})`;
});

const badgeContent = `# Test Coverage

${badges.join(' ')}

## Coverage Summary

- **Lines**: ${metrics.lines.toFixed(2)}%
- **Statements**: ${metrics.statements.toFixed(2)}%
- **Functions**: ${metrics.functions.toFixed(2)}%
- **Branches**: ${metrics.branches.toFixed(2)}%

*Last updated: ${new Date().toISOString()}*
`;

fs.writeFileSync(path.join(__dirname, '../COVERAGE.md'), badgeContent);
console.log('✅ Coverage badges generated successfully!');
