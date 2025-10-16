# Security Audit Report

**Date:** October 16, 2025  
**Project:** Dyad v0.25.0-beta.1

## Summary

This document outlines the security vulnerabilities found and remediated in the Dyad project. The project has been significantly hardened from the initial state.

### Initial State

- **10 vulnerabilities** (5 moderate, 4 high, 1 critical)

### Current State

- **2 high vulnerabilities** (both in dev dependencies, limited exposure)

---

## Vulnerabilities Fixed ✅

### 1. ✅ CRITICAL: happy-dom VM Context Escape (RCE)

- **CVE:** GHSA-37j7-fg3j-429f, GHSA-qpm2-6cq5-7pq5
- **Severity:** Critical
- **Impact:** Remote Code Execution through VM context escape
- **Fix:** Updated `happy-dom` from `17.6.3` to `20.0.2`
- **Status:** ✅ RESOLVED

### 2. ✅ HIGH: axios DoS Attack

- **CVE:** GHSA-4hjh-wcwx-xvwj
- **Severity:** High
- **Impact:** Denial of Service through lack of data size check
- **Fix:** Updated via `npm audit fix`
- **Status:** ✅ RESOLVED

### 3. ✅ HIGH: tar-fs Symlink Validation Bypass

- **CVE:** GHSA-vj76-c3g6-qr5v
- **Severity:** High
- **Impact:** Symlink validation bypass with predictable destination
- **Fix:** Updated via `npm audit fix`
- **Status:** ✅ RESOLVED

### 4. ✅ MODERATE: esbuild Development Server Vulnerability

- **CVE:** GHSA-67mh-4wv8-2f99
- **Severity:** Moderate
- **Impact:** Development server could read responses from any website
- **Fix:**
  - Updated `vite` to `7.1.10`
  - Updated `drizzle-kit` to `0.31.5`
  - Added npm override for `esbuild@^0.25.9`
- **Status:** ✅ RESOLVED

---

## Remaining Vulnerabilities ⚠️

### 1. ⚠️ HIGH: cross-zip Directory Traversal

- **CVE:** GHSA-gj5f-73vh-wpf7
- **Severity:** High
- **Package:** `cross-zip` (via `@electron-forge/maker-zip`)
- **Impact:** Directory traversal through selective zip/unzip operations
- **Status:** ⚠️ NO FIX AVAILABLE

#### Risk Assessment

- **Exposure:** Build-time only (dev dependency)
- **Usage:** Only used during `npm run package` and `npm run make` for macOS builds
- **Mitigation:**
  - Not exposed to end users
  - Only runs in controlled build environment
  - Does not process untrusted input during normal development

#### Recommended Actions

1. Monitor for updates to `@electron-forge/maker-zip`
2. Consider alternative packaging solutions if vulnerability is exploited in the wild
3. Ensure build pipelines run in isolated, secure environments
4. Review periodically: `npm audit`

---

## Electron Security Configuration ✅

The application follows Electron security best practices:

### ✅ Context Isolation

```typescript
webPreferences: {
  contextIsolation: true,  // ✅ ENABLED
}
```

### ✅ Node Integration

```typescript
webPreferences: {
  nodeIntegration: false,  // ✅ DISABLED
}
```

### ✅ Preload Script with Channel Allowlisting

The preload script (`src/preload.ts`) implements a strict allowlist for IPC channels:

- `validInvokeChannels`: ~130 explicitly allowed channels
- `validReceiveChannels`: 11 explicitly allowed channels
- Any attempt to use unlisted channels throws an error

### ✅ Security Fuses

```typescript
[FuseV1Options.RunAsNode]: false,
[FuseV1Options.EnableCookieEncryption]: true,
[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
[FuseV1Options.OnlyLoadAppFromAsar]: true,
```

---

## Recommendations

### Immediate Actions

None required - all actionable vulnerabilities have been resolved.

### Ongoing Security Practices

1. **Regular Audits:** Run `npm audit` before each release
2. **Dependency Updates:** Keep dependencies updated monthly
3. **Monitor cross-zip:** Watch for fixes to the remaining vulnerability
4. **Build Security:** Ensure packaging/build processes run in secure environments
5. **Security Scanning:** Consider integrating automated security scanning in CI/CD

### Development Guidelines

- Never disable `contextIsolation` or enable `nodeIntegration`
- Always validate and sanitize IPC message payloads
- Keep the preload script allowlist minimal and explicit
- Review new dependencies for security issues before adding

---

## Version History

| Date             | Vulnerabilities                     | Notes                            |
| ---------------- | ----------------------------------- | -------------------------------- |
| October 16, 2025 | 2 high (dev only)                   | Initial security audit and fixes |
| Previous         | 10 (1 critical, 4 high, 5 moderate) | Before security improvements     |

---

## Verification

To verify the current security status:

```bash
npm audit
```

Expected output: 2 high severity vulnerabilities (both `cross-zip` related, dev dependencies only)
