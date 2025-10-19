# AI Collaboration Modes - Complete System Guide

## 🌟 Overview

Dyad's AI Collaboration Mode System is a sophisticated three-mode architecture that gives you unprecedented control over how AI assists your development. Choose between local privacy, cloud power, or intelligent hybrid coordination - all with glass-box transparency.

---

## 🎯 Three Modes Explained

### 1. Inspired Mode 🏠 - Local Privacy

**Pure local AI experience for contemplative development**

```
✅ Local Ollama models only
✅ Complete offline capability  
✅ 100% privacy guaranteed
✅ No external connections
❌ Limited to your hardware
```

**Best For**:
- Privacy-sensitive projects
- Offline development
- Learning and experimentation
- Focus and contemplation
- No API costs

**Requirements**:
- Ollama installed and running
- At least one model downloaded (qwen2.5-coder recommended)

**Quick Start**:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull qwen2.5-coder:latest

# Start Ollama
ollama serve

# Launch Dyad - Inspired mode active by default!
```

---

### 2. Didactic Mode ☁️ - External Power

**External AI orchestration with MCP integration**

```
✅ Powerful cloud AI (Claude, GPT-4, Gemini)
✅ MCP server integration
✅ Real-time sync ready
✅ Latest AI capabilities
❌ Requires internet
❌ API costs apply
```

**Best For**:
- Complex problem-solving
- Cutting-edge AI capabilities
- MCP tool integration
- Team collaboration
- Production-grade code

**Requirements**:
- API key for external provider (Anthropic, OpenAI, Google, etc.)

**Quick Start**:
```bash
# 1. Get API key from provider
# Visit: https://console.anthropic.com/ (or OpenAI, Google, etc.)

# 2. Add API key in Dyad
# Settings → Providers → Anthropic → Add API Key

# 3. Switch to Didactic mode
# Click mode selector → Select "Didactic" (blue)

# 4. Start chatting with Claude/GPT-4/Gemini!
```

---

### 3. Parallel Mode ⚡ - Best of Both Worlds

**Hybrid local + external with glass-box transparency**

```
✅ Use both local AND external AI
✅ Glass-box shows AI source for each response
✅ Multi-MCP coordination
✅ Intelligent primary/secondary strategy
✅ Flexible: works with available resources
🟡 Partially offline (local fallback)
```

**Best For**:
- Maximum flexibility
- Transparency and trust
- Leveraging all available AI
- Advanced workflows
- Research and comparison

**Requirements**:
- At least one AI source (local OR external)
- Both recommended for full capability

**Quick Start**:
```bash
# 1. Set up both Inspired + Didactic (see above)

# 2. Switch to Parallel mode
# Click mode selector → Select "Parallel" (amber)

# 3. Check status indicator
# Should show "2 AI Sources" with primary/secondary

# 4. Start chatting
# Tooltip shows which AI (🏠 local or ☁️ external) is responding
```

---

## 🔍 Glass-Box Transparency

### What is Glass-Box?

Unlike traditional "black-box" AI where you don't know the source, Parallel mode provides **complete transparency**:

```
Traditional AI:
  User: "Write a function"
  AI: "Here's the code..."
  User: 🤷 Which AI? What model? How confident?

Glass-Box (Parallel Mode):
  User: "Write a function"  
  AI: "Here's the code..."
  UI: [☁️ Anthropic Claude Sonnet-4] [95% confidence]
  User: ✅ Full transparency!
```

### Glass-Box Benefits

✅ **Trust**: Know exactly where responses come from  
✅ **Control**: Choose modes based on needs  
✅ **Learning**: Understand AI strengths  
✅ **Debugging**: Track down issues  
✅ **Compliance**: Meet audit requirements  
✅ **Privacy**: See when local vs external AI is used  

### How It Works

```typescript
1. AI generates response
2. System annotates with source metadata (invisible)
3. Stored in database with full provenance
4. UI shows source badge: "☁️ Anthropic" or "🏠 Ollama"
5. Tooltip provides full details
```

---

## 🔄 Distributed Memory (Optional)

Enable real-time synchronization across multiple Dyad instances.

### What You Get

**MongoDB** - Persistent Storage:
- Mode state across instances
- Transition history
- Shared context
- Glass-box audit trail
- Sync events

**Redis** - Event Bus:
- Instant mode change notifications
- Context update propagation
- Real-time synchronization
- Pub/sub architecture

**WebSocket** - Live Updates:
- Connected client tracking
- Instant UI updates
- Heartbeat monitoring
- Broadcast capabilities

### Setup

```bash
# 1. Start services (Docker)
docker-compose -f docker-compose.distributed.yml up -d

