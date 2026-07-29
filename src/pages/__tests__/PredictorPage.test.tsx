import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PredictorPage } from '../PredictorPage';

// Mock the ReachScoreWidget since it's a child component
vi.mock('../../components/ReachScoreWidget', () => ({
  ReachScoreWidget: vi.fn(() => <div data-testid="reach-score-widget">Mock ReachScoreWidget</div>)
}));

describe('PredictorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and description', () => {
    render(<PredictorPage />);
    
    expect(screen.getByText('AI Reach Predictor')).toBeInTheDocument();
    expect(screen.getByText(/Draft a post and see its projected reach in real time/i)).toBeInTheDocument();
  });

  it('renders all platform buttons', () => {
    render(<PredictorPage />);
    
    const platforms = ['Instagram', 'TikTok', 'X', 'LinkedIn', 'YouTube', 'Facebook'];
    platforms.forEach(platform => {
      expect(screen.getByText(platform)).toBeInTheDocument();
    });
  });

  it('has Instagram selected by default', () => {
    render(<PredictorPage />);
    
    // Instagram button should have the selected styling
    const instagramButton = screen.getByText('Instagram');
    expect(instagramButton).toHaveClass('bg-primary-purple/20');
    expect(instagramButton).toHaveClass('border-primary-purple/40');
    expect(instagramButton).toHaveClass('text-primary-purple');
  });

  it('changes platform when platform button is clicked', () => {
    render(<PredictorPage />);
    
    // Click TikTok button
    const tiktokButton = screen.getByText('TikTok');
    fireEvent.click(tiktokButton);
    
    // TikTok should now be selected
    expect(tiktokButton).toHaveClass('bg-primary-purple/20');
    expect(tiktokButton).toHaveClass('border-primary-purple/40');
    expect(tiktokButton).toHaveClass('text-primary-purple');
    
    // Instagram should no longer be selected
    const instagramButton = screen.getByText('Instagram');
    expect(instagramButton).not.toHaveClass('bg-primary-purple/20');
    expect(instagramButton).not.toHaveClass('border-primary-purple/40');
    expect(instagramButton).not.toHaveClass('text-primary-purple');
  });

  it('renders textarea with sample content', () => {
    render(<PredictorPage />);
    
    const textarea = screen.getByPlaceholderText('Type your post…');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Excited to announce our new product launch! 🚀 Check it out — link in bio #innovation #tech #startup');
  });

  it('updates textarea content when typed', () => {
    render(<PredictorPage />);
    
    const textarea = screen.getByPlaceholderText('Type your post…');
    const newContent = 'This is a new test post content';
    
    fireEvent.change(textarea, { target: { value: newContent } });
    
    expect(textarea).toHaveValue(newContent);
  });

  it('shows character and hashtag count', () => {
    render(<PredictorPage />);
    
    // Initial sample content has 3 hashtags and specific character count
    expect(screen.getByText(/3 hashtags/i)).toBeInTheDocument();
    expect(screen.getByText(/ chars/i)).toBeInTheDocument();
  });

  it('renders follower count slider with default value', () => {
    render(<PredictorPage />);
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('120000');
  });

  it('updates follower count when slider is moved', () => {
    render(<PredictorPage />);
    
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50000' } });
    
    expect(slider).toHaveValue('50000');
  });

  it('renders ReachScoreWidget component', () => {
    render(<PredictorPage />);
    
    expect(screen.getByTestId('reach-score-widget')).toBeInTheDocument();
  });

  it('renders platform buttons within the layout', () => {
    render(<PredictorPage />);
    
    expect(screen.getByText('AI Reach Predictor')).toBeInTheDocument();
    expect(screen.getByText('Instagram')).toBeInTheDocument();
  });
});