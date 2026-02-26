/**
 * E2E Test Report Generator
 * Generates comprehensive HTML and Markdown reports from test results
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  suites: TestSuite[];
  coverage?: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
}

export class ReportGenerator {
  private report: TestReport;

  constructor(report: TestReport) {
    this.report = report;
  }

  /**
   * Generate HTML report
   */
  generateHTML(): string {
    const passRate = ((this.report.passedTests / this.report.totalTests) * 100).toFixed(2);
    const statusColor = this.report.failedTests === 0 ? '#10b981' : '#ef4444';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E2E Test Report - SocialFlow</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0d0f11;
            color: #ffffff;
            padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #14b8a6 100%);
            padding: 2rem;
            border-radius: 1rem;
            margin-bottom: 2rem;
        }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .header p { opacity: 0.9; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: #161b22;
            padding: 1.5rem;
            border-radius: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stat-card h3 {
            font-size: 0.875rem;
            color: #8892b0;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
        }
        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: ${statusColor};
        }
        .suite {
            background: #161b22;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        .suite-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .suite-header h2 { font-size: 1.25rem; }
        .suite-header .duration {
            color: #8892b0;
            font-size: 0.875rem;
        }
        .test {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            border-radius: 0.5rem;
            background: rgba(255, 255, 255, 0.02);
        }
        .test.passed { border-left: 3px solid #10b981; }
        .test.failed { border-left: 3px solid #ef4444; }
        .test.skipped { border-left: 3px solid #f59e0b; }
        .test-name { flex: 1; }
        .test-status {
            padding: 0.25rem 0.75rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        .test-status.passed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .test-status.failed { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .test-status.skipped { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .error {
            margin-top: 0.5rem;
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 0.5rem;
            color: #ef4444;
            font-family: monospace;
            font-size: 0.875rem;
        }
        .coverage {
            background: #161b22;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        .coverage h2 { margin-bottom: 1rem; }
        .coverage-bar {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }
        .coverage-label {
            width: 120px;
            color: #8892b0;
            font-size: 0.875rem;
        }
        .coverage-progress {
            flex: 1;
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
            overflow: hidden;
            margin: 0 1rem;
        }
        .coverage-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #14b8a6);
            transition: width 0.3s ease;
        }
        .coverage-value {
            font-weight: 600;
            min-width: 50px;
            text-align: right;
        }
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: #8892b0;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 E2E Test Report</h1>
            <p>SocialFlow Campaign System - ${this.report.timestamp}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <h3>Total Tests</h3>
                <div class="value">${this.report.totalTests}</div>
            </div>
            <div class="stat-card">
                <h3>Passed</h3>
                <div class="value" style="color: #10b981">${this.report.passedTests}</div>
            </div>
            <div class="stat-card">
                <h3>Failed</h3>
                <div class="value" style="color: #ef4444">${this.report.failedTests}</div>
            </div>
            <div class="stat-card">
                <h3>Pass Rate</h3>
                <div class="value">${passRate}%</div>
            </div>
            <div class="stat-card">
                <h3>Duration</h3>
                <div class="value" style="font-size: 1.5rem">${(this.report.duration / 1000).toFixed(2)}s</div>
            </div>
        </div>

        ${this.report.suites.map(suite => this.generateSuiteHTML(suite)).join('')}

        ${this.report.coverage ? this.generateCoverageHTML() : ''}

        <div class="footer">
            <p>Generated by SocialFlow E2E Test Suite</p>
            <p>Powered by Vitest</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate suite HTML
   */
  private generateSuiteHTML(suite: TestSuite): string {
    return `
        <div class="suite">
            <div class="suite-header">
                <h2>${suite.name}</h2>
                <span class="duration">${(suite.duration / 1000).toFixed(2)}s</span>
            </div>
            ${suite.tests.map(test => this.generateTestHTML(test)).join('')}
        </div>
    `;
  }

  /**
   * Generate test HTML
   */
  private generateTestHTML(test: TestResult): string {
    return `
        <div class="test ${test.status}">
            <div class="test-name">${test.name}</div>
            <span class="test-status ${test.status}">${test.status}</span>
            ${test.error ? `<div class="error">${test.error}</div>` : ''}
        </div>
    `;
  }

  /**
   * Generate coverage HTML
   */
  private generateCoverageHTML(): string {
    if (!this.report.coverage) return '';

    return `
        <div class="coverage">
            <h2>Code Coverage</h2>
            ${this.generateCoverageBar('Lines', this.report.coverage.lines)}
            ${this.generateCoverageBar('Statements', this.report.coverage.statements)}
            ${this.generateCoverageBar('Functions', this.report.coverage.functions)}
            ${this.generateCoverageBar('Branches', this.report.coverage.branches)}
        </div>
    `;
  }

  /**
   * Generate coverage bar
   */
  private generateCoverageBar(label: string, value: number): string {
    return `
        <div class="coverage-bar">
            <div class="coverage-label">${label}</div>
            <div class="coverage-progress">
                <div class="coverage-fill" style="width: ${value}%"></div>
            </div>
            <div class="coverage-value">${value.toFixed(1)}%</div>
        </div>
    `;
  }

  /**
   * Generate Markdown report
   */
  generateMarkdown(): string {
    const passRate = ((this.report.passedTests / this.report.totalTests) * 100).toFixed(2);
    const status = this.report.failedTests === 0 ? '✅ PASSED' : '❌ FAILED';

    let markdown = `# E2E Test Report - SocialFlow Campaign System\n\n`;
    markdown += `**Status**: ${status}\n`;
    markdown += `**Timestamp**: ${this.report.timestamp}\n`;
    markdown += `**Duration**: ${(this.report.duration / 1000).toFixed(2)}s\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${this.report.totalTests} |\n`;
    markdown += `| Passed | ${this.report.passedTests} |\n`;
    markdown += `| Failed | ${this.report.failedTests} |\n`;
    markdown += `| Skipped | ${this.report.skippedTests} |\n`;
    markdown += `| Pass Rate | ${passRate}% |\n\n`;

    if (this.report.coverage) {
      markdown += `## Coverage\n\n`;
      markdown += `| Type | Coverage |\n`;
      markdown += `|------|----------|\n`;
      markdown += `| Lines | ${this.report.coverage.lines.toFixed(1)}% |\n`;
      markdown += `| Statements | ${this.report.coverage.statements.toFixed(1)}% |\n`;
      markdown += `| Functions | ${this.report.coverage.functions.toFixed(1)}% |\n`;
      markdown += `| Branches | ${this.report.coverage.branches.toFixed(1)}% |\n\n`;
    }

    markdown += `## Test Suites\n\n`;
    for (const suite of this.report.suites) {
      markdown += `### ${suite.name}\n\n`;
      markdown += `Duration: ${(suite.duration / 1000).toFixed(2)}s\n\n`;
      
      for (const test of suite.tests) {
        const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️';
        markdown += `- ${icon} ${test.name}\n`;
        if (test.error) {
          markdown += `  \`\`\`\n  ${test.error}\n  \`\`\`\n`;
        }
      }
      markdown += `\n`;
    }

    return markdown;
  }

  /**
   * Save reports to files
   */
  async saveReports(outputDir: string): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save HTML report
    const htmlPath = path.join(outputDir, 'e2e-report.html');
    fs.writeFileSync(htmlPath, this.generateHTML());
    console.log(`✅ HTML report saved to: ${htmlPath}`);

    // Save Markdown report
    const mdPath = path.join(outputDir, 'e2e-report.md');
    fs.writeFileSync(mdPath, this.generateMarkdown());
    console.log(`✅ Markdown report saved to: ${mdPath}`);

    // Save JSON report
    const jsonPath = path.join(outputDir, 'e2e-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.report, null, 2));
    console.log(`✅ JSON report saved to: ${jsonPath}`);
  }
}

// Example usage
if (require.main === module) {
  const mockReport: TestReport = {
    timestamp: new Date().toISOString(),
    totalTests: 60,
    passedTests: 58,
    failedTests: 2,
    skippedTests: 0,
    duration: 12500,
    suites: [
      {
        name: 'Campaign Creation',
        duration: 2000,
        tests: [
          { name: 'should create campaign with valid data', status: 'passed', duration: 150 },
          { name: 'should fail without required fields', status: 'passed', duration: 100 },
        ],
      },
    ],
    coverage: {
      lines: 85.5,
      statements: 87.2,
      functions: 82.1,
      branches: 78.9,
    },
  };

  const generator = new ReportGenerator(mockReport);
  generator.saveReports('test-results');
}
