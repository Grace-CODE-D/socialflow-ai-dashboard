# Audience Wealth Analytics - Feature Documentation

## Overview
The Audience Wealth Analytics feature provides comprehensive tracking and analysis of audience portfolio values, wealth distribution, and token accumulation patterns. This feature enables deep insights into wallet behavior, wealth migration trends, and predictive modeling for audience financial activity.

## Features Implemented

### 805.7 - Audience Wealth Trends
✅ Track portfolio value changes over time
✅ Show wealth distribution evolution
✅ Display token accumulation patterns
✅ Identify wealth migration trends
✅ Create predictive wealth models

### 805.8 - Component Tests
✅ Test wealth heatmaps
✅ Test wallet analysis
✅ Test segmentation engine
✅ Test whale identification
✅ Test trend calculations

## Component Structure

### WealthAnalytics
Main component that orchestrates all wealth analytics features.

**Key Features:**
- Real-time portfolio value tracking
- Multi-timeframe analysis (1M, 3M, 6M, 1Y)
- Interactive wealth distribution visualization
- Wallet categorization (Whale, Dolphin, Fish, Shrimp)
- Wealth concentration heatmaps
- Token accumulation scatter plots
- Migration trend analysis
- AI-powered predictive insights

## Data Types

### WalletData
```typescript
interface WalletData {
  address: string;              // Wallet address
  balance: number;              // Current balance in USD
  tokens: TokenHolding[];       // Token holdings
  firstSeen: Date;              // First activity date
  lastActive: Date;             // Last activity date
  transactionCount: number;     // Total transactions
  category: 'whale' | 'dolphin' | 'fish' | 'shrimp';
}
```

### WealthTrend
```typescript
interface WealthTrend {
  period: string;               // Time period label
  totalValue: number;           // Total portfolio value
  change: number;               // Absolute change
  changePercent: number;        // Percentage change
  newWallets: number;           // New wallets in period
  activeWallets: number;        // Active wallets in period
}
```

### WealthSegment
```typescript
interface WealthSegment {
  category: string;             // Segment name
  count: number;                // Number of wallets
  totalValue: number;           // Total value in segment
  averageValue: number;         // Average per wallet
  percentage: number;           // % of total value
}
```

## Wallet Categories

