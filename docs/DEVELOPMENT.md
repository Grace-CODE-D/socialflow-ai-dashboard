# SocialFlow Development Guide

## 📋 Table of Contents
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Git Workflow](#git-workflow)
- [Debugging](#debugging)
- [Performance](#performance)

---

## Development Workflow

### Starting Development

```bash
# 1. Create feature branch
git checkout -b features/your-feature-name

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:5173

# 4. Make changes
# Files auto-reload on save

# 5. Run tests
npm run test

# 6. Commit changes
git add .
git commit -m "feat: your feature description"

# 7. Push and create PR
git push origin features/your-feature-name
```

### Development Commands

```bash
# Web Development
npm run dev                    # Start Vite dev server
npm run build                  # Build for production
npm run preview                # Preview production build

# Electron Development
npm run electron:dev           # Start Electron app
npm run electron:build         # Build Electron app

# Testing
npm run test                   # Run all tests
npm run test:watch             # Run tests in watch mode
npm run test:e2e               # Run E2E tests
npm run test:coverage          # Generate coverage report

# Code Quality
npm run lint                   # Run ESLint
npm run format                 # Format code with Prettier
npm run type-check             # TypeScript type checking

# Developer Tools
npm run dev:setup              # Setup development environment
npm run dev:generate-accounts  # Generate test accounts
npm run dev:fund-accounts      # Fund test accounts
npm run dev:check-balances     # Check account balances
```

---

## Project Structure

```
socialflow/
├── components/              # React components
│   ├── blockchain/         # Blockchain-related components
│   ├── ui/                 # Reusable UI components
│   └── *.tsx               # Feature components
├── services/               # Business logic services
│   ├── analyticsService.ts
│   ├── geminiService.ts
│   └── identityService.ts
├── store/                  # State management
├── tests/                  # Test files
│   ├── e2e/               # End-to-end tests
│   └── unit/              # Unit tests
├── scripts/               # Development scripts
├── docs/                  # Documentation
├── electron/              # Electron main process
├── public/                # Static assets
└── types.ts               # TypeScript type definitions
```

### Component Organization

```
components/
├── ComponentName/
│   ├── index.tsx          # Main component
│   ├── ComponentName.test.tsx
│   ├── ComponentName.styles.ts
│   └── types.ts           # Component-specific types
```

---

## Coding Standards

### TypeScript

#### Type Definitions
```typescript
// ✅ Good: Explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad: Implicit any
function getUser(id) {
  // ...
}
```

#### Interfaces vs Types
```typescript
// Use interfaces for objects
interface Campaign {
  id: string;
  name: string;
}

// Use types for unions and primitives
type Status = 'active' | 'paused' | 'completed';
type ID = string | number;
```

### React Components

#### Functional Components
```typescript
// ✅ Good: Typed props with interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

#### Hooks
```typescript
// ✅ Good: Custom hooks with proper typing
function useAccount(publicKey: string) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadAccount(publicKey);
  }, [publicKey]);

  return { account, loading, error };
}
```

### Naming Conventions

```typescript
// Components: PascalCase
export const UserProfile = () => {};

// Functions: camelCase
function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Interfaces: PascalCase with 'I' prefix (optional)
interface IUserData {}

// Types: PascalCase
type UserRole = 'admin' | 'user';

// Files: kebab-case or PascalCase
// user-profile.tsx or UserProfile.tsx
```

### Code Organization

```typescript
// 1. Imports (grouped)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from './components/Button';
import { userService } from './services/userService';

import type { User } from './types';

// 2. Types/Interfaces
interface Props {
  userId: string;
}

// 3. Constants
const DEFAULT_TIMEOUT = 5000;

