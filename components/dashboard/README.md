# Staging Dock - Transaction Queue Management

## Overview
The Staging Dock is a horizontal dock component positioned at the bottom of the screen that manages pending transactions and posts. It provides a visual queue for all scheduled actions with drag-to-reorder functionality.

## Features Implemented

### 803.1 - Staging Dock Component
- ✅ Horizontal dock at bottom of screen
- ✅ Collapsible/expandable behavior (toggle with arrow button)
- ✅ Drag-to-reorder functionality for transactions
- ✅ Pending transaction count badge
- ✅ Fixed positioning with backdrop blur effect
- ✅ Responsive design with smooth animations

### 803.2 - Signature Bundling Tray
- ✅ Display all pending posts and transactions
- ✅ Group related transactions together (using `relatedTransactions` field)
- ✅ Transaction type icons (post, schedule, update, delete, reply)
- ✅ Individual transaction details on hover (tooltip)
- ✅ Transaction removal functionality
- ✅ Platform-specific icons (Instagram, YouTube, Facebook, LinkedIn, TikTok, X)

## Component Structure

### StagingDock
Main container component that manages the dock state and transaction list.

**Props:**
- `transactions: Transaction[]` - Array of pending transactions
- `onRemoveTransaction: (id: string) => void` - Callback to remove a transaction
- `onReorderTransactions: (transactions: Transaction[]) => void` - Callback when transactions are reordered

**State:**
- `isExpanded: boolean` - Controls dock expansion
- `draggedIndex: number | null` - Tracks currently dragged item
- `hoveredIndex: number | null` - Tracks hover state during drag

### TransactionCard
Individual transaction card with drag-and-drop support.

**Features:**
- Draggable with visual feedback
- Hover tooltip with full transaction details
- Remove button
- Color-coded by transaction type
- Platform icon display
- Scheduled time display (if applicable)

## Transaction Types

```typescript
enum TransactionType {
  POST = 'post',           // New post creation
  SCHEDULE = 'schedule',   // Scheduled post
  UPDATE = 'update',       // Update existing content
  DELETE = 'delete',       // Delete content
  REPLY = 'reply'         // Reply to message/comment
}
```

## Transaction Grouping

Transactions with matching `relatedTransactions` arrays are automatically grouped together in a bordered container. This visually indicates that multiple actions are related.

## Styling

The component uses the project's design system:
- Dark theme with glass morphism effect
- Primary blue (#3b82f6) and teal (#14b8a6) accent colors
- Smooth transitions and animations
- Backdrop blur for modern appearance

## Usage Example

```tsx
import { StagingDock } from './components/dashboard/StagingDock';

const [transactions, setTransactions] = useState<Transaction[]>([...]);

<StagingDock
  transactions={transactions}
  onRemoveTransaction={(id) => setTransactions(prev => prev.filter(t => t.id !== id))}
  onReorderTransactions={setTransactions}
/>
```

## Integration

The Staging Dock is integrated into `App.tsx` and appears at the bottom of all views. The main content area has `pb-20` padding to prevent content from being hidden behind the dock.

## Future Enhancements

- Execute All functionality (currently disabled)
- Batch operations
- Transaction status indicators
- Undo/redo support
- Keyboard shortcuts for dock control
- Transaction preview before execution
