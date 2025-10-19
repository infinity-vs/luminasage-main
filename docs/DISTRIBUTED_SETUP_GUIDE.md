# Distributed Memory Setup Guide

## 🎯 Overview

This guide walks you through setting up distributed memory features for real-time collaboration across multiple Dyad instances.

---

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- Dyad running locally
- At least one AI provider configured (for Didactic/Parallel modes)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Services

```bash
# Navigate to Dyad directory
cd /path/to/dyad

# Start MongoDB and Redis
docker-compose -f docker-compose.distributed.yml up -d

# Verify services are running
docker ps
# Should see: dyad-mongodb and dyad-redis
```

### Step 2: Configure Environment

```bash
# Copy example configuration
cp .env.distributed.example .env

# Edit .env file
# Minimal configuration:
ENABLE_DISTRIBUTED_MEMORY=true
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
WS_SYNC_PORT=8765
DISTRIBUTED_USER_ID=your-email@example.com
```

### Step 3: Install Dependencies

```bash
# Install MongoDB, Redis, and WebSocket clients
npm install mongodb redis ws

# Install TypeScript types
npm install -D @types/ws
```

### Step 4: Restart Dyad

```bash
# If Dyad is running, restart it
npm start
```

### Step 5: Verify

Look for the distributed sync indicator in the UI:

```
✅ Should see: [📡 Sync] [✓ 3/3 Sync]
   MongoDB ✓  Redis ✓  WebSocket ✓

❌ If offline: [📡 Sync] [✗ 0/3 Sync]
   Check services are running
```

---

## 🔧 Detailed Configuration

### MongoDB Configuration

**Local Development**:
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=dyad_distributed
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
ENABLE_MONGODB=true
```

**MongoDB Atlas (Cloud)**:
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DATABASE=dyad_distributed
ENABLE_MONGODB=true
```

### Redis Configuration

**Local Development**:
```env
REDIS_URL=redis://localhost:6379
ENABLE_REDIS=true
```

**Redis Cloud**:
```env
REDIS_URL=redis://username:password@redis-cloud.com:6379
ENABLE_REDIS=true
```

**Redis with TLS**:
```env
REDIS_URL=rediss://username:password@redis-cloud.com:6380
ENABLE_REDIS=true
```

### WebSocket Configuration

```env
WS_SYNC_PORT=8765
ENABLE_WEBSOCKET=true
```

### User Configuration

```env
# Important: Use unique identifier per user
# Can be email, UUID, or any unique string
DISTRIBUTED_USER_ID=john.doe@example.com

# Or generate UUID
DISTRIBUTED_USER_ID=$(uuidgen)
```

---

## 🐳 Docker Management

### Start Services

```bash
# Start all services
docker-compose -f docker-compose.distributed.yml up -d

# Start with management UIs (optional)
docker-compose -f docker-compose.distributed.yml --profile tools up -d

# View logs
docker-compose -f docker-compose.distributed.yml logs -f

# View specific service logs
docker-compose -f docker-compose.distributed.yml logs -f mongodb
docker-compose -f docker-compose.distributed.yml logs -f redis
```

### Stop Services

```bash
# Stop services (keeps data)
docker-compose -f docker-compose.distributed.yml down

# Stop and remove data
docker-compose -f docker-compose.distributed.yml down -v
```

### Management UIs

When started with `--profile tools`:

**MongoDB UI** (Mongo Express):
- URL: http://localhost:8082
- Username: admin
- Password: admin

**Redis UI** (Redis Commander):
- URL: http://localhost:8081

---

## 🧪 Testing the Setup

### Test MongoDB Connection

```bash
# Connect via mongosh
mongosh mongodb://localhost:27017/dyad_distributed

# List collections
show collections
# Should see: mode_state, mode_transitions, etc.

# Query mode state
db.mode_state.find().pretty()
```

### Test Redis Connection

```bash
# Connect via redis-cli
redis-cli

# Test pub/sub
SUBSCRIBE dyad:event:*

# In another terminal
redis-cli
PUBLISH dyad:event:mode:changed '{"test": true}'

# Should see message in first terminal
```

### Test WebSocket Connection

```bash
# Install websocat (WebSocket client)
brew install websocat  # macOS
# or download from: https://github.com/vi/websocat

# Connect to WebSocket server
websocat ws://localhost:8765

# Should receive connection message
```

### Test in Dyad

