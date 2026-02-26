import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportCustomizer } from '../../reports/ReportCustomizer';
import { ReportTemplate, Platform } from '../../../types';

const mockTemplate: ReportTemplate = {
  id: 'test',
  name: 'Test Report',
  sections: [
    { id: '1', type: 'summary', title: 'Summary', order: 0 },
    { id: '2', type: 'metrics', title: 'Metrics', order: 1 },
  ],
  metrics: [
    { id: 'm1', name: 'Engagement', value: 1000, change: 10, category: 'engagement', enabled: true },
    { id: 'm2', name: 'Reach', value: 5000, change: 5, category: 'performance', enabled: false },
  ],
  branding: {
    primaryColor: '#3b82f6',
    secondaryColor: '#14b8a6',
    companyName: 'Test Company',
  },
  filters: {
    dateRange: { start: new Date(), end: new Date() },
    platforms: [Platform.INSTAGRAM],
    compareWithPrevious: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ReportCustomizer', () => {
  const mockOnTemplateChange = jest.fn();
  const mockOnLoadTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders report sections', () => {
    render(
      <ReportCustomizer
        template={mockTemplate}
        onTemplateChange={mockOnTemplateChange}
        savedTemplates={[mockTemplate]}
        onLoadTemplate={mockOnLoadTemplate}
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
  });

  it('renders metric selection checkboxes', () => {
    render(
      <ReportCustomizer
        template={mockTemplate}
        onTemplateChange={mockOnTemplateChange}
        savedTemplates={[mockTemplate]}
        onLoadTemplate={mockOnLoadTemplate}
      />
    );

    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Reach')).toBeInTheDocument();
  });

  it('toggles metric selection', () => {
    render(
      <ReportCustomizer
        template={mockTemplate}
        onTemplateChange={mockOnTemplateChange}
        savedTemplates={[mockTemplate]}
        onLoadTemplate={mockOnLoadTemplate}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockOnTemplateChange).toHaveBeenCalled();
  });

  it('updates branding company name', () => {
    render(
      <ReportCustomizer
        template={mockTemplate}
        onTemplateChange={mockOnTemplateChange}
        savedTemplates={[mockTemplate]}
        onLoadTemplate={mockOnLoadTemplate}
      />
    );

    const input = screen.getByDisplayValue('Test Company');
    fireEvent.change(input, { target: { value: 'New Company' } });

    expect(mockOnTemplateChange).toHaveBeenCalled();
  });

  it('adds new text section', () => {
    render(
      <ReportCustomizer
        template={mockTemplate}
        onTemplateChange={mockOnTemplateChange}
        savedTemplates={[mockTemplate]}
        onLoadTemplate={mockOnLoadTemplate}
      />
    );

    const addButton = screen.getByText('Add Text Section');
    fireEvent.click(addButton);

    expect(mockOnTemplateChange).toHaveBeenCalled();
  });
});
