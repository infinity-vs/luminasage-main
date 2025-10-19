# Inspired Mode - Local-First AI Collaboration

## Overview

Inspired Mode is Dyad's local-first AI collaboration mode that provides a pure contemplative development experience using Ollama models. It prioritizes privacy, offline capability, and deep focus through intelligent local AI processing.

## Quick Start

### Prerequisites

1. **Install Ollama**:
   ```bash
   # macOS / Linux
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Or visit: https://ollama.com/download
   ```

2. **Pull a recommended coding model**:
   ```bash
   ollama pull qwen2.5-coder:latest
   # or
   ollama pull codellama:latest
   ```

3. **Start Ollama**:
   ```bash
   ollama serve
   ```

### Activating Inspired Mode

1. Start Dyad
2. Click the mode selector in the chat controls (defaults to "Inspired" with purple color)
3. If Ollama is running, you'll see "Ollama Ready" indicator
4. Start chatting - all AI processing happens locally!

## Features

### 🔒 Complete Privacy
- All AI processing happens on your local machine
- No data sent to external servers
- No API keys required for local models

### 📡 Offline Capable
- Works without internet connection
- No external service dependencies
- Continues working during network outages

### 🧠 Intelligent Model Selection
Automatically selects the best Ollama model for coding:
1. qwen2.5-coder / qwen3-coder (preferred)
2. codellama
3. deepseek-coder
4. llama3
5. mistral
6. gemma2

### 🎨 Contemplative UI
- Calm purple color scheme
- Real-time status indicators
- Minimal distractions
- Clear validation messages

### ⚡ Fast & Responsive
- Local models respond instantly
- No network latency
- Smooth UI transitions

## How It Works

### Mode-Aware Routing

When Inspired mode is active:
```typescript
User sends message
  ↓
System checks active mode → "inspired"
  ↓
Routes to Ollama (even if different model was selected)
  ↓
Selects best available Ollama model
  ↓
Processes chat locally
  ↓
Returns response
```

### Automatic Validation

Before activating Inspired mode:
```typescript
1. Check Ollama availability
2. Verify at least one model is installed
3. Recommend best model for coding
4. Allow activation OR show clear error
```

## UI Components

### Mode Selector
- Shows current mode with icon
- Color-coded: Purple = Inspired
- Validates before switching
- Displays inline warnings

### Inspired Mode Indicator
- Appears only in Inspired mode
- Shows Ollama status (Ready / Offline)
- Displays number of available models
- Shows currently recommended model
- Tooltip with detailed information

### Status States

| State | Visual | Meaning |
|-------|--------|---------|
| ✅ Ready | Green check + "Ollama Ready" | Ollama running with models |
| ⚠️ Warning | Amber alert + "Ollama Offline" | Ollama not available |
| 🔄 Loading | Pulse animation | Checking status |

## Recommended Models

### Best for Coding
- **qwen2.5-coder** (7B, 14B, 32B)
- **qwen3-coder** (Latest Qwen release)
- **codellama** (7B, 13B, 34B, 70B)
- **deepseek-coder** (1.3B, 6.7B, 33B)

### General Purpose
- **llama3** (8B, 70B)
- **mistral** (7B, Mixtral 8x7B)
- **gemma2** (9B, 27B)

### Installation Tips
```bash
# Smaller models for faster response (4-8GB RAM)
ollama pull qwen2.5-coder:7b

# Balanced models for better quality (16GB+ RAM)
ollama pull qwen2.5-coder:14b

# Large models for best quality (32GB+ RAM)
ollama pull codellama:70b
```

## Troubleshooting

### "Ollama is not running"
```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### "No Ollama models found"
```bash
# Pull a model
ollama pull qwen2.5-coder

# List installed models
ollama list
```

### "Cannot activate Inspired mode"
1. Check Ollama is running: `ollama serve`
2. Verify models installed: `ollama list`
3. Check connection: `curl http://localhost:11434`
4. Restart Dyad

### Custom Ollama Host
```bash
# Set custom host in environment
export OLLAMA_HOST=http://192.168.1.100:11434

# Or for IPv6
export OLLAMA_HOST=http://[::1]:11434
```

## API Reference

### React Hooks

