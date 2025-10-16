# Security Fixes Log

This file tracks security vulnerabilities that have been addressed in this project.

## October 16, 2025 - Security Audit & Remediation

### Critical Vulnerabilities Fixed

#### GHSA-37j7-fg3j-429f, GHSA-qpm2-6cq5-7pq5: happy-dom VM Context Escape

- **Severity**: Critical
- **Package**: happy-dom
- **Version Range**: ≤20.0.1
- **Fixed Version**: 20.0.2
- **Impact**: Remote Code Execution through VM context escape
- **Status**: ✅ Fixed
- **PR/Commit**: Branch `security-fix-vulnerabilities`

### High Severity Vulnerabilities Fixed

#### GHSA-4hjh-wcwx-xvwj: axios DoS

- **Severity**: High
- **Package**: axios
- **Version Range**: 1.0.0 - 1.11.0
- **Impact**: Denial of Service through lack of data size check
- **Status**: ✅ Fixed via npm audit fix
- **PR/Commit**: Branch `security-fix-vulnerabilities`

#### GHSA-vj76-c3g6-qr5v: tar-fs Symlink Bypass

- **Severity**: High
- **Package**: tar-fs
- **Version Range**: 2.0.0 - 2.1.3
- **Impact**: Symlink validation bypass with predictable tarball
- **Status**: ✅ Fixed via npm audit fix
- **PR/Commit**: Branch `security-fix-vulnerabilities`

### Moderate Severity Vulnerabilities Fixed

#### GHSA-67mh-4wv8-2f99: esbuild Development Server

- **Severity**: Moderate
- **Package**: esbuild
- **Version Range**: ≤0.24.2
- **Fixed Version**: 0.25.9
- **Impact**: Development server can read responses from any website
- **Status**: ✅ Fixed via vite, drizzle-kit updates + npm override
- **PR/Commit**: Branch `security-fix-vulnerabilities`

### Known Issues (No Fix Available)

#### GHSA-gj5f-73vh-wpf7: cross-zip Directory Traversal

- **Severity**: High
- **Package**: cross-zip (via @electron-forge/maker-zip)
- **Impact**: Directory traversal through selective zip/unzip
- **Status**: ⚠️ No fix available (dev dependency only)
- **Mitigation**:
  - Only affects build process
  - Not exposed to end users
  - Build processes run in controlled environments
- **Tracking**: Monitoring upstream for patches
- **Last Checked**: October 16, 2025

---

## Security Audit Schedule

- **Last Full Audit**: October 16, 2025
- **Next Scheduled Audit**: November 16, 2025
- **Audit Frequency**: Monthly
- **Audit Command**: `npm audit`

## Security Contacts

For security issues, please see [SECURITY.md](../SECURITY.md)

---

## Verification

To verify current security status:

```bash
npm audit
```

Expected: 2 high severity (cross-zip, dev dependency only)
