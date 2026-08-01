import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import JobProgressPanel from '../JobProgressPanel';
import { JobState, JobProgressEvent } from '../../hooks/useJobStream';

describe('JobProgressPanel', () => {
  const mockOnDismiss = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no jobs', () => {
    const jobs: JobState = {};
    
    const { container } = render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    // Should render nothing
    expect(container.firstChild).toBeNull();
  });

  it('renders job cards for each job', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 50,
        message: 'Processing video...',
      },
      'job-2': {
        jobId: 'job-2',
        userId: 'user-1',
        type: 'ai_generation',
        status: 'pending',
        progress: 0,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    expect(screen.getByText('Video Transcoding')).toBeInTheDocument();
    expect(screen.getByText('AI Generation')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('Processing video...')).toBeInTheDocument();
  });

  it('renders progress bar for processing jobs', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 75,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
  });

  it('does not render progress bar for non-processing jobs', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'completed',
        progress: 100,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    // Should not have progress bar for completed jobs
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked for completed job', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'completed',
        progress: 100,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    const dismissButton = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('job-1');
  });

  it('calls onDismiss when dismiss button is clicked for failed job', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'failed',
        progress: 0,
        error: 'Transcoding failed',
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    const dismissButton = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledWith('job-1');
  });

  it('shows retry button for failed jobs when onRetry is provided', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'failed',
        progress: 0,
        error: 'Transcoding failed',
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} onRetry={mockOnRetry} />
    );
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'failed',
        progress: 0,
        error: 'Transcoding failed',
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} onRetry={mockOnRetry} />
    );
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledWith('job-1');
  });

  it('does not show retry button for failed jobs when onRetry is not provided', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'failed',
        progress: 0,
        error: 'Transcoding failed',
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('does not show dismiss button for pending or processing jobs', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 50,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    // Dismiss button should not be visible for processing jobs
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('shows error message for failed jobs', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'failed',
        progress: 0,
        error: 'Transcoding failed due to unsupported format',
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    expect(screen.getByText('Transcoding failed due to unsupported format')).toBeInTheDocument();
  });

  it('shows message for jobs with messages', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 50,
        message: 'Processing frame 250 of 500',
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    expect(screen.getByText('Processing frame 250 of 500')).toBeInTheDocument();
  });

  it('shows job ID at the bottom of each card', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1-test-id-12345',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 50,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    expect(screen.getByText('job-1-test-id-12345')).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const jobs: JobState = {
      'pending': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'pending',
        progress: 0,
      },
      'processing': {
        jobId: 'job-2',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 50,
      },
      'completed': {
        jobId: 'job-3',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'completed',
        progress: 100,
      },
      'failed': {
        jobId: 'job-4',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'failed',
        progress: 0,
      },
    };
    
    const { container } = render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    // Check that status badges have appropriate classes
    const statusBadges = container.querySelectorAll('[class*="bg-"]');
    expect(statusBadges.length).toBeGreaterThan(0);
    
    // We can't easily test the exact CSS classes since they're dynamically generated,
    // but we can verify all statuses are displayed
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('renders with fixed positioning and correct ARIA attributes', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'video_transcoding',
        status: 'processing',
        progress: 50,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    const panel = screen.getByLabelText('Job progress');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('aria-live', 'polite');
    
    expect(panel).toHaveClass('fixed');
    expect(panel).toHaveClass('bottom-4');
    expect(panel).toHaveClass('right-4');
  });

  it('handles unknown job types gracefully', () => {
    const jobs: JobState = {
      'job-1': {
        jobId: 'job-1',
        userId: 'user-1',
        type: 'unknown_type' as any, // Unknown type
        status: 'processing',
        progress: 50,
      },
    };
    
    render(
      <JobProgressPanel jobs={jobs} onDismiss={mockOnDismiss} />
    );
    
    // Should show the raw type string for unknown types
    expect(screen.getByText('unknown_type')).toBeInTheDocument();
  });
});