#### useInspiredMode()
```typescript
const {
  // Status
  isOllamaAvailable: boolean;
  availableModels: LocalModel[];
  recommendedModel: string | null;
  canActivate: boolean;
  validationReason?: string;
  
  // State
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refetchStatus: () => void;
  refetchValidation: () => void;
} = useInspiredMode();
```

#### useAICollaborationMode()
```typescript
const {
  currentMode: "inspired" | "didactic" | "parallel";
  currentModeStatus: AICollaborationModeStatus;
  switchMode: (mode, context?) => Promise<void>;
  isSwitching: boolean;
} = useAICollaborationMode();
```

### IPC Methods

```typescript
// Get Inspired mode status
const status = await ipcClient.getInspiredModeStatus();
// Returns: { isOllamaAvailable, availableModels, recommendedModel, isOfflineCapable }

// Validate Inspired mode can activate
const validation = await ipcClient.validateInspiredMode();
// Returns: { canActivate, reason? }

// Get recommended model
const model = await ipcClient.getRecommendedOllamaModel();
// Returns: "qwen2.5-coder:latest" | null
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  ┌────────────────┐  ┌──────────────────────────────┐  │
│  │ Mode Selector  │  │  Inspired Mode Indicator     │  │
│  └────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    React Hooks Layer                     │
│  useInspiredMode() / useAICollaborationMode()           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   IPC Client Layer                       │
│  getInspiredModeStatus() / validateInspiredMode()       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   IPC Handlers Layer                     │
│  mode:inspired:get-status / mode:inspired:validate      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Business Logic Layer                      │
│  inspired_mode_utils.ts / mode_aware_routing.ts        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Ollama API                             │
│  http://localhost:11434/api/tags                        │
└─────────────────────────────────────────────────────────┘
```

## Best Practices

### 1. Keep Ollama Running
Add Ollama to startup applications for seamless experience.

### 2. Install Multiple Models
Have backup models in case your primary model is updated:
```bash
ollama pull qwen2.5-coder:14b
ollama pull codellama:13b
ollama pull llama3:8b
```

### 3. Monitor System Resources
- 7B models: ~8GB RAM
- 13-14B models: ~16GB RAM
- 32-34B models: ~32GB RAM
- 70B models: ~64GB RAM

### 4. Update Regularly
```bash
ollama pull qwen2.5-coder  # Updates to latest
```

### 5. Check Status Before Long Sessions
Verify Ollama is running before starting deep work sessions.

## Performance

- **Status Check**: < 200ms
- **Model Recommendation**: < 100ms
- **Mode Switch**: < 500ms
- **Chat Response**: Depends on model size and hardware

## Privacy Guarantees

### What Stays Local
- ✅ All chat messages
- ✅ All code generated
- ✅ All model processing
- ✅ All context/history

### What Never Leaves
- ✅ Your codebase
- ✅ Your prompts
- ✅ Your API keys (not needed)
- ✅ Your conversation history

## Comparison with Other Modes

| Feature | Inspired | Didactic | Parallel |
|---------|----------|----------|----------|
| Local AI | ✅ Only | ❌ No | ✅ Yes |
| External AI | ❌ No | ✅ Only | ✅ Yes |
| Offline | ✅ Yes | ❌ No | ❌ No |
| Privacy | 🔒 Complete | ⚠️ Cloud | 🔀 Mixed |
| Setup | Ollama | API Keys | Both |

## Related Documentation

- [Phase 1 Complete](./PHASE_1_COMPLETE.md) - Foundation implementation
- [Phase 2 Complete](./PHASE_2_COMPLETE.md) - Detailed technical docs
- [AI Collaboration Modes](./ai-collaboration-modes.md) - Full system overview

## Future Enhancements

### Planned for Future Phases
- 📊 Performance monitoring
- 🎛️ Advanced model configuration
- 💾 Model caching optimizations
- 🔄 Automatic model updates
- 📈 Usage analytics (local only)

## Contributing

When contributing to Inspired mode:
1. Maintain local-first philosophy
2. Ensure offline capability
3. Respect privacy guarantees
4. Follow contemplative UI principles
5. Add comprehensive tests

## License

Part of Dyad - see root LICENSE file.
