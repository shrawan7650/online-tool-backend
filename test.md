# Online Tools Portal

A comprehensive, production-ready web application providing essential developer utilities, AI-powered tools, and advanced features with a freemium subscription model.

## 🚀 Features Overview

### 🔧 **Core Utilities**
- **URL Encode/Decode** - Safe URL encoding with validation
- **Base64 Encode/Decode** - Standard and URL-safe Base64 conversion  
- **JSON Escape/Unescape** - Safe JSON string processing with formatting
- **Hash Generator** - MD5, SHA-1, SHA-256, SHA-512 hash generation
- **File Hash Online** - Generate hashes for uploaded files with drag & drop
- **Password Generator** - Advanced password generation with strength analysis and history

### 📁 **File Management**
- **File Sharing** - Upload to Cloudinary with expiry rules (5min auto-delete, configurable expiry)
- **Secure Online Clipboard** - AES-256-GCM encrypted text sharing with codes and PIN protection
- **Time-Locked Sharing** - Schedule content to unlock at specific date/time

### 🎨 **Developer Tools**
- **Code Minifiers** - Compress HTML, CSS, JavaScript, and JSON code
- **Markdown Editor** - Write Markdown with live preview and HTML export
- **Code Snippet Designer** - Create beautiful code screenshots with syntax highlighting
- **Escape Toolkit** - String escape/unescape for multiple programming languages
- **QR Code Generator** - Advanced QR code generation with 9 types:
  - URL, Text, vCard/Contact, Email, Phone & SMS
  - Wi-Fi, UPI Payment, Social Media, Custom with logo

### 📝 **Productivity Tools**
- **Tiny Notes** - Quick note-taking with cloud sync (Pro) or local storage (Free)
- **AI Prompt Saver** - Save and organize AI prompts with cloud sync
- **Text Formatter** - Format and clean text content
- **Color Picker** - Advanced color picker with palette saving

### 🤖 **AI-Powered Features** (Pro/Max Pro)
- **AI Tool Hub** - Comprehensive AI tools directory
- **Text-to-Speech** - Multiple voices and unlimited characters
- **Prompt Templates** - Full library of AI-generated templates
- **Prompt Analyzer** - AI-powered suggestions for improvement
- **Daily Challenge** - Daily AI challenges with leaderboard

## 💳 **Subscription Tiers**

### **Free Tier**
- Basic access to core utilities
- Local storage for notes and data
- Limited AI features (1 voice, 250 chars for TTS)
- 5 prompt saves maximum
- Standard QR codes only

### **Pro Tier (₹199/month)**
- Full access to all tools and features
- Cloud sync across devices
- Unlimited AI features and voices
- Advanced QR codes with customization
- Password history and analytics
- Export capabilities
- Priority support

### **Max Pro Tier (₹299/month)**
- Everything in Pro
- Advanced analytics and insights
- Custom branding options
- API access for integrations
- White-label solutions
- Dedicated support
- Early access to new features

## 🔐 **Security & Authentication**

### **Authentication System**
- **Google OAuth 2.0** - Secure, passwordless authentication
- **JWT Session Management** - 7-day token expiry with refresh
- **Protected Routes** - Feature-based access control
- **Subscription Middleware** - Automatic tier verification

### **Data Security**
- **AES-256-GCM Encryption** - For clipboard and sensitive data
- **bcrypt PIN Hashing** - Secure PIN protection
- **Rate Limiting** - DOS protection and abuse prevention
- **Input Validation** - Comprehensive Zod schemas
- **CORS & Helmet** - Security headers and cross-origin protection

### **Payment Security**
- **Razorpay Integration** - Secure payment processing
- **Webhook Verification** - Real-time subscription updates
- **Subscription Management** - Automatic renewal and cancellation
- **Payment History** - Transparent billing records

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for responsive styling
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Framer Motion** for animations
- **Axios** for API communication

### **Backend Stack**
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Passport.js** for authentication
- **Zod** for request validation
- **Pino** for structured logging
- **Cloudinary** for file storage

### **Database Models**
```typescript
// User Model
{
  googleId: string,
  email: string,
  name: string,
  profilePicture: string,
  isPro: boolean,
  isMaxPro: boolean,
  subscriptionStatus: 'active' | 'cancelled' | 'expired',
  subscriptionExpiry: Date
}

// Notes Model (Pro Feature)
{
  userId: ObjectId,
  title: string,
  content: string,
  tags: string[],
  createdAt: Date,
  updatedAt: Date
}

// Clipboard Model
{
  code: string,
  textEnc: Buffer,
  iv: Buffer,
  authTag: Buffer,
  pinHash?: string,
  expiresAt: Date,
  remainingReads: number
}
```

## 🚀 **Development Setup**

### **Prerequisites**
- Node.js 18+
- MongoDB (local or Atlas)
- Google OAuth credentials
- Razorpay account
- Cloudinary account

