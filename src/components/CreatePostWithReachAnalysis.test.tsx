import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreatePostWithReachAnalysis } from './CreatePostWithReachAnalysis';
import { PostsProvider, usePosts } from '../contexts/PostsContext';

let lastSubmittedPost: any = null;
const TestConsumer = () => {
  const { posts } = usePosts();
  lastSubmittedPost = posts[0] || null;
  return null;
};

const renderComponent = (onNavigate = jest.fn()) => {
  return render(
    <PostsProvider>
      <CreatePostWithReachAnalysis onNavigate={onNavigate} />
      <TestConsumer />
    </PostsProvider>,
  );
};

describe('CreatePostWithReachAnalysis', () => {
  beforeEach(() => {
    lastSubmittedPost = null;
    localStorage.clear();
  });

  test('covers platform and media selection state changes', () => {
    renderComponent();

    const instagramBtn = screen.getByRole('button', { name: /Instagram/i });
    expect(instagramBtn).toHaveClass('bg-primary-blue');

    const linkedinBtn = screen.getByRole('button', { name: /Linkedin/i });
    fireEvent.click(linkedinBtn);
    expect(linkedinBtn).toHaveClass('bg-primary-blue');

    fireEvent.click(instagramBtn);
    expect(instagramBtn).not.toHaveClass('bg-primary-blue');

    const videoBtn = screen.getByRole('button', { name: /video/i });
    fireEvent.click(videoBtn);
    expect(videoBtn).toHaveClass('bg-primary-blue');

    expect(screen.getByText(/Upload Media/i)).toBeInTheDocument();
  });

  test('detects hashtags from caption input', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText(/Write your caption here/i);
    fireEvent.change(textarea, {
      target: { value: 'Exciting news #tech #innovation for everyone!' },
    });

    expect(screen.getByText(/2 hashtags/i)).toBeInTheDocument();
  });

  test('asserts submission calls into PostsContext', () => {
    renderComponent();

    const textarea = screen.getByPlaceholderText(/Write your caption here/i);
    fireEvent.change(textarea, {
      target: { value: 'Launching a new feature #launch' },
    });

    const scheduleBtn = screen.getByRole('button', { name: /Schedule Post/i });
    fireEvent.click(scheduleBtn);

    expect(lastSubmittedPost).not.toBeNull();
    expect(lastSubmittedPost.content).toBe('Launching a new feature #launch');
    expect(lastSubmittedPost.hashtags).toEqual(['#launch']);
  });
});
