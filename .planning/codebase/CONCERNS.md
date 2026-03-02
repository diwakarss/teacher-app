# Concerns & Risks — Teacher Assistant PWA

## Technical Risks

### 1. sql.js Bundle Size

**Risk**: sql.js WASM binary is ~1MB, may impact initial load

**Mitigation**:
- Lazy load sql.js after app shell renders
- Use dynamic import with loading state
- Cache WASM in service worker

```typescript
// Lazy load pattern
const loadDatabase = async () => {
  const initSqlJs = (await import('sql.js')).default;
  // ...
};
```

### 2. IndexedDB Persistence

**Risk**: Data loss if IndexedDB cleared (user clears browser data)

**Mitigation**:
- Warn user about local-only storage
- Add export/backup feature in Phase 4
- Consider periodic localStorage backup of critical data

### 3. Service Worker Complexity

**Risk**: PWA caching can cause stale content issues

**Mitigation**:
- Use Workbox with stale-while-revalidate for assets
- Network-first for API calls
- Clear version-based cache on updates

### 4. Mobile Performance

**Risk**: sql.js queries may be slow on older mobile devices

**Mitigation**:
- Index frequently queried columns
- Paginate large result sets
- Use web workers for heavy queries

## UX Risks

### 1. Offline State Confusion

**Risk**: User may not realize they're offline

**Mitigation**:
- Clear offline indicator in UI
- Disable AI features with explanation when offline
- Queue actions that require network

### 2. Data Entry Speed

**Risk**: Marks entry may be slow for 30+ students

**Mitigation**:
- Keyboard-navigable grid interface
- Tab between fields
- Auto-save on field blur
- Bulk import option

## Business Risks

### 1. IGCSE Grade Accuracy

**Risk**: Incorrect grade boundaries affect trust

**Mitigation**:
- Research official IGCSE boundaries
- Make boundaries configurable
- Unit test all boundary cases

### 2. Feedback Quality

**Risk**: Template feedback may feel generic

**Mitigation**:
- Multiple template variations
- Include specific data points (scores, trends)
- Claude API for enhanced mode

## Security Considerations

### 1. Student Data Privacy

**Risk**: PII stored on device

**Mitigation**:
- Local-only storage (no cloud in Phase 1)
- No analytics that include student data
- Clear data export/delete options

### 2. API Key Exposure

**Risk**: Claude API key exposed in client

**Mitigation**:
- Proxy API calls through Next.js API routes
- Environment variable for key
- Rate limiting on API route

## Open Questions

1. Should we support data export before Phase 4?
2. What happens when database grows large (1000+ students over years)?
3. Should there be a "demo mode" with sample data?

---
*Concerns tracked for Phase 1 development*