### **Installation**

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd online-tools-portal
   npm run install:all
   ```

2. **Environment Configuration**
   
   **Backend (.env)**:
   ```env
   NODE_ENV=development
   PORT=8080
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/onlinetools
   CORS_ORIGIN=http://localhost:5173
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Payments
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   RAZORPAY_PRO_PLAN_ID=plan_xxxxxxxxxxxxxxxx
   RAZORPAY_MAX_PRO_PLAN_ID=plan_xxxxxxxxxxxxxxxx
   
   # Encryption
   CLIPBOARD_SECRET=your-32-byte-hex-key-here
   PIN_ROUNDS=10
   
   # File Storage
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

   **Frontend (.env)**:
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
   VITE_ENABLE_ADS=false
   VITE_GOOGLE_ADS_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
   ```

3. **Start Development**
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

### **Available Scripts**
```bash
npm run dev              # Start both servers concurrently
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only
npm run build           # Build frontend for production
npm run start           # Start production backend
npm test                # Run backend tests
npm run lint            # Lint both projects
npm run format          # Format code with Prettier
```

## 📊 **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### **Subscription Endpoints**
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/create` - Create subscription
- `POST /api/subscription/verify` - Verify payment
- `GET /api/subscription/status` - Get subscription status
- `POST /api/subscription/cancel` - Cancel subscription

### **Tools Endpoints**
- `POST /api/tools/url-encode` - URL encode text
- `POST /api/tools/base64-encode` - Base64 encode
- `POST /api/tools/hash` - Generate hash
- `POST /api/clipboard` - Create clipboard note
- `POST /api/clipboard/retrieve` - Retrieve clipboard note

### **Pro Features Endpoints**
- `GET /api/notes` - Get user notes (Pro)
- `POST /api/notes` - Create note (Pro)
- `PUT /api/notes/:id` - Update note (Pro)
- `DELETE /api/notes/:id` - Delete note (Pro)

Visit `http://localhost:8080/docs` for interactive Swagger documentation.

## 🌐 **Deployment**

### **Frontend Deployment (Vercel)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

**Environment Variables**:
```env
VITE_API_BASE_URL=https://your-backend.railway.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
VITE_ENABLE_ADS=true
VITE_GOOGLE_ADS_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
```

### **Backend Deployment (Railway)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd backend
railway login
railway link
railway up
```

**Environment Variables**:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/prod
CORS_ORIGIN=https://your-frontend-domain.vercel.app
JWT_SECRET=your-production-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-production-key-secret
CLIPBOARD_SECRET=your-production-encryption-key
```

## 🧪 **Testing**

### **Backend Tests**
```bash
cd backend
npm test                 # Run all tests
npm run test:coverage   # Coverage report
```

**Test Categories**:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Authentication and authorization tests
- Payment and subscription flow tests
- Security and encryption tests

### **Example Test**
```typescript
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

## 📈 **Performance & Monitoring**

### **Frontend Optimizations**
- **Code Splitting** - Route-based lazy loading
- **PWA Support** - Service worker and offline capabilities
- **Image Optimization** - WebP format and lazy loading
- **Bundle Analysis** - Webpack bundle analyzer
- **Caching Strategy** - Static assets and API responses

### **Backend Optimizations**
- **Database Indexing** - Optimized MongoDB queries
- **Connection Pooling** - Efficient database connections
- **Rate Limiting** - Prevent abuse and DOS attacks
- **Compression** - Gzip compression for responses
- **Logging** - Structured logging with Pino

### **Monitoring**
- **Health Checks** - `/healthz` endpoint
- **Metrics Collection** - Anonymous usage analytics
- **Error Tracking** - Comprehensive error logging
- **Performance Monitoring** - Response time tracking

## 🔧 **Configuration**

### **MongoDB Indexes**
```javascript
// Automatically created indexes
- User: { googleId: 1 }, { email: 1 }
- ClipboardNote: { code: 1 }, { expiresAt: 1 }
- Note: { userId: 1, updatedAt: -1 }
- Subscription: { userId: 1, status: 1 }
```

### **Rate Limits**
```javascript
// Global: 100 requests/minute
// Clipboard: 10 operations/15 minutes
// File Upload: 5 uploads/15 minutes
// Authentication: 5 attempts/10 minutes
```

## 🎨 **UI/UX Features**

### **Design System**
- **Dark Theme** - Professional slate color palette
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2.1 AA compliance
- **Animations** - Smooth transitions and micro-interactions
- **Loading States** - Professional loading indicators

### **User Experience**
- **Progressive Enhancement** - Works without JavaScript
- **Offline Support** - PWA capabilities
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Real-time feedback
- **Keyboard Navigation** - Full keyboard accessibility

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### **Code Standards**
- TypeScript for all new code
- ESLint + Prettier for formatting
- Comprehensive error handling
- Unit tests for new features
- Documentation for public APIs

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

- 📖 **Documentation**: `/docs` endpoint for API docs
- 🐛 **Issues**: GitHub Issues for bug reports
- 💬 **Discussions**: GitHub Discussions for questions
- 📧 **Email**: support@onlinetools.com
- 📞 **Phone**: +1 (555) 123-4567 (Pro/Max Pro users)

## 🎯 **Roadmap**

### **Upcoming Features**
- [ ] AI Code Generator
- [ ] Advanced Analytics Dashboard
- [ ] Team Collaboration Features
- [ ] Mobile App (React Native)
- [ ] API Rate Limiting Dashboard
- [ ] Custom Domain Support
- [ ] Webhook Integrations
- [ ] Advanced Export Options

### **Performance Improvements**
- [ ] Redis Caching Layer
- [ ] CDN Integration
- [ ] Database Sharding
- [ ] Microservices Architecture
- [ ] GraphQL API
- [ ] Real-time Collaboration

---

**Built with ❤️ using React, Node.js, MongoDB, and modern web technologies**

For detailed setup instructions, API documentation, and deployment guides, visit our [documentation site](https://docs.onlinetools.com).