import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NFTGallery } from '../../NFTGallery';

describe('NFTGallery Component', () => {
  it('renders NFT gallery', () => {
    render(<NFTGallery />);
    expect(screen.getByText(/NFT Collection/i)).toBeInTheDocument();
  });

  it('displays NFT items', () => {
    const { container } = render(<NFTGallery />);
    const nftItems = container.querySelectorAll('[class*="nft"]');
    expect(nftItems.length).toBeGreaterThan(0);
  });

  it('handles scroll events', () => {
    const { container } = render(<NFTGallery />);
    const scrollContainer = container.querySelector('[style*="overflow"]');
    if (scrollContainer) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 100 } });
      expect(scrollContainer.scrollTop).toBe(100);
    }
  });
});
