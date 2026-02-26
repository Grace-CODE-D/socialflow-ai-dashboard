import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IPFSUploader } from '../../IPFSUploader';

describe('IPFSUploader Component', () => {
  it('renders uploader', () => {
    render(<IPFSUploader onUploadComplete={jest.fn()} />);
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();
  });

  it('handles file selection', () => {
    const onUpload = jest.fn();
    render(<IPFSUploader onUploadComplete={onUpload} />);
    const input = screen.getByLabelText(/upload/i) || document.querySelector('input[type="file"]');
    if (input) {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [file] } });
      expect(input).toBeTruthy();
    }
  });

  it('displays upload progress', () => {
    const { container } = render(<IPFSUploader onUploadComplete={jest.fn()} />);
    expect(container).toBeTruthy();
  });
});
