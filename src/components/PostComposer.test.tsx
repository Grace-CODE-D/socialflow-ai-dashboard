import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostComposer } from './PostComposer';

const addPostMock = jest.fn();
const toastMock = jest.fn();
const userMock = { followerCount: 1234 };

jest.mock('../contexts/PostsContext', () => ({
  usePosts: () => ({ addPost: addPostMock }),
}));

jest.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: userMock }),
}));

afterEach(() => {
  jest.clearAllMocks();
});

test('Escape key triggers onClose', () => {
  const onClose = jest.fn();
  render(<PostComposer open={true} onClose={onClose} />);

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalled();
});

test('Tab on last focusable wraps to first (focus-trap)', async () => {
  const onClose = jest.fn();
  const { container } = render(<PostComposer open={true} onClose={onClose} />);

  const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
  expect(dialog).toBeTruthy();

  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled'));

  expect(focusable.length).toBeGreaterThan(1);

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  // focus last then press Tab -> should wrap to first
  last.focus();
  fireEvent.keyDown(document, { key: 'Tab' });

  await waitFor(() => expect(document.activeElement).toBe(first));
});

test('scheduling with short caption shows error and does not call addPost', () => {
  const onClose = jest.fn();
  render(<PostComposer open={true} onClose={onClose} />);

  const scheduleBtn = screen.getByText(/Schedule Post/i);
  fireEvent.click(scheduleBtn);

  expect(toastMock).toHaveBeenCalledWith(
    expect.stringContaining('Add some caption content'),
    'error',
  );
  expect(addPostMock).not.toHaveBeenCalled();
});

test('scheduling with valid caption calls addPost with expected payload', () => {
  const onClose = jest.fn();
  render(<PostComposer open={true} onClose={onClose} />);

  const textarea = screen.getByPlaceholderText(/Write your caption/i) as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: 'Hello world from test' } });

  const scheduleBtn = screen.getByText(/Schedule Post/i);
  fireEvent.click(scheduleBtn);

  expect(addPostMock).toHaveBeenCalled();
  const calledArg = addPostMock.mock.calls[0][0];
  expect(calledArg).toMatchObject({
    content: 'Hello world from test',
    platform: expect.any(String),
    mediaType: expect.any(String),
  });
  expect(toastMock).toHaveBeenCalledWith(
    expect.stringMatching(/scheduled successfully|Draft saved/),
    'success',
  );
});
