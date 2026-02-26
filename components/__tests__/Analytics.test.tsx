import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Analytics } from '../../Analytics';

describe('Analytics Component', () => {
  it('renders analytics dashboard', () => {
    render(<Analytics />);
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
  });

  it('displays engagement data', () => {
    const { container } = render(<Analytics />);
    const charts = container.querySelectorAll('.recharts-wrapper');
    expect(charts.length).toBeGreaterThan(0);
  });

  it('shows export button', () => {
    render(<Analytics />);
    const exportBtn = screen.getByText(/Export/i);
    expect(exportBtn).toBeInTheDocument();
  });

  it('displays metrics cards', () => {
    const { container } = render(<Analytics />);
    const cards = container.querySelectorAll('[class*="card"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});