// 4. Component
export const UserProfile: React.FC<Props> = ({ userId }) => {
  // 4a. Hooks
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // 4b. Effects
  useEffect(() => {
    loadUser();
  }, [userId]);

  // 4c. Functions
  const loadUser = async () => {
    // ...
  };

  // 4d. Render
  return (
    <div>
      {/* ... */}
    </div>
  );
};
```

---

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button label="Click" onClick={onClick} />);
    
    screen.getByText('Click').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button label="Click" onClick={() => {}} disabled />);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

### E2E Tests

```typescript
import { describe, it, expect } from 'vitest';
import { setupE2ETest } from './setup';

describe('Campaign Creation', () => {
  setupE2ETest();

  it('should create campaign successfully', async () => {
    const campaign = await createCampaign({
      name: 'Test Campaign',
      budget: 1000,
    });

    expect(campaign.id).toBeDefined();
    expect(campaign.name).toBe('Test Campaign');
  });
});
```

### Test Coverage

Aim for:
- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User workflows

---

## Git Workflow

### Branch Naming

```bash
# Features
features/issue-123-campaign-creation
features/add-nft-minting

# Bug Fixes
bugfix/issue-456-wallet-connection
bugfix/fix-reward-calculation

# Hotfixes
hotfix/critical-security-patch

# Releases
release/v1.2.0
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting
refactor: # Code restructuring
test:     # Adding tests
chore:    # Maintenance

# Examples
feat(campaign): add reward distribution
fix(wallet): resolve connection timeout
docs(setup): update installation guide
test(e2e): add campaign creation tests
```

### Pull Request Process

1. **Create Branch**
   ```bash
   git checkout -b features/your-feature
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

4. **Push Branch**
   ```bash
   git push origin features/your-feature
   ```

5. **Create PR**
   - Use PR template
   - Link related issues
   - Request reviewers

6. **Address Feedback**
   - Make requested changes
   - Push updates
   - Re-request review

7. **Merge**
   - Squash and merge
   - Delete branch

---

## Debugging

### Browser DevTools

```typescript
// Console logging
console.log('Debug:', data);
console.error('Error:', error);
console.table(array);

// Debugger
debugger; // Pauses execution

// Performance
console.time('operation');
// ... code ...
console.timeEnd('operation');
```

### React DevTools

1. Install React DevTools extension
2. Open DevTools
3. Navigate to "Components" tab
4. Inspect component props and state

### Stellar Debugging

```typescript
// Log transaction details
console.log('Transaction XDR:', transaction.toXDR());

// Log account details
console.log('Account:', await server.loadAccount(publicKey));

// Use Stellar Laboratory
// https://laboratory.stellar.org/
```

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

---

## Performance

### Optimization Tips

#### React Performance
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // ...
});

// Use useMemo for expensive calculations
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);

// Use useCallback for functions passed to children
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

#### Code Splitting
```typescript
// Lazy load components
const Dashboard = lazy(() => import('./components/Dashboard'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

#### Bundle Size
```bash
# Analyze bundle
npm run build
npm run analyze

# Check bundle size
ls -lh dist/assets/
```

---

## Best Practices

### Security
- ✅ Never commit secrets
- ✅ Validate all inputs
- ✅ Sanitize user data
- ✅ Use HTTPS in production
- ✅ Implement rate limiting

### Performance
- ✅ Lazy load components
- ✅ Optimize images
- ✅ Minimize bundle size
- ✅ Use code splitting
- ✅ Cache API responses

### Accessibility
- ✅ Use semantic HTML
- ✅ Add ARIA labels
- ✅ Support keyboard navigation
- ✅ Ensure color contrast
- ✅ Test with screen readers

### Code Quality
- ✅ Write tests
- ✅ Document complex logic
- ✅ Keep functions small
- ✅ Follow DRY principle
- ✅ Use TypeScript strictly

---

## Resources

### Documentation
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Stellar Docs](https://developers.stellar.org/)
- [Vite Docs](https://vitejs.dev/)

### Tools
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/)
- [React DevTools](https://react.dev/learn/react-developer-tools)

### Community
- GitHub Discussions
- Discord Server
- Stack Overflow

---

**Happy Developing! 🚀**
