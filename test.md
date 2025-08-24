# Online Tools Portal

A production-ready web application providing essential developer utilities including URL encoding, Base64 conversion, JSON processing, hash generation, and a secure online clipboard service.

## 🚀 Features

### Core Tools
- **URL Encode/Decode** - Safe URL encoding with validation
- **Base64 Encode/Decode** - Standard and URL-safe Base64 conversion
- **JSON Escape/Unescape** - Safe JSON string processing with formatting
- **Hash Generator** - MD5, SHA-1, SHA-256, SHA-512 hash generation
- **Secure Online Clipboard** - Encrypted text sharing with codes

### Security Features
- AES-256-GCM encryption for clipboard data
- Optional PIN protection for clipboard notes
- Rate limiting and DOS protection
- Input validation and sanitization
- Secure headers with Helmet.js

### Modern Web Features
- Progressive Web App (PWA) support
- Responsive design with dark theme
- Offline functionality for static tools
- Real-time TTL countdown
- Copy-to-clipboard functionality
- Keyboard shortcuts (Ctrl/Cmd + Enter)

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Framer Motion** for animations
- **Axios** for API communication

### Backend  
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Zod** for request validation
- **bcrypt** for PIN hashing
- **Pino** for structured logging

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-tools-portal
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   
   **Backend (.env)**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/onlinetools
   CORS_ORIGIN=http://localhost:5173
   CLIPBOARD_SECRET=your-32-byte-hex-key-here-64-characters-long
   PIN_ROUNDS=10
   ```

   **Frontend (.env)**:
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   
   Edit `frontend/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_ENABLE_ADS=false
   ```

4. **Generate Encryption Key**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Start Development Servers**
   ```bash
   npm run dev
   ```

   This runs both frontend (http://localhost:5173) and backend (http://localhost:8080) concurrently.

### Development Commands

```bash
# Start both servers
npm run dev

# Start individual services
npm run dev:frontend
npm run dev:backend

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Seed database with sample data
cd backend && npm run seed
```

## 📊 API Documentation

Visit http://localhost:8080/docs for interactive Swagger documentation.

### Key Endpoints

**Clipboard API**:
- `POST /api/clipboard` - Create encrypted note
- `POST /api/clipboard/retrieve` - Retrieve with code/PIN
- `DELETE /api/clipboard/:code` - Delete note

**Tools API**:
- `POST /api/tools/url-encode` - URL encode text
- `POST /api/tools/base64-encode` - Base64 encode
- `POST /api/tools/hash` - Generate hash

**System**:
- `GET /healthz` - Health check
- `POST /metrics` - Anonymous telemetry

## 🔐 Security Implementation

### Encryption
- **AES-256-GCM** encryption for clipboard text
- Random IV per note for security
- Authentication tags for integrity
- Server-side encryption at rest

### Access Control
- Rate limiting (100 req/min global, 10 clipboard/15min)
- PIN protection with bcrypt hashing
- Limited read attempts (max 3)
- Automatic expiration (15m to 7d)

### Input Validation
- Zod schemas for all requests
- Size limits (50KB clipboard, 1MB requests)
- Unicode normalization
- XSS prevention with text-only rendering

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. **Prepare for deployment**:
   ```bash
   cd backend
   npm run build
   ```

2. **Environment Variables**:
   Set these in your deployment platform:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod
   CORS_ORIGIN=https://your-frontend-domain.com
   CLIPBOARD_SECRET=your-production-secret-key
   PORT=8080
   ```

3. **Deploy to Railway**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway link
   railway up
   ```

### Frontend Deployment (Vercel)

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Environment Variables in Vercel**:
   ```env
   VITE_API_BASE_URL=https://your-backend.railway.app
   VITE_ENABLE_ADS=true
   VITE_GOOGLE_ADS_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
   ```

## 📱 Google AdSense Integration

1. **Create AdSense Account**:
   - Sign up at https://adsense.google.com
   - Get your publisher ID (ca-pub-xxxxxxxxxxxxxxxx)

2. **Configure Environment**:
   ```env
   VITE_ENABLE_ADS=true
   VITE_GOOGLE_ADS_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
   ```

3. **Ad Placement**:
   - Auto ads load globally in production
   - Manual ad slots via `<GoogleAdSlot>` component
   - Responsive ad units

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                  # Run all tests
npm run test:coverage    # Coverage report
```

### Test Categories
- Unit tests for services
- Integration tests for API endpoints
- Security tests for encryption/decryption
- Rate limiting tests

### Example Tests
```typescript
// Clipboard service tests
describe('Clipboard Service', () => {
  test('creates encrypted note with unique code', async () => {
    const result = await createClipboardNote({
      text: 'test content',
      expiresIn: '1h',
      createdIp: '127.0.0.1'
    });
    
    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.expiresAt).toBeDefined();
  });
});
```

## 📈 Performance & Monitoring

### Metrics
- Page views and interactions tracked
- Anonymous telemetry via `navigator.sendBeacon`
- Error tracking with structured logging

### Optimization
- Static asset caching
- Gzip compression
- MongoDB indexes for performance
- Connection pooling
- Rate limiting for DOS protection

## 🔧 Configuration

### MongoDB Indexes
```javascript
// Automatically created indexes
- code: unique index for fast lookups
- expiresAt: TTL index for auto-cleanup
- createdAt: for administrative queries
```

### Rate Limits
```javascript
// Global: 100 requests/minute
// Clipboard: 10 operations/15 minutes  
// Retrieval: 5 attempts per code+IP/10 minutes
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript for all new code
- ESLint + Prettier for formatting
- Zod for API validation
- Structured logging with Pino
- Comprehensive error handling

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- 📖 Documentation: `/docs` endpoint for API docs
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

Built with ❤️ using React, Node.js, and MongoDB