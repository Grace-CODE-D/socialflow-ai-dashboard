import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostsProvider, usePosts, ScheduledPost } from './PostsContext';

type PostsCtx = ReturnType<typeof usePosts>;

const STORAGE_KEY = 'sf_scheduled_posts';

let setItemSpy: jest.SpyInstance;

beforeEach(() => {
  window.localStorage.clear();
  setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  setItemSpy.mockRestore();
});

const Consumer: React.FC<{ onReady: (ctx: PostsCtx) => void }> = ({ onReady }) => {
  const ctx = usePosts();
  onReady(ctx);
  return <div data-testid="count">{ctx.posts.length}</div>;
};

const renderPosts = () => {
  let ctx!: PostsCtx;
  render(
    <PostsProvider>
      <Consumer
        onReady={(c) => {
          ctx = c;
        }}
      />
    </PostsProvider>,
  );
  return () => ctx;
};

describe('PostsContext', () => {
  test('seeds initial posts when localStorage is empty', () => {
    renderPosts();
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });

  test('falls back to seed() when localStorage contains corrupt JSON, without throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-valid-json');
    expect(renderPosts).not.toThrow();
    expect(screen.getByTestId('count')).toHaveTextContent('3');
  });

  test('addPost prepends a new post with a generated id and default status', () => {
    const getCtx = renderPosts();

    act(() => {
      getCtx().addPost({
        content: 'hello world',
        platform: 'x',
        hashtags: [],
        mediaType: 'text',
        scheduledAt: Date.now(),
        reachScore: 50,
      });
    });

    const [first] = getCtx().posts;
    expect(getCtx().posts).toHaveLength(4);
    expect(first.content).toBe('hello world');
    expect(first.id).toMatch(/^post-/);
    expect(first.status).toBe('scheduled');
  });

  test('removePost removes the post with the matching id', () => {
    const getCtx = renderPosts();

    act(() => {
      getCtx().removePost('seed-1');
    });

    expect(getCtx().posts.find((p: ScheduledPost) => p.id === 'seed-1')).toBeUndefined();
    expect(getCtx().posts).toHaveLength(2);
  });

  test('updateStatus updates the status of the matching post only', () => {
    const getCtx = renderPosts();

    act(() => {
      getCtx().updateStatus('seed-1', 'published');
    });

    expect(getCtx().posts.find((p: ScheduledPost) => p.id === 'seed-1')?.status).toBe('published');
    expect(getCtx().posts.find((p: ScheduledPost) => p.id === 'seed-2')?.status).toBe('scheduled');
  });

  test('persists to localStorage on every state change', () => {
    const getCtx = renderPosts();
    setItemSpy.mockClear();

    act(() => {
      getCtx().removePost('seed-1');
    });
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));

    setItemSpy.mockClear();

    act(() => {
      getCtx().updateStatus('seed-2', 'published');
    });
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });
});
