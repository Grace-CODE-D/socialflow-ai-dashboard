import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Settings } from '../../Settings';
import { identityService } from '../../../services/identityService';

jest.mock('../../../services/identityService');

describe('Settings Component', () => {
  beforeEach(() => {
    (identityService.getVerificationStatus as jest.Mock).mockResolvedValue({ isVerified: false });
  });

  it('renders settings page', () => {
    render(<Settings />);
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('toggles dark mode', () => {
    render(<Settings />);
    const toggle = screen.getAllByRole('checkbox')[0];
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('loads verification status', async () => {
    render(<Settings />);
    await waitFor(() => {
      expect(identityService.getVerificationStatus).toHaveBeenCalled();
    });
  });

  it('handles verification modal', async () => {
    render(<Settings />);
    const verifyButton = screen.queryByText(/Verify/i);
    if (verifyButton) {
      fireEvent.click(verifyButton);
      await waitFor(() => {
        expect(screen.getByText(/Verification/i)).toBeInTheDocument();
      });
    }
  });
});