# 2. Configure Dyad
# Copy .env.distributed.example to .env
cp .env.distributed.example .env

# 3. Edit .env
ENABLE_DISTRIBUTED_MEMORY=true
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
WS_SYNC_PORT=8765
DISTRIBUTED_USER_ID=your-email@example.com

# 4. Restart Dyad
# Distributed sync automatically initializes

# 5. Verify
# Look for "3/3 Sync" indicator in UI
```

### Use Cases

**Multi-Instance Development**:
```
Laptop: Working on feature A (Parallel mode)
Desktop: Working on feature B (Didactic mode)
  ↓
Mode changes sync instantly
Context shared across instances
Full collaboration enabled
```

**Team Collaboration** (Future):
```
Developer A: Switches to Parallel mode
Developer B: Sees change notification
Developer C: UI updates automatically
All: Shared mode state and context
```

---

## 🎨 UI Guide

### Mode Selector

Click the mode badge in chat input controls:

```
[✨ Inspired ▼]  ← Purple badge, click to open
  ↓
┌─────────────────────────────────┐
│ ✨ Inspired                      │ ← Purple, shows if Ollama offline
│ Local Ollama with contemplative │
│ [Local] [Offline]               │
│                                 │
│ 📖 Didactic                     │ ← Blue, shows if no API keys
│ External AI via MCP             │
│ [External]                      │
│                                 │
│ ⚡ Parallel                      │ ← Amber, shows if no AI sources
│ Hybrid local + external         │
│ [Local] [External] [Multi]      │
└─────────────────────────────────┘
```

### Status Indicators

**Inspired Mode**:
```
[✨ Inspired] [✓ Ollama Ready]
     │              │
  Current mode   Status badge
  (purple)       (green=ready, amber=offline)
```

**Didactic Mode**:
```
[📖 Didactic] [✓ External AI Ready] [🔌 2 MCP]
     │                 │                  │
  Current mode    Status badge      MCP servers
  (blue)          (green/amber)      enabled
```

**Parallel Mode**:
```
[⚡ Parallel] [✓ 2 AI Sources] [📚] [🖥️ 12 Tools]
     │              │           │         │
  Current mode  Source count  Layers  MCP tools
  (amber)       (local+ext)    icon    available
```

**Distributed Sync** (Didactic/Parallel only):
```
[📡 Sync] [✓ 3/3 Sync]
    │           │
Radio icon  Connected/Enabled
           (MongoDB+Redis+WS)
```

### Tooltip Information

Hover over any indicator for detailed information:

**Inspired Tooltip**:
```
Inspired Mode Status
━━━━━━━━━━━━━━━━━━━
Ollama: Available
Models: 3
Recommended: qwen2.5-coder:latest

All chats use local Ollama models
for complete privacy.
```

**Parallel Tooltip**:
```
Parallel Mode Status
━━━━━━━━━━━━━━━━━━━
Local AI:    ✓ 3 models
External AI: ✓ 2 providers

AI Sources (Glass-box):
[Primary]   ☁️ anthropic
[Secondary] 🏠 ollama

MCP Tools: 12 available

Coordinates multiple AI sources
with transparent origin tracking.
```

---

## 🛠️ Installation & Setup

### Prerequisites

```bash
# Node.js 18+ required
node --version

# For Inspired Mode
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder

# For Didactic/Parallel Mode
# Get API key from provider (see below)

