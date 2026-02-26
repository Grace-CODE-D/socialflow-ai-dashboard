import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VerificationBadge } from '../VerificationBadge';
import { VerificationStatus } from '../../services/identityService';

describe('VerificationBadge', () => {
  const mockVerifiedStatus: VerificationStatus = {
    isVerified: true,
    verifiedAt: '2026-02-20T10:00:00Z',
    transactionHash: '0x1234567890abcdef',
    attestations: ['Twitter: @testuser', 'GitHub: testuser'],
  };

  const mockUnverifiedStatus: VerificationStatus = {
    isVerified: false,
  };

  describe('Badge Rendering', () => {
    it('should render badge when verified', () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      expect(badge).toBeInTheDocument();
    });

    it('should not render badge when not verified', () => {
      const { container } = render(<VerificationBadge verificationStatus={mockUnverifiedStatus} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render small size badge', () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} size="sm" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4');
    });

    it('should render medium size badge', () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} size="md" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });

    it('should render large size badge', () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} size="lg" />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6');
    });

    it('should have correct color styling', () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-blue-500');
    });
  });

  describe('Verification Status Check', () => {
    it('should display verification date', async () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText(/Verified:/)).toBeInTheDocument();
      });
    });

    it('should display attestations', async () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText(/Twitter: @testuser/)).toBeInTheDocument();
        expect(screen.getByText(/GitHub: testuser/)).toBeInTheDocument();
      });
    });

    it('should handle missing attestations', async () => {
      const statusWithoutAttestations = { ...mockVerifiedStatus, attestations: undefined };
      render(<VerificationBadge verificationStatus={statusWithoutAttestations} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.queryByText(/Attestations:/)).not.toBeInTheDocument();
      });
    });

    it('should handle empty attestations array', async () => {
      const statusWithEmptyAttestations = { ...mockVerifiedStatus, attestations: [] };
      render(<VerificationBadge verificationStatus={statusWithEmptyAttestations} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.queryByText(/Attestations:/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Tooltip Display', () => {
    it('should show tooltip on hover when enabled', async () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} showTooltip={true} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText('Verified on Stellar')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      await waitFor(() => {
        expect(screen.getByText('Verified on Stellar')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(badge.parentElement!);
      await waitFor(() => {
        expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument();
      });
    });

    it('should not show tooltip when disabled', () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} showTooltip={false} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument();
    });

    it('should display tooltip with correct styling', async () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} />
      );
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        const tooltip = container.querySelector('.absolute.z-50');
        expect(tooltip).toHaveClass('bg-[#1A1D1F]', 'border-gray-700');
      });
    });
  });

  describe('On-Chain Proof Display', () => {
    it('should display transaction hash button', async () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText('View On-Chain Verification')).toBeInTheDocument();
      });
    });

    it('should open Stellar Expert on button click', async () => {
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
      
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        const button = screen.getByText('View On-Chain Verification');
        fireEvent.click(button);
      });
      
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `https://stellar.expert/explorer/testnet/tx/${mockVerifiedStatus.transactionHash}`,
        '_blank'
      );
      
      windowOpenSpy.mockRestore();
    });

    it('should not display button when no transaction hash', async () => {
      const statusWithoutHash = { ...mockVerifiedStatus, transactionHash: undefined };
      render(<VerificationBadge verificationStatus={statusWithoutHash} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.queryByText('View On-Chain Verification')).not.toBeInTheDocument();
      });
    });

    it('should handle click without transaction hash gracefully', async () => {
      const statusWithoutHash = { ...mockVerifiedStatus, transactionHash: undefined };
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();
      
      render(<VerificationBadge verificationStatus={statusWithoutHash} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      expect(windowOpenSpy).not.toHaveBeenCalled();
      windowOpenSpy.mockRestore();
    });
  });

  describe('Settings Integration', () => {
    it('should respect showTooltip setting', () => {
      const { rerender } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} showTooltip={true} />
      );
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      expect(screen.queryByText('Verified on Stellar')).toBeInTheDocument();
      
      fireEvent.mouseLeave(badge.parentElement!);
      
      rerender(
        <VerificationBadge verificationStatus={mockVerifiedStatus} showTooltip={false} />
      );
      
      fireEvent.mouseEnter(badge.parentElement!);
      expect(screen.queryByText('Verified on Stellar')).not.toBeInTheDocument();
    });

    it('should respect size setting', () => {
      const { container, rerender } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} size="sm" />
      );
      
      let svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4');
      
      rerender(<VerificationBadge verificationStatus={mockVerifiedStatus} size="lg" />);
      
      svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6');
    });

    it('should use default settings when not specified', () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} />
      );
      
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5'); // default is 'md'
    });
  });

  describe('Accessibility', () => {
    it('should have cursor pointer on badge', () => {
      const { container } = render(
        <VerificationBadge verificationStatus={mockVerifiedStatus} />
      );
      
      const badgeContainer = container.querySelector('.cursor-pointer');
      expect(badgeContainer).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      render(<VerificationBadge verificationStatus={mockVerifiedStatus} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        const button = screen.getByText('View On-Chain Verification');
        expect(button).toBeInTheDocument();
        
        fireEvent.click(button);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null verifiedAt', async () => {
      const statusWithoutDate = { ...mockVerifiedStatus, verifiedAt: undefined };
      render(<VerificationBadge verificationStatus={statusWithoutDate} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.queryByText(/Verified:/)).not.toBeInTheDocument();
      });
    });

    it('should handle multiple attestations', async () => {
      const statusWithManyAttestations = {
        ...mockVerifiedStatus,
        attestations: ['Twitter', 'GitHub', 'LinkedIn', 'Discord'],
      };
      
      render(<VerificationBadge verificationStatus={statusWithManyAttestations} />);
      const badge = screen.getByRole('img', { hidden: true });
      
      fireEvent.mouseEnter(badge.parentElement!);
      
      await waitFor(() => {
        expect(screen.getByText(/Twitter/)).toBeInTheDocument();
        expect(screen.getByText(/GitHub/)).toBeInTheDocument();
        expect(screen.getByText(/LinkedIn/)).toBeInTheDocument();
        expect(screen.getByText(/Discord/)).toBeInTheDocument();
      });
    });
  });
});