### Whales (>$100k)
- High-value holders
- Significant market influence
- Tracked for major movements
- Color: Blue (#3b82f6)

### Dolphins ($10k-$100k)
- Mid-tier holders
- Active participants
- Growth potential
- Color: Teal (#14b8a6)

### Fish ($1k-$10k)
- Regular holders
- Community base
- Accumulation phase
- Color: Purple (#a855f7)

### Shrimp (<$1k)
- Small holders
- Entry-level participants
- High volume, low value
- Color: Orange (#fb923c)

## Visualizations

### 1. Portfolio Value Over Time
- Area chart showing total value trends
- Gradient fill for visual appeal
- Responsive to time range selection
- Formatted currency values

### 2. Wealth Distribution
- Interactive segment cards
- Click to select/deselect
- Progress bars showing percentage
- Average value per wallet

### 3. Wealth Concentration Heatmap
- 8-week x 7-day grid
- Color intensity based on activity
- Hover for detailed percentages
- Identifies peak activity periods

### 4. Top Wallet Analysis
- Ranked list of top 15 wallets
- Category badges
- Transaction counts
- Last activity tracking
- Scrollable list with custom styling

### 5. Token Accumulation Patterns
- Scatter plot: transactions vs balance
- Color-coded by wallet category
- Identifies accumulation behavior
- Reveals correlation patterns

### 6. Wealth Migration Trends
- Inflow/outflow tracking
- New vs active wallet trends
- Line chart visualization
- 30-day rolling metrics

### 7. AI Predictive Insights
- Growth predictions
- Whale activity alerts
- Concentration risk warnings
- Pattern-based forecasting

## Key Metrics Dashboard

### Total Portfolio Value
- Current total value across all wallets
- Period-over-period change
- Percentage growth indicator
- Gradient card with wallet icon

### Active Wallets
- Currently active wallet count
- New wallets in period
- Activity trend indicator
- Gradient card with group icon

### Average Wallet Value
- Mean value per active wallet
- Calculated dynamically
- Useful for segment analysis
- Gradient card with trending icon

### Whale Holders
- Count of whale-category wallets
- Percentage of total value
- Risk concentration metric
- Gradient card with drop icon

## Time Range Selection

Users can toggle between:
- 1M (1 Month)
- 3M (3 Months)
- 6M (6 Months) - Default
- 1Y (1 Year)

Data automatically regenerates based on selected timeframe.

## Interactive Features

### Segment Selection
- Click any wealth segment to highlight
- Visual feedback with ring border
- Deselect by clicking again
- Useful for focused analysis

### Heatmap Hover
- Hover over any cell for details
- Shows exact activity percentage
- Smooth opacity transitions
- Identifies optimal posting times

### Wallet Details
- Hover over wallet cards
- Background color change
- Quick access to key metrics
- Category and activity info

## Styling & Design

### Color Palette
- Primary Blue: #3b82f6 (Whales, main actions)
- Teal: #14b8a6 (Dolphins, secondary)
- Purple: #a855f7 (Fish, tertiary)
- Orange: #fb923c (Shrimp, accents)
- Green: Success/growth indicators
- Red: Decline/outflow indicators

### Card Design
- Dark surface background
- Gradient overlays for metrics
- Border colors matching categories
- Rounded corners (xl = 20px)
- Backdrop blur effects

### Typography
- Headers: 2xl, bold, white
- Subheaders: lg, semibold, white
- Body: sm, medium, gray-subtext
- Metrics: 3xl, bold, white
- Labels: xs, gray-subtext

## Testing

### Test Coverage
- Component rendering
- Metric display
- Time range selection
- Segment interaction
- Chart rendering
- Data formatting
- Predictive insights

### Test File
Location: `components/__tests__/WealthAnalytics.test.tsx`

Run tests:
```bash
npm test WealthAnalytics
```

## Integration

### App.tsx Integration
```typescript
import { WealthAnalytics } from './components/WealthAnalytics';

// In renderView():
case View.WEALTH_ANALYTICS: 
  return <WealthAnalytics {...props} />;
```

### Sidebar Navigation
```typescript
{ 
  id: View.WEALTH_ANALYTICS, 
  label: 'Wealth Analytics', 
  icon: <MaterialIcon name="account_balance_wallet" /> 
}
```

## Data Generation

Currently uses mock data generators:
- `generateWealthTrends()` - Creates time-series data
- `generateWealthSegments()` - Creates distribution data
- `generateWalletData()` - Creates wallet records

### Future: Real Data Integration
Replace mock generators with API calls:
```typescript
const fetchWealthData = async () => {
  const response = await fetch('/api/wealth-analytics');
  return response.json();
};
```

## Performance Considerations

### Optimizations
- `useMemo` for expensive calculations
- Lazy data generation
- Virtualized scrolling for large lists
- Debounced interactions
- Responsive chart sizing

### Best Practices
- Limit wallet list to top 15
- Cache segment calculations
- Throttle heatmap renders
- Optimize chart re-renders

## Future Enhancements

### Planned Features
- Real-time data streaming
- Export to CSV/PDF
- Custom date range picker
- Wallet comparison tool
- Alert configuration
- Historical snapshots
- Advanced filtering
- Cohort analysis
- Retention metrics
- Churn prediction

### API Integration
- Connect to blockchain APIs
- Real wallet tracking
- Live transaction monitoring
- Token price feeds
- Historical data import

## Dependencies

- React 18.2+
- Recharts 2.10+ (charts)
- Lucide React (icons)
- Tailwind CSS (styling)
- TypeScript 5.3+

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Color contrast compliance
- Screen reader friendly
- Focus indicators

## License

Part of SocialFlow Dashboard Desktop App