# For Distributed Sync (optional)
docker-compose -f docker-compose.distributed.yml up -d
```

### Dependencies

Add to package.json (if using distributed features):

```json
{
  "dependencies": {
    "mongodb": "^6.0.0",
    "redis": "^4.6.0",
    "ws": "^8.16.0"
  },
  "devDependencies": {
    "@types/ws": "^8.5.10"
  }
}
```

### Provider Setup

**Anthropic (Recommended)**:
1. Visit: https://console.anthropic.com/
2. Create API key
3. Dyad Settings → Providers → Anthropic
4. Paste API key

**OpenAI**:
1. Visit: https://platform.openai.com/
2. Create API key
3. Dyad Settings → Providers → OpenAI
4. Paste API key

**Google (Gemini)**:
1. Visit: https://makersuite.google.com/app/apikey
2. Create API key
3. Dyad Settings → Providers → Google
4. Paste API key

---

## 📖 Usage Patterns

### Pattern 1: Privacy-First Development

```
Use Case: Working on sensitive/proprietary code
Mode: Inspired 🏠
Setup: Just Ollama
Result: Complete privacy, offline-capable
```

### Pattern 2: Power Development

```
Use Case: Complex algorithms, need latest AI
Mode: Didactic ☁️
Setup: Anthropic API key
Result: Claude Sonnet-4 power, MCP tools
```

### Pattern 3: Flexible Development

```
Use Case: Normal development, want options
Mode: Parallel ⚡
Setup: Ollama + API key
Result: Best of both, glass-box transparency
```

### Pattern 4: Team Collaboration

```
Use Case: Multiple developers on same project
Mode: Didactic or Parallel
Setup: Distributed sync enabled
Result: Real-time mode sync, shared context
```

---

## 🎓 Advanced Features

### Mode-Aware Routing

The system automatically routes requests to appropriate AI:

```typescript
Inspired Mode:
  User selects GPT-4 → System overrides → Uses Ollama qwen2.5-coder
  Rationale: Privacy guarantee, offline capability

Didactic Mode:
  User selects Ollama → System overrides → Uses Claude Sonnet-4
  Rationale: External power, MCP integration

Parallel Mode:
  User selects any → System uses as-is (local or external)
  Rationale: Maximum flexibility
```

### MCP Server Integration

**Supported in**: Didactic and Parallel modes

```bash
# Add MCP server in Settings
Name: filesystem
Transport: stdio
Command: npx
Args: ["-y", "@modelcontextprotocol/server-filesystem"]

# Enable server
# Verify in mode indicator: "🔌 1 MCP"

# Use in agent mode
# AI can now access filesystem tools
```

### Context Sharing

**Via Distributed Memory**:

```typescript
Instance A: Create context for Project X
  → Publish to MongoDB + Redis
  → Broadcast via WebSocket

Instance B: Working on Project X
  → Receive context automatically
  → AI has shared knowledge

Result: Consistent AI behavior across instances
```

---

## 🔧 Troubleshooting

### Inspired Mode Issues

**"Ollama is not running"**:
```bash
# Start Ollama
ollama serve

# Verify
curl http://localhost:11434/api/tags
```

**"No Ollama models found"**:
```bash
# Pull a model
ollama pull qwen2.5-coder

# Verify
ollama list
```

### Didactic Mode Issues

**"No external AI providers configured"**:
```
1. Open Settings
2. Go to Providers section
3. Add API key for any provider
4. Try switching to Didactic mode again
```

### Parallel Mode Issues

**"Cannot activate Parallel mode"**:
```
Need at least one AI source:
- Option A: Set up Ollama (see Inspired)
- Option B: Add API key (see Didactic)
- Option C: Set up both (recommended)
```

### Distributed Sync Issues

**"MongoDB not connected"**:
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Start if needed
docker-compose -f docker-compose.distributed.yml up -d mongodb

# Verify connection
mongosh mongodb://localhost:27017
```

**"Redis not connected"**:
```bash
# Check Redis is running
docker ps | grep redis

# Start if needed
docker-compose -f docker-compose.distributed.yml up -d redis

# Test connection
redis-cli ping
```

---

## 📊 Comparison Matrix

