# Security Policy

## Vulnerability Management

This document tracks known security vulnerabilities and the project's approach to managing them.

## Accepted Vulnerabilities

The following vulnerabilities have been reviewed and accepted with documented rationale:

### Development Dependencies Only

These vulnerabilities exist in development-time tooling and do not affect the runtime security of the application:

#### 1. cross-zip - Directory Traversal (HIGH)
- **CVE/Advisory**: [GHSA-gj5f-73vh-wpf7](https://github.com/advisories/GHSA-gj5f-73vh-wpf7)
- **Advisory ID**: 1108904
- **Affected Package**: `cross-zip` (via `@electron-forge/maker-zip`)
- **Severity**: High
- **Status**: No fix available
- **Reviewed**: 2025-10-12
- **Rationale**:
  - Affects only development-time build tooling (@electron-forge/maker-zip)
  - Not used in production/runtime code
  - No untrusted zip files are processed during normal development workflow
  - No fix available from upstream
  - Risk is minimal in controlled development environment
- **Mitigation**: Only process trusted zip files during development

#### 2. tmp - Symbolic Link Arbitrary Write (LOW)
- **CVE/Advisory**: [GHSA-52f5-9888-hmc6](https://github.com/advisories/GHSA-52f5-9888-hmc6)
- **Advisory ID**: 1106849
- **Affected Package**: `tmp` (via `@electron-forge/cli` → `@inquirer/prompts` → `@inquirer/editor` → `external-editor`)
- **Severity**: Low (CVSS 2.5)
- **Status**: Fix requires breaking changes (downgrade to @electron-forge/cli@7.8.3)
- **Reviewed**: 2025-10-12
- **Rationale**:
  - Affects only development-time CLI tooling
  - Not used in production/runtime code
  - Low severity (CVSS 2.5)
  - Fix requires breaking changes (major version downgrade)
  - Risk is minimal in controlled development environment
  - No evidence of exploitation in development contexts
- **Mitigation**: Use trusted development environment; monitor for upstream fixes

## Review Schedule

- Accepted vulnerabilities should be reviewed **quarterly** or when:
  - New versions of affected packages are released
  - Fixes become available
  - Threat landscape changes

**Next Review Date**: 2026-01-12

## Reporting Vulnerabilities

If you discover a security vulnerability in this project, please report it to the maintainers.

## Checking for New Vulnerabilities

Run `npm audit` to check for all vulnerabilities (including accepted ones).

To see only production vulnerabilities:
```bash
npm audit --omit=dev
```

Expected output: The vulnerabilities listed above will appear in `npm audit` results. New vulnerabilities should be investigated immediately.
