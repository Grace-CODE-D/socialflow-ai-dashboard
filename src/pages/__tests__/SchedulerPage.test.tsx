import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SchedulerPage } from '../SchedulerPage';
import { usePosts } from '../../contexts/PostsContext';
import { useComposer } from '../../contexts/ComposerContext';
import { useToast } from '../../contexts/ToastContext';

// Mock contexts
vi.mock('../../contexts/PostsContext', () => ({
  usePosts: vi.fn(),
}));

vi.mock('../../contexts/ComposerContext', () => ({
  useComposer: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

// Mock TranslationWidget since it's a child component
vi.mock('../../components/TranslationWidget', () => ({
  TranslationWidget: vi.fn(() => <div data-testid="translation-widget">Mock TranslationWidget</div>)
}));

const mockUsePosts = usePosts as any;
const mockUseComposer = useComposer as any;
const mockUseToast = useToast as any;

describe('SchedulerPage', () => {
  const mockToast = vi.fn();
  const mockOpenComposer = vi.fn();
  const mockRemovePost = vi.fn();
  const mockUpdateStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue({ toast: mockToast });
    mockUseComposer.mockReturnValue({ openComposer: mockOpenComposer });
  });

  it('renders empty state when no posts', () => {
    mockUsePosts.mockReturnValue({
      posts: [],
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    expect(screen.getByText('0 posts in your queue')).toBeInTheDocument();
    expect(screen.getByText('Your queue is empty')).toBeInTheDocument();
    expect(screen.getByText('Create a Post')).toBeInTheDocument();
  });

  it('renders posts when posts exist', () => {
    const mockPosts = [
      {
        id: 'post-1',
        content: 'Test post content 1',
        platform: 'instagram',
        scheduledAt: Date.now() + 3600000, // 1 hour from now
        reachScore: 85,
        status: 'scheduled' as const,
      },
      {
        id: 'post-2',
        content: 'Test post content 2',
        platform: 'tiktok',
        scheduledAt: Date.now() + 7200000, // 2 hours from now
        reachScore: 72,
        status: 'draft' as const,
      },
    ];

    mockUsePosts.mockReturnValue({
      posts: mockPosts,
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    expect(screen.getByText('Content Calendar')).toBeInTheDocument();
    expect(screen.getByText('2 posts in your queue')).toBeInTheDocument();
    expect(screen.getByText('Test post content 1')).toBeInTheDocument();
    expect(screen.getByText('Test post content 2')).toBeInTheDocument();
    expect(screen.getByText('instagram')).toBeInTheDocument();
    expect(screen.getByText('tiktok')).toBeInTheDocument();
  });

  it('calls openComposer when "New Post" button is clicked', () => {
    mockUsePosts.mockReturnValue({
      posts: [],
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    const newPostButton = screen.getByText('New Post');
    fireEvent.click(newPostButton);
    
    expect(mockOpenComposer).toHaveBeenCalledTimes(1);
  });

  it('calls openComposer when "Create a Post" button is clicked in empty state', () => {
    mockUsePosts.mockReturnValue({
      posts: [],
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    const createPostButton = screen.getByText('Create a Post');
    fireEvent.click(createPostButton);
    
    expect(mockOpenComposer).toHaveBeenCalledTimes(1);
  });

  it('removes post when delete button is clicked', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        content: 'Test post content',
        platform: 'instagram',
        scheduledAt: Date.now() + 3600000,
        reachScore: 85,
        status: 'scheduled' as const,
      },
    ];

    mockUsePosts.mockReturnValue({
      posts: mockPosts,
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    // Hover over the post to show the delete button
    const postElement = screen.getByText('Test post content').closest('.group');
    if (postElement) {
      fireEvent.mouseEnter(postElement);
      
      // Wait for delete button to appear (it's opacity-0 group-hover:opacity-100)
      await waitFor(() => {
        const deleteButton = screen.getByTitle('Delete');
        expect(deleteButton).toBeInTheDocument();
        
        fireEvent.click(deleteButton);
        expect(mockRemovePost).toHaveBeenCalledWith('post-1');
        expect(mockToast).toHaveBeenCalledWith('Post removed from queue.', 'info');
      });
    }
  });

  it('updates post status to published when publish button is clicked', async () => {
    const mockPosts = [
      {
        id: 'post-1',
        content: 'Test post content',
        platform: 'instagram',
        scheduledAt: Date.now() + 3600000,
        reachScore: 85,
        status: 'scheduled' as const,
      },
    ];

    mockUsePosts.mockReturnValue({
      posts: mockPosts,
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    // Hover over the post to show the publish button
    const postElement = screen.getByText('Test post content').closest('.group');
    if (postElement) {
      fireEvent.mouseEnter(postElement);
      
      // Wait for publish button to appear
      await waitFor(() => {
        const publishButton = screen.getByTitle('Publish now');
        expect(publishButton).toBeInTheDocument();
        
        fireEvent.click(publishButton);
        expect(mockUpdateStatus).toHaveBeenCalledWith('post-1', 'published');
        expect(mockToast).toHaveBeenCalledWith('Post published.', 'success');
      });
    }
  });

  it('renders translation panel with input', () => {
    mockUsePosts.mockReturnValue({
      posts: [],
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    expect(screen.getByText('Translate Caption')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste a caption to translate…')).toBeInTheDocument();
  });

  it('updates translation text when input changes', () => {
    mockUsePosts.mockReturnValue({
      posts: [],
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    const translationInput = screen.getByPlaceholderText('Paste a caption to translate…');
    const testText = 'This is a test caption to translate';
    
    fireEvent.change(translationInput, { target: { value: testText } });
    
    expect(translationInput).toHaveValue(testText);
  });

  it('renders TranslationWidget when translation text exists', () => {
    mockUsePosts.mockReturnValue({
      posts: [],
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    const translationInput = screen.getByPlaceholderText('Paste a caption to translate…');
    fireEvent.change(translationInput, { target: { value: 'Test text' } });
    
    expect(screen.getByTestId('translation-widget')).toBeInTheDocument();
  });

  it('shows correct status badges for posts', () => {
    const mockPosts = [
      {
        id: 'post-1',
        content: 'Scheduled post',
        platform: 'instagram',
        scheduledAt: Date.now() + 3600000,
        reachScore: 85,
        status: 'scheduled' as const,
      },
      {
        id: 'post-2',
        content: 'Published post',
        platform: 'tiktok',
        scheduledAt: Date.now() - 3600000, // 1 hour ago
        reachScore: 72,
        status: 'published' as const,
      },
      {
        id: 'post-3',
        content: 'Draft post',
        platform: 'x',
        scheduledAt: Date.now() + 7200000,
        reachScore: 60,
        status: 'draft' as const,
      },
    ];

    mockUsePosts.mockReturnValue({
      posts: mockPosts,
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    expect(screen.getByText('scheduled')).toBeInTheDocument();
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('sorts posts by scheduled time', () => {
    const now = Date.now();
    const mockPosts = [
      {
        id: 'post-3',
        content: 'Later post',
        platform: 'instagram',
        scheduledAt: now + 7200000, // 2 hours from now
        reachScore: 85,
        status: 'scheduled' as const,
      },
      {
        id: 'post-1',
        content: 'Earlier post',
        platform: 'tiktok',
        scheduledAt: now + 3600000, // 1 hour from now
        reachScore: 72,
        status: 'scheduled' as const,
      },
    ];

    mockUsePosts.mockReturnValue({
      posts: mockPosts,
      removePost: mockRemovePost,
      updateStatus: mockUpdateStatus,
    });

    render(<SchedulerPage />);
    
    const postTitles = screen.getAllByText(/Earlier post|Later post/);
    expect(postTitles[0]).toHaveTextContent('Earlier post');
    expect(postTitles[1]).toHaveTextContent('Later post');
  });
});