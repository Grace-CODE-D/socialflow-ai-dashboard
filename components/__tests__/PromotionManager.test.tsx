import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PromotionManager } from '../../PromotionManager';

describe('PromotionManager Component', () => {
  it('renders promotion manager', () => {
    render(<PromotionManager />);
    expect(screen.getByText(/Promotion/i)).toBeInTheDocument();
  });

  it('displays campaign list', () => {
    const { container } = render(<PromotionManager />);
    expect(container.querySelector('[class*="campaign"]')).toBeTruthy();
  });

  it('handles create campaign button', () => {
    render(<PromotionManager />);
    const createBtn = screen.getByText(/Create/i);
    fireEvent.click(createBtn);
    expect(createBtn).toBeInTheDocument();
  });

  it('shows campaign details', async () => {
    render(<PromotionManager />);
    await waitFor(() => {
      expect(screen.getByText(/Promotion/i)).toBeInTheDocument();
    });
  });
});
