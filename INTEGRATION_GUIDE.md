# Integration Guide: Engagement Rewards UI

## Quick Start

### 1. Import Components

```typescript
import {
  RewardsConfig,
  RewardClaimModal,
  RewardsService,
  RewardConfig,
  UserReward,
} from './components/blockchain';
```

### 2. Initialize Service

```typescript
const rewardsService = new RewardsService(
  process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
);
```

### 3. Use Configuration Component

```typescript
function CampaignSetup() {
  const handleSave = async (config: RewardConfig) => {
    try {
      const contractId = await rewardsService.deployRewardCampaign(config);
      console.log('Campaign deployed:', contractId);
      // Update UI, show success message
    } catch (error) {
      console.error('Failed to deploy campaign:', error);
      // Show error message
    }
  };

  return <RewardsConfig onSave={handleSave} />;
}
```

### 4. Use Claim Modal

```typescript
function RewardsClaiming() {
  const [showModal, setShowModal] = useState(false);
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const userRewards = await rewardsService.getUserRewards(userAddress);
      setRewards(userRewards);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (rewardId: string) => {
    const txHash = await rewardsService.claimReward(rewardId, userAddress);
    await loadRewards(); // Refresh rewards list
    return txHash;
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        View Rewards ({rewards.filter(r => !r.claimed).length})
      </button>

      <RewardClaimModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        rewards={rewards}
        onClaim={handleClaim}
      />
    </>
  );
}
```

## Advanced Usage

### Real-Time State Monitoring

```typescript
useEffect(() => {
  if (!contractId) return;

  const unsubscribe = rewardsService.onCampaignStateChange(
    contractId,
    (newState) => {
      console.log('Campaign state updated:', newState);
      // Update UI with new state
      setCampaignState(newState);
    }
  );

  return () => unsubscribe();
}, [contractId]);
```

### Eligibility Checking

```typescript
const checkUserEligibility = async () => {
  const { eligible, reason } = await rewardsService.checkEligibility(
    userAddress,
    {
      minFollowers: 100,
      minEngagementRate: 2,
      accountAge: 30,
      verifiedOnly: false,
    }
  );

  if (!eligible) {
    console.log('User not eligible:', reason);
  }
};
```

### Fee Estimation

```typescript
const estimateFee = async (rewardId: string) => {
  const fee = await rewardsService.estimateRewardClaim(rewardId);
  console.log('Estimated fee:', fee, 'stroops');
  return fee;
};
```

### Campaign Management

```typescript
// Pause campaign
await rewardsService.pauseCampaign(contractId);

// Resume campaign
await rewardsService.resumeCampaign(contractId);

// Add more budget
await rewardsService.addBudget(contractId, '5000');
```

## Integration with Existing App

### Add to Navigation

```typescript
// In your Sidebar or Navigation component
import { FiGift } from 'react-icons/fi';

const navItems = [
  // ... existing items
  {
    id: 'REWARDS',
    label: 'Rewards',
    icon: <FiGift />,
  },
];
```

### Add to View Enum

```typescript
// In types.ts
export enum View {
  // ... existing views
  REWARDS = 'REWARDS',
}
```

### Add Route Handler

```typescript
// In App.tsx or main component
const renderView = () => {
  switch (currentView) {
    // ... existing cases
    case View.REWARDS:
      return <RewardsDemo />;
    default:
      return <Dashboard />;
  }
};
```

## Environment Variables

Add to your `.env` file:

```bash
# Soroban RPC URL
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract IDs (after deployment)
REWARD_FACTORY_CONTRACT_ID=CAAAA...
REWARD_REGISTRY_CONTRACT_ID=CBBBB...
```

## Error Handling

```typescript
try {
  await rewardsService.claimReward(rewardId, userAddress);
} catch (error: any) {
  if (error.message.includes('out of gas')) {
    // Handle insufficient gas
    showError('Transaction failed: Insufficient gas');
  } else if (error.message.includes('not eligible')) {
    // Handle eligibility error
    showError('You are not eligible for this reward');
  } else {
    // Handle generic error
    showError('Failed to claim reward. Please try again.');
  }
}
```

## Styling Customization

The components use Tailwind CSS. To customize:

```typescript
// Override default styles
<RewardsConfig
  onSave={handleSave}
  className="custom-rewards-config"
/>

// In your CSS
.custom-rewards-config {
  /* Your custom styles */
}
```

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { RewardClaimModal } from './components/blockchain';

describe('RewardClaimModal', () => {
  it('should display rewards', () => {
    const mockRewards = [
      {
        id: 'reward_1',
        campaignName: 'Test Campaign',
        amount: '100',
        asset: { code: 'XLM', issuer: '' },
        earnedDate: Date.now(),
        claimed: false,
        eligibilityMet: true,
      },
    ];

    render(
      <RewardClaimModal
        isOpen={true}
        onClose={() => {}}
        rewards={mockRewards}
        onClaim={async () => '0x123'}
      />
    );

    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('100 XLM')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Memoization

```typescript
import { useMemo } from 'react';

const availableRewards = useMemo(
  () => rewards.filter(r => !r.claimed && r.eligibilityMet),
  [rewards]
);
```

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const RewardClaimModal = lazy(() =>
  import('./components/blockchain/RewardClaimModal')
);

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <RewardClaimModal {...props} />
</Suspense>
```

## Troubleshooting

### Modal Not Showing
- Check `isOpen` prop is true
- Verify z-index is high enough
- Check for CSS conflicts

### Rewards Not Loading
- Verify RPC URL is correct
- Check wallet connection
- Verify contract IDs are set
- Check network (testnet vs mainnet)

### Claim Failing
- Check user eligibility
- Verify sufficient balance for fees
- Check campaign is active
- Verify reward hasn't been claimed

## Support

For issues or questions:
1. Check the README files
2. Review the demo implementation
3. Check the test files for examples
4. Open an issue on GitHub

## Best Practices

1. **Always validate user input** before submitting to blockchain
2. **Show loading states** during async operations
3. **Handle errors gracefully** with user-friendly messages
4. **Estimate fees** before transactions
5. **Monitor state changes** for real-time updates
6. **Cache data** when appropriate to reduce RPC calls
7. **Test thoroughly** on testnet before mainnet deployment

## Next Steps

1. Deploy smart contracts to testnet
2. Test with real wallet connections
3. Monitor gas costs and optimize
4. Add analytics tracking
5. Implement notifications
6. Deploy to production
