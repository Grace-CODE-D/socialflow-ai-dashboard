import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExecutiveSummaryGenerator } from '../../reports/ExecutiveSummaryGenerator';
import { ReportTemplate, Platform } from '../../../types';

const mockTemplate: ReportTemplate = {
  id: 'test',
  name: 'Test Report',
  sections: [],
  metrics: [],
  branding: {
    primaryColor: '#3b82f6',
    secondaryColor: '#14b8a6',
    companyName: 'Test Company',
  },
  filters: {
    dateRange: { start: new Date(2026, 1, 1), end: new Date(2026, 1, 28) },
    platforms: [Platform.INSTAGRAM],
    compareWithPrevious: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ExecutiveSummaryGenerator', () => {
  it('shows loading state initially', () => {
    render(<ExecutiveSummaryGenerator template={mockTemplate} />);
    
    expect(screen.getByText('Generating Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('AI is analyzing your data and creating insights...')).toBeInTheDocument();
  });

  it('displays key insights after generation', async () => {
    render(<ExecutiveSummaryGenerator template={mockTemplate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Key Insights')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText(/Instagram engagement increased/i)).toBeInTheDocument();
  });

  it('displays top performers section', async () => {
    render(<ExecutiveSummaryGenerator template={mockTemplate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Top Performers')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays trends section', async () => {
    render(<ExecutiveSummaryGenerator template={mockTemplate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Trends & Patterns')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays recommendations section', async () => {
    render(<ExecutiveSummaryGenerator template={mockTemplate} />);
    
    await waitFor(() => {
      expect(screen.getByText('AI-Powered Recommendations')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('displays period comparison', async () => {
    render(<ExecutiveSummaryGenerator template={mockTemplate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Period-over-Period Comparison')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
