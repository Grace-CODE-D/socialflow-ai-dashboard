import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ComposerProvider, useComposer } from './ComposerContext';

jest.mock('../components/PostComposer', () => ({
  PostComposer: ({ open }: { open: boolean }) => (
    <div data-testid="post-composer">{open ? 'open' : 'closed'}</div>
  ),
}));

const Consumer: React.FC = () => {
  const { openComposer, closeComposer } = useComposer();
  return (
    <div>
      <button onClick={openComposer}>open</button>
      <button onClick={closeComposer}>close</button>
    </div>
  );
};

describe('ComposerContext', () => {
  test('toggles the composer open/closed via openComposer/closeComposer', () => {
    render(
      <ComposerProvider>
        <Consumer />
      </ComposerProvider>,
    );

    expect(screen.getByTestId('post-composer')).toHaveTextContent('closed');

    act(() => {
      screen.getByText('open').click();
    });
    expect(screen.getByTestId('post-composer')).toHaveTextContent('open');

    act(() => {
      screen.getByText('close').click();
    });
    expect(screen.getByTestId('post-composer')).toHaveTextContent('closed');
  });

  test('useComposer throws when used outside a ComposerProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const BadConsumer: React.FC = () => {
      useComposer();
      return null;
    };

    expect(() => render(<BadConsumer />)).toThrow(
      'useComposer must be used within a ComposerProvider',
    );

    spy.mockRestore();
  });
});
