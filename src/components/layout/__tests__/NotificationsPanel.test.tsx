import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { NotificationsPanel } from '../NotificationsPanel';

// Mock the global document event listeners
const mockAddEventListener = vi.spyOn(document, 'addEventListener');
const mockRemoveEventListener = vi.spyOn(document, 'removeEventListener');

describe('NotificationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });



  it('renders notifications button with unread count', () => {
    render(<NotificationsPanel />);
    
    // Check button is rendered
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    
    // Check unread count badge is shown (based on initial data, there should be 2 unread)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('opens panel when button is clicked', () => {
    render(<NotificationsPanel />);
    
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Panel should open
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Mark all read')).toBeInTheDocument();
  });

  it('closes panel when clicking outside', async () => {
    render(<NotificationsPanel />);
    
    // Open panel
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Verify panel is open
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Simulate outside click
    fireEvent.mouseDown(document);
    
    // Panel should close
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('closes panel when Escape key is pressed', async () => {
    render(<NotificationsPanel />);
    
    // Open panel
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Verify panel is open
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    
    // Simulate Escape key press
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // Panel should close
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('marks individual notification as read when clicked', () => {
    render(<NotificationsPanel />);
    
    // Open panel
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Find first notification button (the one with unread indicator)
    const notificationButtons = screen.getAllByRole('button', { name: /Your Instagram post hit|TikTok post scheduled|Reach model retrained|You gained/i });
    
    // Click first notification
    fireEvent.click(notificationButtons[0]);
    
    // The unread count should decrease (from 2 to 1)
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('marks all notifications as read when "Mark all read" is clicked', () => {
    render(<NotificationsPanel />);
    
    // Open panel
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Click "Mark all read" button
    const markAllReadButton = screen.getByText('Mark all read');
    fireEvent.click(markAllReadButton);
    
    // All notifications should be marked as read
    // The unread count badge should disappear
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    
    // "Mark all read" button should disappear when there are no unread notifications
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();
  });

  it('shows correct notification content', () => {
    render(<NotificationsPanel />);
    
    // Open panel
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Check notification content
    expect(screen.getByText(/Your Instagram post hit 12k reach — 18% above forecast./i)).toBeInTheDocument();
    expect(screen.getByText(/TikTok post scheduled for 4:00 PM is ready./i)).toBeInTheDocument();
    expect(screen.getByText(/Reach model retrained — accuracy improved to 94%./i)).toBeInTheDocument();
    expect(screen.getByText(/You gained 420 new followers this week./i)).toBeInTheDocument();
  });

  it('adds and removes event listeners correctly', () => {
    const { unmount } = render(<NotificationsPanel />);
    
    // Open panel to trigger event listener setup
    const button = screen.getByLabelText('Notifications');
    fireEvent.click(button);
    
    // Should have added event listeners
    expect(mockAddEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    // Unmount component
    unmount();
    
    // Should have removed event listeners
    expect(mockRemoveEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});