import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExecutiveReports } from '../ExecutiveReports';

describe('ExecutiveReports', () => {
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders executive reports page with tabs', () => {
    render(<ExecutiveReports onNavigate={mockOnNavigate} />);
    
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
    expect(screen.getByText('Customize Report')).toBeInTheDocument();
    expect(screen.getByText('Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<ExecutiveReports onNavigate={mockOnNavigate} />);
    
    const summaryTab = screen.getByText('Executive Summary');
    fireEvent.click(summaryTab);
    
    expect(screen.getByText('AI is analyzing your data and creating insights...')).toBeInTheDocument();
  });

  it('displays save template button', () => {
    render(<ExecutiveReports onNavigate={mockOnNavigate} />);
    
    const saveButton = screen.getByText('Save Template');
    expect(saveButton).toBeInTheDocument();
  });

  it('displays export report button', () => {
    render(<ExecutiveReports onNavigate={mockOnNavigate} />);
    
    const exportButton = screen.getByText('Export Report');
    expect(exportButton).toBeInTheDocument();
  });

  it('shows alert when saving template', () => {
    window.alert = jest.fn();
    render(<ExecutiveReports onNavigate={mockOnNavigate} />);
    
    const saveButton = screen.getByText('Save Template');
    fireEvent.click(saveButton);
    
    expect(window.alert).toHaveBeenCalledWith('Template saved successfully!');
  });

  it('shows alert when exporting report', () => {
    window.alert = jest.fn();
    render(<ExecutiveReports onNavigate={mockOnNavigate} />);
    
    const exportButton = screen.getByText('Export Report');
    fireEvent.click(exportButton);
    
    expect(window.alert).toHaveBeenCalledWith('Report exported as PDF!');
  });
});
