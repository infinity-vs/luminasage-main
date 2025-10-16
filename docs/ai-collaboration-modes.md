# AI Collaboration Mode System

## Overview

The AI Collaboration Mode System introduces a sophisticated three-mode architecture for AI collaboration within Dyad. This system allows users to switch between different AI collaboration patterns based on their needs and preferences.

## Modes

### Inspired Mode (Default)

- **Description**: Pure local AI experience using Ollama models
- **Capabilities**:
  - ✅ Local AI processing
  - ✅ Offline capable
  - ❌ External AI
  - ❌ Multi-channel coordination
- **Use Case**: Contemplative local development with complete privacy

### Didactic Mode

- **Description**: External AI orchestration via Perplexity MCP
- **Capabilities**:
  - ❌ Local AI
  - ✅ External AI
  - ✅ Real-time sync
  - ❌ Multi-channel coordination
- **Use Case**: Leveraging external AI services and MCP ecosystem

### Parallel Mode

- **Description**: Hybrid local + external multi-channel coordination
- **Capabilities**:
  - ✅ Local AI processing
  - ✅ External AI
  - ✅ Multi-channel coordination
  - ✅ Real-time sync
  - ❌ Offline capable
- **Use Case**: Glass-box transparent coordination of multiple AI sources

## Architecture

### Database Schema

The system uses three primary tables:

1. **ai_collaboration_modes**: Stores mode configurations and active state
2. **mode_capabilities**: Defines capabilities for each mode
3. **mode_transition_history**: Tracks mode switches with context preservation

### IPC Communication

Following Dyad's established IPC patterns:

**Handlers**: `src/ipc/handlers/mode_handlers.ts`

- `mode:get-state`: Get current mode state snapshot
- `mode:get-mode-status`: Get specific mode status
- `mode:switch-mode`: Switch to a different mode
- `mode:update-configuration`: Update mode configuration
- `mode:get-transition-history`: Get transition history

**Client**: `src/ipc/ipc_client.ts`

- Methods correspond 1:1 with handlers
- Returns properly typed results

**Preload**: `src/preload.ts`

- All mode IPC channels are allowlisted

### React Integration

**Hook**: `src/hooks/useAICollaborationMode.ts`

```typescript
const {
  currentMode,
  currentModeStatus,
  availableModes,
  switchMode,
  updateConfiguration,
  isSwitching,
} = useAICollaborationMode();
```

**Component**: `src/components/AICollaborationModeSelector.tsx`

- Visual mode selector integrated into ChatInputControls
- Shows mode icons, descriptions, and capability badges
- Color-coded by mode type

## Usage

### Switching Modes

```typescript
import { useAICollaborationMode } from '@/hooks/useAICollaborationMode';

function MyComponent() {
  const { switchMode, currentMode } = useAICollaborationMode();

  const handleSwitch = async () => {
    await switchMode('parallel', { contextKey: 'value' });
  };

  return <button onClick={handleSwitch}>Switch to Parallel</button>;
}
```

### Checking Current Mode

```typescript
const { currentMode, currentModeStatus } = useAICollaborationMode();

if (currentMode === "inspired") {
  // Show local-only features
}

if (currentModeStatus?.capabilities.offlineCapable) {
  // Show offline indicator
}
```

### Mode-Specific Features

Future implementations can check the current mode to enable/disable features:

```typescript
const { currentMode } = useAICollaborationMode();

// Only show MCP tools in didactic or parallel modes
{currentMode !== 'inspired' && <McpToolsPicker />}
```

## Implementation Status

### Phase 1: Foundation Integration ✅

- [x] Database schema extensions
- [x] IPC handlers for mode operations
- [x] IPC client methods
- [x] Preload allowlist entries
- [x] React hook (useAICollaborationMode)
- [x] Mode selector UI component
- [x] Database migration generated

### Phase 2: Inspired Mode Implementation (Pending)

- [ ] Ollama integration enhancement
- [ ] Contemplative UI adaptations
- [ ] LuminaSage MCP integration
- [ ] Offline capability validation

### Phase 3: Didactic Mode Implementation (Pending)

- [ ] Perplexity MCP orchestrator
- [ ] External AI coordination
- [ ] Sacred files integration
- [ ] MCP ecosystem coordination

### Phase 4: Parallel Mode Implementation (Pending)

- [ ] Multi-MCP coordinator
- [ ] Glass-box transparency system
- [ ] Response harmonization
- [ ] Conflict resolution

### Phase 5: Distributed Memory Integration (Pending)

- [ ] MongoDB collections setup
- [ ] Redis event bus
- [ ] WebSocket live sync
- [ ] Ecosystem project connections

### Phase 6: Polish and Optimization (Pending)

- [ ] Performance optimization
- [ ] Consciousness-honoring polish
- [ ] Comprehensive testing
- [ ] Documentation completion

## Testing

Run the mode system tests:

```bash
npm test mode
```

## Future Enhancements

1. **Mode-Aware Chat Routing**: Route chat requests based on active mode
2. **Performance Monitoring**: Track mode-specific performance metrics
3. **Context Preservation**: Enhanced context snapshots during mode switches
4. **Mode Recommendations**: Suggest optimal mode based on task
5. **Custom Mode Configurations**: User-configurable mode parameters

## Related Documentation

- Design Document: See project root for full design specification
- MCP Integration: `docs/mcp-integration.md`
- IPC Patterns: See `.cursor/` rules directory
