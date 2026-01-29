# PreciousVault

> Your all-in-one precious metals portfolio tracker with real-time AUD pricing

Track your gold and silver holdings, monitor spot prices, analyze your portfolio performance, and manage your precious metals investments — all in one elegant application.

---

## Why PreciousVault?

Stop juggling multiple apps and websites to track your precious metals investments. PreciousVault brings everything you need into one streamlined platform:

- **Real-time Pricing**: Live gold and silver spot prices in Australian Dollars (AUD)
- **Portfolio Management**: Track all your holdings in one place with detailed records
- **Performance Analytics**: Interactive charts and profit/loss calculations
- **Price History**: Historical price trends to inform your investment decisions
- **Secure & Private**: Your data is protected with industry-standard authentication

---

## Features

### Portfolio Dashboard
- **Total portfolio value** with real-time spot price integration
- **Gold & silver summaries** showing total ounces and current value
- **Recent holdings** quick view for easy access
- **Current spot prices** with last updated timestamps

### Holdings Management
- **Add holdings** with detailed information:
  - Metal type (Gold or Silver)
  - Weight in troy ounces
  - Form (Coin or Bar)
  - Denomination (1oz, 2oz, 5oz, 10oz, etc.)
  - Quantity
  - Purchase price and date (optional)
  - Personal notes
- **Edit holdings** with in-place form editing
- **Delete holdings** with confirmation
- **Comprehensive table view** showing current value and P&L

### Analytics & Charts
- **Interactive price history charts** powered by Recharts
- **Multiple time ranges**: 7-day, 30-day, and 3-month views
- **Portfolio allocation** breakdown by metal type
- **Performance tracking** with profit/loss calculations
- **Metal-specific analysis** for gold and silver separately

### User Settings
- Account information and status
- **Daily digest**: Toggle daily Discord messages with gold/silver spot prices and your portfolio value
- Preference management (theme, currency)
- Data export options (CSV)
- Security controls (sign out)

---

## Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod](https://zod.dev/)** - Form management & validation
- **[Recharts](https://recharts.org/)** - Data visualization
- **[Lucide React](https://lucide.dev/)** - Beautiful icons

### Backend
- **[tRPC](https://trpc.io/)** - End-to-end type-safe APIs
- **[PostgreSQL](https://www.postgresql.org/)** - Database (local or [Neon](https://neon.tech) for Vercel)
- **[Drizzle ORM](https://orm.drizzle.team/)** - Schema, migrations, and queries
- **[NextAuth](https://next-auth.js.org/)** - Authentication (Credentials provider)
- **[TanStack Query](https://tanstack.com/query/)** - Data fetching & caching
- **[Metals.dev API](https://metals.dev/)** - Real-time precious metals pricing

### Development
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[TypeScript ESLint](https://typescript-eslint.io/)** - TypeScript-specific linting

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 10.10.0 or later
- **PostgreSQL** (local: [Postgres.app](https://postgresapp.com/) or [official installer](https://www.postgresql.org/download/))
- **Metals.dev API key** (for price data)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/precious-valt.git
   cd precious-valt
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` or `.env.local` file in the root directory:
   ```env
   # Database (local Postgres or Neon connection string)
   DATABASE_URL=postgresql://localhost/preciousvalt

   # NextAuth (generate with: openssl rand -base64 32)
   AUTH_SECRET=your_auth_secret_at_least_32_chars

   # Metals.dev API
   METALS_DEV_KEY=your_metals_dev_api_key

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Set up the database**

   Create a local database (e.g. `createdb preciousvalt`), then run Drizzle migrations:
   ```bash
   pnpm db:push
   ```
   Or generate and run migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
   To browse data locally: `pnpm db:studio` (opens Drizzle Studio in the browser).

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel (with Neon)

1. **Create a Neon project** at [neon.tech](https://neon.tech), then copy the connection string (use the **pooled** connection for serverless).

2. **In your Vercel project**, add environment variables:
   - `DATABASE_URL` — Neon connection string
   - `AUTH_SECRET` — same as local (or generate a new one)
   - `METALS_DEV_KEY` — your Metals.dev API key
   - `NEXT_PUBLIC_APP_URL` — your Vercel URL (e.g. `https://your-app.vercel.app`)
   - Optional: `CRON_SECRET` — a secret string; set this and Vercel Cron will send `Authorization: Bearer <CRON_SECRET>` when calling the daily digest endpoint.

3. **Run migrations** against the Neon database (e.g. from your machine with `DATABASE_URL` set to the Neon URL):
   ```bash
   pnpm db:push
   ```

4. **Daily digest cron**: The app includes a cron job that runs once per day (8:00 UTC) and sends Discord messages to users who have enabled the daily digest and set a webhook URL. The job is configured in `vercel.json`. Ensure `CRON_SECRET` is set in Vercel so the route is protected.

---

## Available Scripts

```bash
# Development
pnpm dev              # Start development server with Turbo
pnpm build            # Build for production
pnpm start            # Start production server
pnpm preview          # Build and preview production

# Database (Drizzle)
pnpm db:generate      # Generate migrations from schema
pnpm db:push          # Push schema to database (dev)
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio in browser

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Auto-fix ESLint issues
pnpm typecheck       # Run TypeScript type checking
pnpm format:check    # Check code formatting
pnpm format:write    # Auto-format code with Prettier
pnpm check           # Run lint + typecheck
```

---

## API Integration

### Metals.dev API

PreciousVault uses the [Metals.dev API](https://metals.dev/) to fetch real-time precious metals prices.

**Endpoint:**
```
GET https://api.metals.dev/v1/latest?api_key={KEY}&currency=AUD&unit=toz
```

**Features:**
- Prices in Australian Dollars (AUD)
- Troy ounce (toz) unit measurements
- 6-hour caching to optimize API usage
- Automatic fallback if API is unavailable
- Historical price tracking with daily snapshots

**Get your API key:** [https://metals.dev/](https://metals.dev/)

---

## Database Schema

### Users
Local user accounts (NextAuth Credentials).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | TEXT | Unique email |
| `password_hash` | TEXT | Hashed password |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Holdings
Stores user precious metals holdings with purchase information and notes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `metal_type` | TEXT | 'gold' or 'silver' |
| `weight_oz` | DECIMAL | Weight in troy ounces |
| `form_type` | TEXT | 'bar' or 'coin' |
| `denomination` | TEXT | Size (e.g., "1oz", "10oz") |
| `quantity` | INTEGER | Number of items |
| `purchase_price_aud` | DECIMAL | Optional purchase price |
| `purchase_date` | TIMESTAMPTZ | Optional purchase date |
| `notes` | TEXT | Optional notes |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Price Cache
Caches current spot prices with 6-hour TTL.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `metal_type` | TEXT | 'gold' or 'silver' (unique) |
| `price_aud` | DECIMAL | Current price in AUD |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Price History
Historical daily prices for chart visualization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `metal_type` | TEXT | 'gold' or 'silver' |
| `price_aud` | DECIMAL | Price in AUD |
| `recorded_date` | DATE | Date of price record |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

### Notification Settings
Per-user daily digest preferences (Discord webhook).

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key, foreign key to users |
| `daily_digest_enabled` | BOOLEAN | Whether to send daily digest |
| `discord_webhook_url` | TEXT | Discord webhook URL (optional) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## Project Structure

```
precious-valt/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Portfolio dashboard
│   │   ├── holdings/          # Holdings management
│   │   ├── analytics/         # Charts & analytics
│   │   ├── settings/          # User settings
│   │   ├── sign-in/           # Authentication pages
│   │   ├── sign-up/
│   │   └── api/trpc/          # tRPC API endpoint
│   │
│   ├── server/
│   │   └── api/               # Backend API logic
│   │       ├── root.ts        # Main tRPC router
│   │       ├── trpc.ts        # tRPC configuration
│   │       └── routers/       # API route handlers
│   │           ├── prices.ts  # Price fetching & caching
│   │           ├── holdings.ts # Holdings CRUD operations
│   │           └── notification-settings.ts
│   │   └── db/                # Drizzle schema and client
│   │       ├── schema.ts
│   │       └── index.ts
│   │
│   ├── components/
│   │   ├── ui/                # Shadcn UI components
│   │   ├── layout/            # Layout components
│   │   │   └── sidebar.tsx    # Navigation sidebar
│   │   └── charts/            # Chart components
│   │
│   ├── lib/                   # Utility libraries
│   │   └── utils.ts           # Helper functions
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── holdings.ts
│   │   ├── prices.ts
│   │   └── ...
│   │
│   └── trpc/                  # tRPC client setup
│       ├── react.tsx          # React provider
│       └── server.ts          # Server utilities
│
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

---

## Features in Detail

### Real-time Price Tracking
- Live spot prices for gold and silver in AUD
- 6-hour caching mechanism to reduce API calls
- Automatic price updates with timestamp tracking
- Historical price data storage for trend analysis

### Portfolio Calculations
- **Total Value**: Sum of all holdings at current spot prices
- **Metal Breakdown**: Total ounces and value by metal type
- **Profit/Loss**: Calculated from purchase price vs current value
- **Allocation**: Percentage breakdown of gold vs silver holdings

### Security
- NextAuth (Credentials provider) with email/password and bcrypt
- Session-based authentication (JWT strategy)
- Protected tRPC procedures for all user operations
- User data scoped by session in application logic

### User Experience
- Responsive design for mobile and desktop
- Dark theme for comfortable viewing
- Loading states and error handling
- Form validation with real-time feedback
- Toast notifications for user actions

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Metals.dev](https://metals.dev/) for providing precious metals pricing API
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [Drizzle ORM](https://orm.drizzle.team/) for schema and migrations
- [NextAuth](https://next-auth.js.org/) for authentication
- [Shadcn UI](https://ui.shadcn.com/) for component primitives
- [Next.js](https://nextjs.org/) team for the framework

---

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/precious-valt/issues) on GitHub.

---

**Built with by developers, for precious metals investors**
