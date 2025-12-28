# Design Document: Auth Screen Integration

## Overview

This design outlines the integration of the enhanced AuthScreen component to replace the current basic Connect Wallet Screen in the IndexPage. The integration will provide a more polished user experience while maintaining all existing functionality and state management.

## Architecture

The integration follows a component replacement pattern where the existing inline Connect Wallet Screen JSX in IndexPage will be replaced with the AuthScreen component. The AuthScreen will receive the necessary props to integrate with the existing TON wallet connection flow.

### Component Integration Flow

```mermaid
graph TD
    A[IndexPage] --> B{tonConnectUI.connected?}
    B -->|No| C[AuthScreen Component]
    B -->|Yes| D[Continue to Sponsor Gate]
    C --> E[User clicks Initialize Terminal]
    E --> F[tonConnectUI.openModal()]
    F --> G[TON Wallet Connection]
    G -->|Success| H[Update Connection State]
    G -->|Failure| I[Handle Error]
    H --> D
```

## Components and Interfaces

### AuthScreen Component Interface

The AuthScreen component already exists with the following interface:

```typescript
interface AuthScreenProps {
  onConnect: () => void;
}
```

### Integration Points

1. **IndexPage Integration**: Replace the existing Connect Wallet Screen JSX with AuthScreen component
2. **Connection Handler**: Pass tonConnectUI.openModal as the onConnect prop
3. **State Management**: Maintain existing tonConnectUI.connected state checking

### Modified Components

#### IndexPage.tsx Changes

**Current Implementation:**
```typescript
if (!tonConnectUI.connected) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8...">
      {/* Basic wallet connection UI */}
    </div>
  );
}
```

**New Implementation:**
```typescript
if (!tonConnectUI.connected) {
  return <AuthScreen onConnect={() => tonConnectUI.openModal()} />;
}
```

#### AuthScreen.tsx Fixes

**Icon Import Fix:**
- Replace `CloudCheck` with `Cloud` or `CheckCircle` from lucide-react
- Ensure all icon imports are valid

## Data Models

No new data models are required. The integration uses existing state management:

- `tonConnectUI.connected`: Boolean state for wallet connection status
- `tonConnectUI.openModal()`: Function to trigger wallet connection

## Error Handling

### Import Error Resolution

**Problem**: CloudCheck icon not available in lucide-react
**Solution**: Replace with available alternative icon

**Implementation:**
```typescript
// Replace CloudCheck with Cloud
import { Cloud } from 'lucide-react';

// Update usage in component
<Cloud size={10} /> Sync Ready
```

### Connection Error Handling

The AuthScreen will inherit the existing error handling from tonConnectUI:
- Connection failures are handled by the TON Connect UI library
- No additional error handling required in AuthScreen component

### Fallback Behavior

If AuthScreen fails to render:
- The existing Connect Wallet Screen code remains as fallback
- Error boundaries in the application will catch and handle component errors

## Testing Strategy

### Unit Testing Approach

**Component Integration Tests:**
- Test AuthScreen renders correctly when wallet not connected
- Test onConnect prop is called when Initialize Terminal button is clicked
- Test component receives correct props from IndexPage

**Icon Import Tests:**
- Test all lucide-react icons import successfully
- Test component renders without import errors

### Property-Based Testing

No property-based testing required for this UI integration task.

### Integration Testing

**End-to-End Flow Tests:**
- Test complete wallet connection flow from AuthScreen to connected state
- Test responsive behavior across different screen sizes
- Test dark/light theme compatibility

### Manual Testing Checklist

- [ ] AuthScreen displays when wallet not connected
- [ ] Initialize Terminal button triggers wallet connection modal
- [ ] Connection success leads to next screen
- [ ] Responsive design works on mobile and desktop
- [ ] Dark mode styling works correctly
- [ ] All animations and transitions work smoothly

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, several properties were identified as testable:

**Testable Properties:**
- Component rendering based on wallet state (1.2, 1.4, 2.1)
- Button interaction behavior
- UI content verification

**Non-testable Criteria:**
- Visual/responsive design aspects (4.1, 4.2, 4.3)
- External wallet connection flows (2.2, 2.3)
- General maintenance requirements (2.4, 3.3)

**Consolidation:**
- Properties 1.4 and 2.1 both test button click behavior and can be combined
- Properties 1.2 and content verification can be combined into UI rendering property

### Correctness Properties

**Property 1: AuthScreen UI Content Rendering**
*For any* rendered AuthScreen component, it should display the Smart Stake AI branding, animated elements, and all three feature pills (15% APY Staking, Secure Cloud Sync, AI Optimized Nodes)
**Validates: Requirements 1.2, 1.3**

**Property 2: Button Click Handler Integration**
*For any* AuthScreen component with an onConnect prop, clicking the "Initialize Terminal" button should call the provided onConnect function
**Validates: Requirements 1.4, 2.1**