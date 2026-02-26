import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OnChainProofDisplay } from '../OnChainProofDisplay';

const mockProof = {
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  attestationData: 'verified:twitter:@testuser:2026-02-20',
  blockNumber: 12345678,
  signature: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  timestamp: '2026-02-20T10:00:00Z',
  network: 'testnet' as const,
};

describe('OnChainProofDisplay', () => {
  describe('Component Rendering', () => {
    it('should render proof display component', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText('On-Chain Verification Proof')).toBeInTheDocument();
    });

    it('should display transaction hash', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText(mockProof.transactionHash)).toBeInTheDocument();
    });

    it('should display attestation data', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText(mockProof.attestationData)).toBeInTheDocument();
    });

    it('should display block number', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText('12,345,678')).toBeInTheDocument();
    });

    it('should display signature', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText(mockProof.signature)).toBeInTheDocument();
    });

    it('should display formatted timestamp', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const timestamp = new Date(mockProof.timestamp).toLocaleString();
      expect(screen.getByText(timestamp)).toBeInTheDocument();
    });
  });

  describe('Stellar Expert Link', () => {
    it('should render link to Stellar Expert', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const link = screen.getByText('View on Stellar Expert').closest('a');
      expect(link).toHaveAttribute(
        'href',
        `https://stellar.expert/explorer/testnet/tx/${mockProof.transactionHash}`
      );
    });

    it('should open link in new tab', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const link = screen.getByText('View on Stellar Expert').closest('a');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should use correct network in URL for testnet', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const link = screen.getByText('View on Stellar Expert').closest('a');
      expect(link?.getAttribute('href')).toContain('/testnet/');
    });

    it('should use correct network in URL for mainnet', () => {
      const mainnetProof = { ...mockProof, network: 'mainnet' as const };
      render(<OnChainProofDisplay proof={mainnetProof} />);
      const link = screen.getByText('View on Stellar Expert').closest('a');
      expect(link?.getAttribute('href')).toContain('/mainnet/');
    });
  });

  describe('Copy to Clipboard', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });
    });

    it('should copy transaction hash to clipboard', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      
      fireEvent.click(copyButtons[0]);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProof.transactionHash);
    });

    it('should copy attestation data to clipboard', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      
      fireEvent.click(copyButtons[1]);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProof.attestationData);
    });

    it('should copy signature to clipboard', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      
      fireEvent.click(copyButtons[2]);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockProof.signature);
    });

    it('should render copy buttons for copyable fields', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      expect(copyButtons).toHaveLength(3); // hash, attestation, signature
    });
  });

  describe('Field Labels', () => {
    it('should display all field labels', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      
      expect(screen.getByText('Transaction Hash')).toBeInTheDocument();
      expect(screen.getByText('Attestation Data')).toBeInTheDocument();
      expect(screen.getByText('Block Number')).toBeInTheDocument();
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText('Verification Signature')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should have correct container styling', () => {
      const { container } = render(<OnChainProofDisplay proof={mockProof} />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('bg-dark-surface', 'rounded-xl', 'p-6');
    });

    it('should display verification icon', () => {
      const { container } = render(<OnChainProofDisplay proof={mockProof} />);
      const icon = container.querySelector('.material-symbols-outlined');
      expect(icon).toHaveTextContent('verified');
    });

    it('should use monospace font for technical data', () => {
      const { container } = render(<OnChainProofDisplay proof={mockProof} />);
      const monoElements = container.querySelectorAll('.font-mono');
      expect(monoElements.length).toBeGreaterThan(0);
    });
  });

  describe('Data Formatting', () => {
    it('should format block number with commas', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText('12,345,678')).toBeInTheDocument();
    });

    it('should format timestamp as locale string', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const expectedTimestamp = new Date(mockProof.timestamp).toLocaleString();
      expect(screen.getByText(expectedTimestamp)).toBeInTheDocument();
    });

    it('should display full hash values without truncation', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText(mockProof.transactionHash)).toBeInTheDocument();
      expect(screen.getByText(mockProof.signature)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button text', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      expect(screen.getByText('View on Stellar Expert')).toBeInTheDocument();
    });

    it('should have title attributes on copy buttons', () => {
      render(<OnChainProofDisplay proof={mockProof} />);
      const copyButtons = screen.getAllByTitle('Copy to clipboard');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long transaction hashes', () => {
      const longHashProof = {
        ...mockProof,
        transactionHash: '0x' + 'a'.repeat(128),
      };
      render(<OnChainProofDisplay proof={longHashProof} />);
      expect(screen.getByText(longHashProof.transactionHash)).toBeInTheDocument();
    });

    it('should handle large block numbers', () => {
      const largeBlockProof = {
        ...mockProof,
        blockNumber: 999999999,
      };
      render(<OnChainProofDisplay proof={largeBlockProof} />);
      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('should handle special characters in attestation data', () => {
      const specialCharsProof = {
        ...mockProof,
        attestationData: 'verified:twitter:@test_user-123:2026-02-20',
      };
      render(<OnChainProofDisplay proof={specialCharsProof} />);
      expect(screen.getByText(specialCharsProof.attestationData)).toBeInTheDocument();
    });
  });
});
