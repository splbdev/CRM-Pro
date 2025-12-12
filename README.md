# Open Source Client Management Platform (CRM)

A comprehensive, self-hosted **Client Relationship Management (CRM)** solution built for freelancers and small businesses. Manage clients, track invoices, generate estimates, and streamline your workflow with this full-stack web application powered by **React**, **Node.js**, and **PostgreSQL**.

## 🚀 Why Use This CRM?
This project provides a complete suite of tools to manage your business finances and client interactions effectively.
- **Self-Hosted & Private**: Keep your client data secure on your own servers.
- **Open Source & Extensible**: Built with modern standard technologies, easy to customize.
- **Full Financial Cycle**: From Proposal to Estimate to Invoice to Payment.

## ✨ Key Features

### 👥 Client Management
- **Centralized Database**: Store unlimited client contacts, company details, and notes.
- **Activity Timeline**: Track every interaction, invoice, and message per client.
- **Smart Search**: Instantly filter clients by name, company, or status.

### 💰 Invoicing & Payments
- **Professional Invoice Generator**: Create beautiful, itemized invoices with tax calculations.
- **Recurring Billing**: Automate weekly, monthly, or annual subscriptions.
- **Multi-Currency Support**: Bill global clients in their local currency.
- **Stripe Integration**: Accept credit card payments directly (Optional).
- **Payment Tracking**: Record partial payments, cash, and bank transfers.

### 📄 Estimates & Proposals
- **Quote Builder**: Convert estimates into invoices with one click.
- **Rich Proposals**: Send detailed HTML/Markdown proposals to win more deals.
- **Status Tracking**: Monitor which quotes are viewed, accepted, or rejected.

### 💬 Communication Hub
- **Multi-Channel Messaging**: Send SMS (Twilio), Email (SMTP/Gmail), and WhatsApp messages.
- **Template System**: Reusable templates for invoices, reminders, and marketing.
- **Conversation History**: view all sent/received messages in one thread.

### 📊 Analytics & Insights
- **Business Dashboard**: Real-time overview of revenue, outstanding invoices, and active projects.
- **Financial Reports**: Visual breakdowns of monthly income and client growth.

## 🛠️ Technology Stack

**Frontend:**
- [React](https://reactjs.org/) - Component-based UI library
- [Vite](https://vitejs.dev/) - Next-generation frontend tooling
- [React Router](https://reactrouter.com/) - Declarative routing
- [Axios](https://axios-http.com/) - Promise-based HTTP client

**Backend:**
- [Node.js](https://nodejs.org/) - JavaScript runtime environment
- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [Prisma](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM
- [PostgreSQL](https://www.postgresql.org/) - Advanced open source relational database

## 📦 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL installed and running
- npm or yarn

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd CRM
   ```

2. **Install Dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Setup**
   Configure your `.env` files in both `client` and `server` directories.
   
   **Server (.env)**:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/crm_db"
   JWT_SECRET="your_s3cr3t_k3y"
   PORT=5000
   ```
   
   **Client (.env)**:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Initialize Database**
   ```bash
   npm run prisma:push
   npm run prisma:generate
   ```

5. **Run the App**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:5173` (Client) and `http://localhost:5000` (API).

## 🤝 Contributing
Contributions are welcome! Whether it's reporting a bug, suggesting a feature, or writing code, we value your feedback.

## 💖 Support the Project
If this automated CRM helps you save time and money, consider supporting its development!

**[Support development via Stripe](https://buy.stripe.com/3cI28se757NL7Xn87vcfK04)**

Your donations help keep this project open-source and free for everyone.

## 📄 License
This project is open source. Feel free to use it for personal or commercial projects.

---
**Keywords**: _CRM, Client Management, Invoice Generator, Open Source, React, Node.js, Estimating Software, Freelancer Tools, Self-Hosted_
