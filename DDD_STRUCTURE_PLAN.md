# DDD Module Structure Plan

## Current Structure (Flat)
```
src/
├── routes/
├── services/
├── controllers/
├── models/
├── middleware/
├── config/
├── lib/
└── ...
```

## New DDD Structure
```
src/
├── modules/
│   ├── health/
│   │   ├── routes.ts
│   │   ├── services/
│   │   │   ├── healthService.ts
│   │   │   ├── healthMonitor.ts
│   │   │   └── notificationProvider.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── social/
│   │   ├── routes.ts
│   │   ├── services/
│   │   │   ├── twitterService.ts
│   │   │   ├── youtubeService.ts
│   │   │   └── facebookService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── content/
│   │   ├── routes.ts
│   │   ├── services/
│   │   │   ├── videoService.ts
│   │   │   ├── translationService.ts
│   │   │   └── ttsService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── billing/
│   │   ├── routes.ts
│   │   ├── services/
│   │   │   └── billingService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── auth/
│   │   ├── routes.ts
│   │   ├── controllers/
│   │   │   └── authController.ts
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── organization/
│   │   ├── routes.ts
│   │   ├── controllers/
│   │   │   └── organizationController.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── webhook/
│   │   ├── routes.ts
│   │   ├── services/
│   │   │   └── webhookDispatcher.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── analytics/
│       ├── routes.ts
│       ├── services/
│       │   └── analyticsService.ts
│       ├── types.ts
│       └── index.ts
│
├── shared/
│   ├── middleware/
│   ├── lib/
│   ├── config/
│   ├── types/
│   ├── utils/
│   └── schemas/
│
├── app.ts
└── server.ts
```

## Module Boundaries

### Health Module
- Health monitoring and alerting
- Notification providers
- Alert configuration

### Social Module
- Twitter integration
- YouTube integration
- Facebook integration

### Content Module
- Video processing
- Translation
- Text-to-speech

### Billing Module
- Billing operations
- Subscription management

### Auth Module
- Authentication
- Authorization
- JWT handling

### Organization Module
- Organization management
- Roles and permissions

### Webhook Module
- Webhook management
- Webhook dispatching

### Analytics Module
- Analytics tracking
- Metrics collection

### Shared
- Common middleware
- Utilities
- Configuration
- Types
- Schemas

## No Circular Dependencies
- Modules can depend on Shared
- Modules should NOT depend on each other
- Use event bus for cross-module communication
