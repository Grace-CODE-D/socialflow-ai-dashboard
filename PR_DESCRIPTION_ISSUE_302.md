# Domain-Driven Design (DDD) Restructuring

## Overview
Restructured codebase from flat, layer-based architecture to Domain-Driven Design (DDD) structure that groups code by business domains.

## Changes
- **Modules**: 8 domain modules (health, social, content, billing, auth, organization, webhook, analytics)
- **Shared**: Centralized cross-cutting concerns (middleware, lib, config, types, utils, schemas)
- **Module Registry**: Centralized route registration
- **No Circular Dependencies**: Enforced module isolation

## New Structure
```
src/
├── modules/
│   ├── health/
│   ├── social/
│   ├── content/
│   ├── billing/
│   ├── auth/
│   ├── organization/
│   ├── webhook/
│   └── analytics/
└── shared/
    ├── middleware/
    ├── lib/
    ├── config/
    ├── types/
    ├── utils/
    └── schemas/
```

## Module Boundaries
- **Health**: Health monitoring and alerting
- **Social**: Twitter, YouTube, Facebook integrations
- **Content**: Video, Translation, TTS
- **Billing**: Billing and subscriptions
- **Auth**: Authentication and authorization
- **Organization**: Organization and team management
- **Webhook**: Webhook management
- **Analytics**: Analytics and metrics

## Benefits
✅ Better organization by business domain  
✅ Clear module boundaries  
✅ Reduced coupling  
✅ Easier to scale  
✅ Improved maintainability  
✅ No circular dependencies  

## Documentation
- `DDD_STRUCTURE_PLAN.md` - Structure overview
- `DDD_RESTRUCTURING_GUIDE.md` - Comprehensive guide
- `DDD_MIGRATION_GUIDE.md` - Migration instructions

## Backward Compatible
- All files copied to new locations
- Gradual migration possible
- No breaking changes

Closes #302