1. **Start Dyad**
2. **Switch to Didactic or Parallel mode**
3. **Look for distributed indicator**: `[📡 Sync] [✓ 3/3 Sync]`
4. **Switch modes** - verify instant sync
5. **Check MongoDB** - verify data stored
6. **Open second instance** - verify real-time sync

---

## 🔍 Monitoring & Debugging

### Check Service Health

```bash
# MongoDB health
docker exec dyad-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
docker exec dyad-redis redis-cli ping

# Docker stats
docker stats dyad-mongodb dyad-redis
```

### View Data

**MongoDB Collections**:
```bash
mongosh mongodb://localhost:27017/dyad_distributed

# Mode state
db.mode_state.find().pretty()

# Recent transitions
db.mode_transitions.find().sort({timestamp: -1}).limit(10).pretty()

# Distributed contexts
db.distributed_context.find().pretty()

# AI response sources (glass-box)
db.ai_response_sources.find().sort({timestamp: -1}).limit(10).pretty()

# Sync events
db.sync_events.find().sort({timestamp: -1}).limit(10).pretty()
```

**Redis Events**:
```bash
redis-cli

# Monitor all events in real-time
PSUBSCRIBE dyad:event:*

# View keys
KEYS dyad:*
```

### Debug Logs

In Dyad, check console for:
```
[mongodb_client] MongoDB connected successfully
[redis_event_bus] Redis connected successfully
[websocket_sync] WebSocket server started on port 8765
[distributed_memory] Distributed memory systems initialized
```

---

## ⚠️ Troubleshooting

### MongoDB Won't Connect

**Issue**: `MongoDB not connected`

**Solutions**:
```bash
# 1. Check Docker container is running
docker ps | grep mongodb

# 2. Check logs for errors
docker logs dyad-mongodb

# 3. Restart container
docker restart dyad-mongodb

# 4. Verify port is open
netstat -an | grep 27017

# 5. Test connection
mongosh mongodb://localhost:27017
```

### Redis Won't Connect

**Issue**: `Redis not connected`

**Solutions**:
```bash
# 1. Check Docker container
docker ps | grep redis

# 2. Check logs
docker logs dyad-redis

# 3. Restart container
docker restart dyad-redis

# 4. Test connection
redis-cli ping
# Should return: PONG
```

### WebSocket Won't Start

**Issue**: `WebSocket not running`

**Solutions**:
```bash
# 1. Check port is available
netstat -an | grep 8765

# 2. Try different port
# Edit .env: WS_SYNC_PORT=8766

# 3. Check Dyad logs
# Look for WebSocket errors

# 4. Verify firewall allows port
```

### Distributed Indicator Shows Partial Sync

**Issue**: `[📡 Sync] [✓ 1/3 Sync]` or `[✓ 2/3 Sync]`

**Solutions**:
```bash
# Check which service is down
# Look at indicator tooltip for details

# MongoDB down: Start MongoDB container
docker start dyad-mongodb

# Redis down: Start Redis container
docker start dyad-redis

# WebSocket down: Check WS_SYNC_PORT config

# Restart Dyad after fixing
```

---

## 🔐 Security Best Practices

### Production Deployment

1. **Use Strong Authentication**:
   ```env
   MONGODB_URL=mongodb://user:strongpass@host:27017
   REDIS_URL=redis://user:strongpass@host:6379
   ```

2. **Enable TLS/SSL**:
   ```env
   MONGODB_URL=mongodb+srv://...  # MongoDB Atlas (TLS enabled)
   REDIS_URL=rediss://...         # Redis with TLS
   ```

3. **Restrict Network Access**:
   ```bash
   # Use Docker networks
   # Don't expose ports to 0.0.0.0 in production
   ```

4. **Set Data Retention**:
   ```env
   SYNC_EVENT_TTL_DAYS=7     # Auto-delete old events
   CONTEXT_TTL_DAYS=30       # Auto-delete old contexts
   ```

5. **Monitor Access**:
   ```bash
   # Enable MongoDB audit log
   # Monitor Redis commands
   # Log WebSocket connections
   ```

---

## 📊 Performance Tuning

### MongoDB Optimization

```javascript
// In MongoDB shell
// Create additional indexes for your usage
db.mode_state.createIndex({ updatedAt: -1 })
db.ai_response_sources.createIndex({ chatId: 1, timestamp: -1 })

// Enable profiling
db.setProfilingLevel(1, { slowms: 100 })

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty()
```