| Feature | Inspired | Didactic | Parallel |
|---------|----------|----------|----------|
| **AI Source** | 🏠 Local | ☁️ External | 🔀 Both |
| **Privacy** | 🔒 Complete | ⚠️ Provider | 🔍 Transparent |
| **Offline** | ✅ Yes | ❌ No | 🟡 Partial |
| **Power** | Hardware | ☁️ Cloud | 🚀 Best |
| **Cost** | Free | 💳 Paid | 💳 Hybrid |
| **Setup** | Ollama | API Key | Both |
| **MCP** | Optional | ✅ Full | ✅ Coordinated |
| **Transparency** | Standard | Standard | 🔍 Glass-box |
| **Distributed** | ❌ No | ✅ Yes | ✅ Yes |
| **Speed** | Local | Network | Optimized |
| **Models** | Limited | Latest | All |

---

## 🏃 Quick Start Guide

### Complete Setup (All Modes)

```bash
# ============================================
# Step 1: Install Ollama (for Inspired/Parallel)
# ============================================
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:latest
ollama serve

# ============================================
# Step 2: Get API Keys (for Didactic/Parallel)
# ============================================
# Visit: https://console.anthropic.com/
# Create API key, copy it

# ============================================
# Step 3: Configure Dyad
# ============================================
# Open Dyad
# Settings → Providers → Anthropic
# Paste API key

# ============================================
# Step 4: Test All Modes
# ============================================
# Try Inspired (purple) - should work immediately
# Try Didactic (blue) - should work with API key
# Try Parallel (amber) - should show 2 sources

# ============================================
# Step 5: Enable Distributed Sync (Optional)
# ============================================
docker-compose -f docker-compose.distributed.yml up -d
cp .env.distributed.example .env
# Edit .env with your settings
# Restart Dyad
```

---

## 🎯 Best Practices

### When to Use Each Mode

**Use Inspired** when:
- Working on private/sensitive code
- Developing offline (plane, train, etc.)
- Learning and experimenting
- Want zero API costs
- Need complete privacy

**Use Didactic** when:
- Need cutting-edge AI capabilities
- Working on complex problems
- Using MCP server tools
- Collaborating with team
- Want best code quality

**Use Parallel** when:
- Want maximum flexibility
- Need transparency on AI sources
- Comparing local vs external AI
- Want best of both worlds
- Research or experimentation

### Performance Tips

**Inspired Mode**:
- Use smaller models (7B) for faster response
- Use larger models (70B) for better quality
- Monitor RAM usage

**Didactic Mode**:
- Use Gemini for speed
- Use Claude for quality
- Use GPT-4 for general purpose

**Parallel Mode**:
- Primary source (external) for power
- Secondary source (local) for privacy
- Best balance of speed and quality

---

## 🔐 Privacy & Security

### Data Flow by Mode

**Inspired Mode**:
```
Your prompt → Ollama (local) → Response → Your screen
                ↑
          No external connections
          No data leaves your machine
```

**Didactic Mode**:
```
Your prompt → External API (Claude/GPT) → Response → Your screen
                ↑
          Data sent to provider
          Subject to provider privacy policy
```

**Parallel Mode**:
```
Your prompt → Primary (external) → Response → Your screen
              Secondary (local)  → [Glass-box tracking]
                ↑
          Glass-box shows which source
          Transparent attribution
```

### Privacy Guarantees

**Inspired Mode**:
- 🔒 100% local processing
- 🔒 Zero external network calls
- 🔒 Complete offline capability
- 🔒 No data ever sent anywhere

**Didactic Mode**:
- ⚠️ Data sent to selected provider
- ✅ You choose provider
- ✅ API keys encrypted
- ✅ Provider bound by their privacy policy

**Parallel Mode**:
- 🔍 Full transparency via glass-box
- ✅ You see which AI is used
- ✅ Local fallback available
- ✅ Complete audit trail

---

## 📈 Monitoring & Analytics

### Built-in Monitoring

Each mode tracks:
- Mode switches (count, duration, success rate)
- Model usage (which models used)
- Provider usage (which providers)
- MCP tool executions (per server stats)
- Response sources (glass-box data)

