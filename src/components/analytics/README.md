# Analytics Components Structure

This directory contains all analytics-related components organized by type.

## Directory Structure

```
src/components/analytics/
├── charts/                    # Chart components (line charts, bar charts, etc.)
├── tables/                    # Table components for data display
├── unified/                   # Unified/shared analytics components
├── stat-tiles/                # Stat tile components (NEW)
│   ├── engagedUsersTile/      # Engaged Users metric tile
│   ├── adoptedUsersTile/      # Adopted Users metric tile
│   ├── repeatVsNewTile/      # Repeat vs New Attendees metric tile
│   ├── resourceEngagementTile/ # Resource Engagement metric tile
│   ├── disengagedUsersTile/  # Disengaged Users metric tile
│   ├── churnedUsersTile/     # Churned Users metric tile
│   └── index.ts              # Exports all stat tile components
├── analytics-types.ts         # TypeScript type definitions
├── util.ts                    # Utility functions
└── index.ts                   # Main exports
```

## Stat Tiles

The `stat-tiles/` directory contains all the new analytics metric tiles:

- **EngagedUsersTile**: Shows percentage of active vs engaged users
- **AdoptedUsersTile**: Shows percentage of accounts that joined vs engaged
- **RepeatVsNewTile**: Shows comparison of repeat vs new event attendees
- **ResourceEngagementTile**: Shows total interactions and engagement percentage
- **DisengagedUsersTile**: Shows users not engaged in 1/3/6 months
- **ChurnedUsersTile**: Shows total churned users and churn rate

Each stat tile follows the same pattern as other analytics components with its own directory and index.tsx file.

## Usage

Import stat tiles from the main analytics index:

```typescript
import { EngagedUsersTile, AdoptedUsersTile } from '@/components/analytics';
```

Or import directly from stat-tiles:

```typescript
import { EngagedUsersTile } from '@/components/analytics/stat-tiles';
```
