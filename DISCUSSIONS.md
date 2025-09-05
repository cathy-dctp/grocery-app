# Discussions

## Known Issues

### Concurrency & Real-time Updates

- **Concurrent Editing**: If multiple users edit the same list simultaneously, race conditions may occur leading to inconsistent data. The app was originally built for single-user workflows and is not fully scaled for high-concurrency scenarios yet.
- **Live Updates**: Newly shared lists may not appear immediately and require page refresh. Real-time synchronization is not implemented.
- **Testing Recommendation**: Avoid having multiple users modify the same grocery list simultaneously as live updates are not supported.

### Authentication & Session Management

- **Login/Logout Issues**: Authentication may fail intermittently due to session token conflicts and browser cache issues.
- **Temporary Fix**: Clear browser site data and cache for the domain if experiencing login problems. Dev Tools -> Application -> Storage -> Clear Site Data

### Testing & CI/CD Status

- **Cypress E2E**: End-to-end testing with Cypress is not fully configured to verify complex scenarios.

### Production Limitations

- **Scaling**: The current architecture is suitable for one family but would need additional infrastructure for larger user bases.

## Wishlist Features

### Frontend & User Experience

- **Keyboard Shortcuts**: Implement keyboard navigation and shortcuts for managing lists and items (accessibility enhancement)
- **UI Feedback & Notifications**: Add toast notifications and loading states for creating/editing/deleting items and lists
- **Category Filtering**: Show/hide items by category on grocery lists
- **Additional Item Info Display**: Assign items to user for purchasing + display item added by username
- **Collapsible Sections**: Allow users to collapse or hide checked-off/bought items for cleaner view
- **Bulk Operations**: Select multiple items for batch delete, check-off, or category changes
- **Mobile UI Improvements**

### Backend & Data Management

- **Better API Error Handling**: Meaningful error messages and user-friendly communication
- **Soft Deletion**: Implement undo functionality for deleted grocery lists and items (trash/restore)
- **Live Updates**: Real-time synchronization when multiple users edit the same list simultaneously
- **Smart Suggestions**: ML-powered item recommendations based on user shopping patterns
- **Shopping Lists Templates**: Save frequently used lists as templates for quick reuse

### Authentication & User Management

- **Social Login**: Sign up/login with Google, Facebook OAuth providers
- **User Profiles**: Enhanced user profiles with preferences and settings
- **Role-based Sharing**: Different permission levels (view-only, edit, admin) for shared lists
- **Family Groups**: Organize users into family units with shared default lists

### Mobile & Accessibility

- **Native Mobile App**: iOS/Android apps with native performance
- **Barcode Scanning**: Quick item addition via camera barcode scanning

## Scaling Considerations

### Infrastructure & Architecture

- **Real-time Updates**: Implement WebSocket connections to fix live update issues for concurrent editing
- **Reverse Proxy**: Use nginx to serve static files and proxy API requests for better performance
- **CDN Integration**: Add CDN layer on top of nginx for global static file delivery and reduced latency
- **Microservices**: Break application into smaller, independent services for horizontal scaling
- **Load Balancing**: Distribute traffic across multiple application instances

### Deployment & Cloud Infrastructure

- **Enterprise Cloud Platforms**: Migrate from Railway to more mature services (GCP, AWS, Azure) for production-grade infrastructure
- **Current Limitation**: Present architecture is optimized for demo and easy setup, not enterprise scale

### Database & Data Management

- **Database Replicas & Backups**: Add read replicas to prevent corruption and enable disaster and backup recovery

### Performance & Reliability

- **Caching Layer**: Add caching for read only endpoints to improve performance
- **API Rate Limiting**: Implement proper rate limiting to prevent abuse and ensure service stability
- **Monitoring & Alerting**: Add monitoring with e.g.,Grafana