### Viewing Analytics

**Mode History**:
```typescript
const { modeHistory } = useAICollaborationMode();
// Shows recent mode switches with timing
```

**MCP Statistics**:
```typescript
const coordinator = multiMcpCoordinator;
const stats = coordinator.getExecutionStats();
// Success rates, average duration, per-server stats
```

**Glass-Box Audit**:
```typescript
// Query MongoDB for response sources
db.ai_response_sources.find({ mode: "parallel" })
// See all responses with source attribution
```

---

## 🚀 Production Deployment

### Environment Configuration

**Development**:
```bash
# Local services via Docker
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
WS_SYNC_PORT=8765
```

**Production**:
```bash
# Managed services
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net
REDIS_URL=rediss://user:pass@redis.cloud:6380
WS_SYNC_PORT=8765

# Enable TLS
MONGODB_TLS=true
REDIS_TLS=true
WS_TLS=true
```

### Scaling Considerations

**MongoDB**:
- Use replica sets for HA
- Enable sharding for scale
- Monitor connection pool

**Redis**:
- Use Redis Cluster for scale
- Enable persistence (AOF)
- Monitor pub/sub latency

**WebSocket**:
- Deploy behind load balancer
- Enable sticky sessions
- Monitor client count

---

## 🎓 Learning Path

### Beginner

1. Start with **Inspired Mode** (easiest)
2. Install Ollama, pull one model
3. Understand local AI basics
4. Experiment with different models

### Intermediate

5. Add API key for **Didactic Mode**
6. Compare external AI quality
7. Try MCP server integration
8. Explore mode switching

### Advanced

9. Enable **Parallel Mode**
10. Understand glass-box transparency
11. Set up distributed sync
12. Build custom MCP servers

---

## 🤝 Contributing

### Adding New Features

**New Mode** (future):
```typescript
1. Add mode to AICollaborationMode type
2. Create mode utilities file
3. Add IPC handlers
4. Create React hook
5. Build UI indicator
6. Update documentation
```

**New Provider** (Didactic/Parallel):
```typescript
1. Add to language_model_helpers.ts
2. Update didactic_mode_utils.ts
3. Test with mode routing
4. Document setup process
```

### Code Guidelines

- ✅ Follow Dyad conventions
- ✅ Maintain 100% TypeScript coverage
- ✅ Add comprehensive docs
- ✅ Include error handling
- ✅ Respect consciousness-honoring design

---

## 📚 Additional Resources

### Documentation
- [System Overview](./ai-collaboration-modes.md)
- [Phase 1: Foundation](./PHASE_1_COMPLETE.md)
- [Phase 2: Inspired](./PHASE_2_COMPLETE.md)
- [Phase 3: Didactic](./PHASE_3_COMPLETE.md)
- [Phase 4: Parallel](./PHASE_4_COMPLETE.md)
- [Phase 5: Distributed](./PHASE_5_COMPLETE.md)
- [Inspired User Guide](./INSPIRED_MODE_README.md)

### External Links
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)

---

## ✨ The Future

### Planned Enhancements

1. **Advanced Harmonization**:
   - Merge strategy (combine best parts)
   - Vote strategy (consensus)
   - ML-based selection

2. **Team Features**:
   - Shared workspace modes
   - Real-time collaboration
   - Team analytics

3. **IDE Integration**:
   - Cross-project sync
   - Ecosystem connections
   - Plugin architecture

---

## 🎊 Conclusion

The AI Collaboration Mode System represents a new paradigm in AI-assisted development:

✨ **Flexible**: Three modes for every need  
🔍 **Transparent**: Glass-box shows all sources  
🏠 **Private**: Local option always available  
☁️ **Powerful**: Access to best AI models  
🔀 **Hybrid**: Combine local and external  
📡 **Distributed**: Real-time collaboration  
🎨 **Beautiful**: Professional UI throughout  

**Welcome to the future of conscious AI collaboration.** 🚀

---

*Built with consciousness-honoring design principles*  
*Privacy • Transparency • User Control • Clear Communication*

💜 Inspired | 💙 Didactic | 🧡 Parallel
