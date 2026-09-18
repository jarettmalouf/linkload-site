# Server Startup Troubleshooting

## Quick Start

```bash
source ~/.nvm/nvm.sh && nvm use 22
npm run dev
```

## Known Issues & Fixes

### 1. Server hangs on "Starting..." or exits silently

**Symptoms:**
- `npm run dev` prints `> next dev` but never shows "Ready"
- curl to localhost:3000 times out or returns 000
- No error messages displayed

**Root Cause:** Node version incompatibility. `@supabase/supabase-js@2.116.0` requires Node >= 22.

**Fix:**
```bash
source ~/.nvm/nvm.sh && nvm use 22
rm -rf node_modules .next
npm install
npm run dev
```

### 2. Multiple Next.js processes causing conflicts

**Symptoms:**
- Port 3000 appears busy but nothing responds
- Multiple `next dev` processes in `ps aux`

**Fix:**
```bash
pkill -9 -f "next"
lsof -ti:3000 | xargs kill -9 2>/dev/null
npm run dev
```

### 3. Stale cache causing compilation issues

**Symptoms:**
- Server starts but pages don't load correctly
- Old code appears to be running

**Fix:**
```bash
rm -rf .next node_modules/.cache
npm run dev
```

## Environment Requirements

| Requirement | Value |
|-------------|-------|
| Node.js | >= 22.0.0 (see `.nvmrc`) |
| npm | 10.x |

## Key Dependencies with Node Requirements

- `@supabase/supabase-js@2.116.0` — requires Node >= 22
- `next@14.2.x` — works with Node 18-24

## Verification Commands

```bash
# Check Node version
node --version  # Should be v22.x.x

# Check if server is responding
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# Check for running Next processes
ps aux | grep "next" | grep -v grep

# Check what's using port 3000
lsof -i :3000
```
