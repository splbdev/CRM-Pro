# 🚀 Open Source CRM - Complete Business Management Platform

A **comprehensive, self-hosted Client Relationship Management (CRM)** solution built for freelancers, agencies, and small businesses. Manage clients, track time, handle invoices, manage projects, and streamline your entire workflow with this full-stack web application.

[![Support via Stripe](https://img.shields.io/badge/Support-Stripe-blue)](https://buy.stripe.com/3cI28se757NL7Xn87vcfK04)

## ✨ Complete Feature Set

### 👥 **Client & Lead Management**
- Centralized client database with unlimited contacts
- Lead tracking with scoring and source attribution
- Lead-to-client conversion workflow
- Activity timeline per client
- Smart search and filtering

### 💰 **Financial Management**
- Professional invoice generator with itemization
- Recurring billing (weekly, monthly, annual)
- Multi-currency support
- Estimates & proposals with one-click conversion
- Stripe payment integration (optional)
- **Expense tracking with categories**
- **Profit & loss reports**
- **Cash flow analysis**
- **Accounts receivable aging**

### ⏱️ **Time & Project Tracking**
- Built-in timer for time tracking
- Manual time entry support
- Billable vs non-billable hours
- Project management with milestones
- Budget tracking and profitability
- Time-to-invoice conversion

### 📊 **Advanced Analytics & Reports**
- Real-time business dashboard
- Revenue by client analysis
- Client lifetime value (CLV)
- Monthly revenue trends
- Expense breakdown by category
- Export capabilities (PDF/Excel ready)

### 💬 **Communication Hub**
- Multi-channel messaging (SMS, Email, WhatsApp)
- Template system for invoices and reminders
- **Automated invoice reminders**
- Conversation history tracking
- Message status monitoring

### 📁 **File Management**
- File attachments for clients, invoices, estimates
- Receipt uploads for expenses
- Secure file storage
- Download and preview support

### 🔐 **Security & Access Control**
- Role-based permissions (Admin, Manager, Staff, Accountant)
- API key management for integrations
- Webhook support for external systems
- Audit logging
- E-signature support (schema ready)

### 📱 **Progressive Web App (PWA)**
- Installable on desktop and mobile
- Offline-ready architecture
- Responsive design
- Mobile-optimized UI

## 🛠️ Technology Stack

**Frontend:**
- [React 18](https://reactjs.org/) - Modern UI library
- [Vite](https://vitejs.dev/) - Lightning-fast build tool
- [React Router](https://reactrouter.com/) - Client-side routing
- [Axios](https://axios-http.com/) - HTTP client

**Backend:**
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Express](https://expressjs.com/) - Web framework
- [Prisma](https://www.prisma.io/) - Next-gen ORM
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [node-cron](https://github.com/node-cron/node-cron) - Scheduled tasks
- [Nodemailer](https://nodemailer.com/) - Email sending
- [Multer](https://github.com/expressjs/multer) - File uploads

## 📦 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **PostgreSQL** 12 or higher
- **npm** or **yarn**

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd CRM
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Environment Configuration**

   **Server** (`server/.env`):
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/crm_db"
   
   # Authentication
   JWT_SECRET="your_super_secret_jwt_key_change_this"
   
   # Server
   PORT=3001
   CLIENT_URL="http://localhost:5173"
   
   # Email (Optional - for automated reminders)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_FROM="your-email@gmail.com"
   
   # Stripe (Optional - for payments)
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   ```

   **Client** (`client/.env`):
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Database Setup**

   **Option 1: Using Prisma (Recommended)**
   ```bash
   cd server
   npx prisma db push
   npx prisma generate
   cd ..
   ```

   **Option 2: Using SQL Script**
   ```bash
   # In PostgreSQL admin console (pgAdmin, psql, etc.)
   # Run: server/prisma/init.sql
   
   # Then generate Prisma client
   cd server
   npx prisma generate
   cd ..
   ```

5. **Start the Application**
   ```bash
   npm run dev
   ```

   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001

6. **Create Your First User**
   
   Register at http://localhost:5173/register

## 📚 API Documentation

### Core Endpoints

**Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

**Clients**
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

**Invoices**
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `POST /api/invoices/:id/send` - Send invoice

**Expenses**
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/stats` - Expense statistics

**Time Tracking**
- `POST /api/time-entries/start` - Start timer
- `PUT /api/time-entries/:id/stop` - Stop timer
- `GET /api/time-entries` - List time entries
- `GET /api/time-entries/stats` - Time statistics

**Leads**
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `POST /api/leads/:id/convert` - Convert to client

**Projects**
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/projects/:id/milestones` - Add milestone

**Reports**
- `GET /api/reports/profit-loss` - Profit & loss report
- `GET /api/reports/cash-flow` - Cash flow report
- `GET /api/reports/ar-aging` - AR aging report
- `GET /api/reports/revenue-by-client` - Revenue by client
- `GET /api/reports/client-lifetime-value` - CLV analysis

**File Attachments**
- `POST /api/attachments` - Upload file
- `GET /api/attachments/entity/:type/:id` - List files
- `GET /api/attachments/:id` - Download file
- `DELETE /api/attachments/:id` - Delete file

## 🗄️ Database Schema

The system includes **20+ tables**:
- Core: User, Client, Invoice, Estimate, Proposal, Template
- Financial: Payment, Expense, ExpenseCategory
- Operations: Task, TimeEntry, Project, Milestone
- Communication: Message, ReminderConfig, ReminderLog
- Advanced: Lead, Signature, Role, ApiKey, Webhook
- System: Tag, AuditLog, Attachment

## 🔧 Configuration

### Email Reminders
Configure SMTP settings in `server/.env` to enable:
- Overdue invoice reminders
- Due-soon invoice notifications
- Custom reminder schedules

### File Storage
Files are stored in `server/uploads/` by default. Configure cloud storage (S3) by modifying `server/src/utils/storage.js`.

### Cron Jobs
Automated tasks run daily:
- **1:00 AM** - Process recurring invoices
- **8:00 AM** - Task reminders
- **9:00 AM** - Invoice reminders and overdue checks

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Build will be in client/dist
# Serve with nginx or similar
```

### Environment Variables
Update `.env` files with production values:
- Change `JWT_SECRET` to a strong random string
- Update `DATABASE_URL` to production database
- Set `CLIENT_URL` to your domain
- Configure production SMTP settings

### Database Migration
```bash
cd server
npx prisma migrate deploy
```

## 📖 Usage Guide

### Creating Your First Invoice
1. Add a client in the Clients page
2. Navigate to Invoices
3. Click "New Invoice"
4. Select client, add line items
5. Save and send

### Tracking Time
1. Go to Time Tracking (when UI is built)
2. Click "Start Timer"
3. Select client and task
4. Stop when done
5. Convert to invoice

### Managing Expenses
1. Navigate to Expenses page
2. Click "Add Expense"
3. Fill in details and upload receipt
4. Track by category
5. View profit/loss reports

### Lead Management
1. Add leads from various sources
2. Score and assign to team members
3. Track through sales pipeline
4. Convert to client when won

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 💖 Support Development

This project is **100% free and open source**. If it helps your business, consider supporting development:

**[💳 Donate via Stripe](https://buy.stripe.com/3cI28se757NL7Xn87vcfK04)**

Your support helps maintain and improve this project for everyone.

## 📄 License

Open source - free for personal and commercial use.

## 🐛 Known Issues & Roadmap

**Current Status:**
- ✅ Backend APIs complete for all features
- ✅ Core UI (Dashboard, Clients, Invoices, Estimates, Expenses)
- ⏳ Advanced UI (Time Tracking, Projects, Leads, Reports) - Coming soon
- ⏳ Service workers for offline support
- ⏳ Push notifications

**Upcoming Features:**
- Mobile apps (React Native)
- Advanced reporting dashboard
- Integration marketplace
- Multi-language support

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoints

---

**Built with ❤️ for the freelance and small business community**

**Keywords**: _CRM, Client Management, Invoice Generator, Time Tracking, Project Management, Expense Tracking, Open Source, React, Node.js, PostgreSQL, Self-Hosted, Business Management, Freelancer Tools_
