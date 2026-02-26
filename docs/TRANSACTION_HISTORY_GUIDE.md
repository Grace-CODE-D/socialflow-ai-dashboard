# Transaction History Quick Start Guide

## 🚀 Getting Started

### Accessing Transaction History
1. Click **"Transactions"** in the left sidebar (receipt icon)
2. The Transaction History page will load

### Understanding the Interface

#### Category Statistics (Top Section)
- **5 colored cards** showing transaction distribution
- Each card displays:
  - Category icon and name
  - Total count
  - Percentage of all transactions
- Colors:
  - 💰 Payment (Green)
  - 🪙 Token (Blue)
  - 🖼️ NFT (Purple)
  - ⚙️ Contract (Orange)
  - 📋 Other (Gray)

#### Filters (Middle Section)
- **Category Dropdown**: Filter by specific category or view all
- **Start Date**: Filter transactions from this date onwards
- **End Date**: Filter transactions up to this date
- **Export Buttons**: Export filtered results to CSV or PDF

#### Transaction List (Bottom Section)
- Shows all transactions matching current filters
- Each transaction displays:
  - Color-coded category indicator
  - Transaction type
  - Timestamp
  - Amount and asset (if applicable)
  - From/To addresses (if applicable)
  - Manual category override dropdown

## 📊 Using Categorization

### Auto-Categorization
Transactions are automatically categorized when they arrive:
- Payments → 💰 Payment
- Token transfers → 🪙 Token
- NFT transfers → 🖼️ NFT
- Contract executions → ⚙️ Contract
- Everything else → 📋 Other

### Manual Override
To change a transaction's category:
1. Find the transaction in the list
2. Click the category dropdown at the bottom of the transaction card
3. Select the new category
4. The change applies immediately

### Filtering by Category
1. Click the **Category** dropdown in the filters section
2. Select a specific category or "All Categories"
3. The list updates instantly

## 📤 Exporting Transactions

### CSV Export
1. Apply desired filters (category, date range)
2. Click the **📊 CSV** button
3. File downloads automatically
4. Filename format: `transactions_YYYY-MM-DD_to_YYYY-MM-DD.csv`

**CSV includes:**
- Transaction ID
- Category
- Type
- Timestamp
- Account
- Amount
- Asset
- From address
- To address

### PDF Export
1. Apply desired filters (category, date range)
2. Click the **📄 PDF** button
3. Browser print dialog opens
4. Choose "Save as PDF" or print directly
5. Filename format: `transactions_YYYY-MM-DD_to_YYYY-MM-DD.pdf`

**PDF includes:**
- Generation timestamp
- Date range (if filtered)
- Total transaction count
- Table with key transaction details

## 🔍 Filtering by Date Range

### Single Date
- Set only **Start Date**: Shows transactions from that date onwards
- Set only **End Date**: Shows transactions up to that date

### Date Range
- Set both **Start Date** and **End Date**: Shows transactions within range
- Inclusive of both dates

### Clearing Filters
- Clear the date inputs to remove date filtering
- Select "All Categories" to remove category filtering

## 💡 Tips & Tricks

### Viewing Statistics
- Statistics update in real-time as transactions arrive
- Percentages recalculate automatically
- Click a category in the filter to see only those transactions

### Export Best Practices
- Filter before exporting to get only relevant data
- Use date ranges for monthly/quarterly reports
- CSV is best for spreadsheet analysis
- PDF is best for sharing/printing

### Performance
- Component handles 100+ transactions smoothly
- Filters apply instantly (client-side)
- Exports process in under 1 second

### Real-time Updates
- New transactions appear automatically at the top
- Auto-categorized on arrival
- Statistics update immediately
- No refresh needed

## 🐛 Troubleshooting

### No Transactions Showing
- Ensure blockchain monitoring is active
- Check that you're monitoring an account with activity
- Verify filters aren't too restrictive

### Export Not Working
- Ensure you have transactions to export
- Check browser allows downloads
- Try clearing filters if export is empty

### Category Not Updating
- Manual overrides persist until page refresh
- Auto-categorization only runs on new transactions
- Refresh page to reset all categories

## 📋 Keyboard Shortcuts
- None currently implemented (future enhancement)

## 🔗 Related Features
- **Blockchain Monitor**: Start/stop monitoring accounts
- **Notification Settings**: Configure alerts for transactions
- **Notification History**: View past notifications

## 📞 Support
For issues or feature requests, please create a GitHub issue.