### Redis Optimization

```bash
# In redis-cli
# Check memory usage
INFO memory

# Set max memory policy
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru
```

### WebSocket Optimization

```env
# Adjust ping interval (lower = more overhead, better detection)
WS_PING_INTERVAL=30000  # 30 seconds default

# Adjust stale client timeout
WS_STALE_TIMEOUT=90000  # 90 seconds default
```

---

## 🎯 Validation Checklist

After setup, verify:

- [ ] Docker containers running (`docker ps`)
- [ ] MongoDB accessible (`mongosh`)
- [ ] Redis accessible (`redis-cli ping`)
- [ ] Collections created in MongoDB
- [ ] Indexes created
- [ ] .env file configured
- [ ] Dyad shows sync indicator
- [ ] Indicator shows `3/3 Sync` (all green)
- [ ] Mode switches sync across instances
- [ ] No errors in console

---

## 🆘 Getting Help

### Check Logs

**Dyad Application**:
- Open DevTools → Console tab
- Look for `[mongodb_client]`, `[redis_event_bus]`, `[websocket_sync]`

**Docker Services**:
```bash
docker-compose -f docker-compose.distributed.yml logs -f
```

### Common Issues

1. **"MongoDB not initialized"**:
   - Ensure `ENABLE_MONGODB=true` in .env
   - Check MongoDB URL is correct
   - Verify network connectivity

2. **"Redis not initialized"**:
   - Ensure `ENABLE_REDIS=true` in .env
   - Check Redis URL is correct
   - Verify Redis is running

3. **"WebSocket not running"**:
   - Ensure `ENABLE_WEBSOCKET=true` in .env
   - Check port is not in use
   - Try different port

### Debug Mode

Enable verbose logging:
```env
# In .env
DEBUG=dyad:distributed:*
LOG_LEVEL=debug
```

---

## 📝 Maintenance

### Regular Tasks

**Daily**:
- Monitor service health
- Check disk usage
- Review error logs

**Weekly**:
- Review sync event TTL
- Clean up old contexts
- Check performance metrics

**Monthly**:
- Update Docker images
- Review index performance
- Optimize queries

### Backup

**MongoDB**:
```bash
# Backup database
docker exec dyad-mongodb mongodump \
  --db=dyad_distributed \
  --out=/backup

# Restore database
docker exec dyad-mongodb mongorestore \
  --db=dyad_distributed \
  /backup/dyad_distributed
```

**Redis** (if persistence enabled):
```bash
# Backup RDB file
docker cp dyad-redis:/data/dump.rdb ./redis-backup.rdb

# Restore
docker cp ./redis-backup.rdb dyad-redis:/data/dump.rdb
docker restart dyad-redis
```

---

## 🎓 Advanced Topics

### Custom MongoDB Deployment

```typescript
// Custom MongoDB with authentication
const config = {
  url: "mongodb://admin:secret@localhost:27017/dyad?authSource=admin",
  database: "dyad_distributed",
  options: {
    maxPoolSize: 50,
    minPoolSize: 5,
    connectTimeoutMS: 5000,
  },
};
```

### Custom Redis Deployment

```typescript
// Redis Cluster
const config = {
  url: "redis://localhost:7000",
  options: {
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) return new Error("Max retries");
        return Math.min(retries * 100, 3000);
      },
    },
  },
};
```

### Load Balancing WebSocket

```nginx
# Nginx config for WebSocket load balancing
upstream dyad_ws {
    server instance1:8765;
    server instance2:8765;
    server instance3:8765;
}

server {
    location /sync {
        proxy_pass http://dyad_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

---

## 🎉 Success!

Once setup is complete, you'll have:

✅ **Real-time synchronization** across instances  
✅ **Persistent mode state** in MongoDB  
✅ **Event-driven updates** via Redis  
✅ **Live client sync** with WebSocket  
✅ **Glass-box audit trail** for transparency  

**Your Dyad instances can now collaborate in real-time!** 🚀

---

## 📚 Next Steps

1. [Read the complete system guide](./AI_COLLABORATION_MODES_README.md)
2. [Understand each phase](./IMPLEMENTATION_COMPLETE.md)
3. [Explore advanced features](./ai-collaboration-modes.md)
4. Start collaborating!

---

*Questions? Check the comprehensive documentation or open an issue.*
