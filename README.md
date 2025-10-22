# Claude Mortgage Calculator

A comprehensive, feature-rich mortgage calculator built with Next.js, React, and TypeScript. Calculate monthly payments, compare paydown strategies, analyze mortgage points, and export detailed amortization schedules.

**Live Demo**: [https://mortgagecalc.compound-interests.com](https://mortgagecalc.compound-interests.com)

---

## Features

### 🧮 Comprehensive Calculations
- **Monthly Payment Breakdown**: Principal, interest, PMI, property taxes, and insurance
- **Amortization Schedules**: Detailed month-by-month payment breakdown
- **Existing Loan Support**: Start calculations from your current loan balance
- **PMI Calculations**: Both rate-based and fixed-amount PMI options

### 📊 Paydown Strategy Comparison
Compare multiple strategies to pay off your mortgage faster:
- Standard monthly payments
- Bi-weekly payment plans
- Extra monthly principal payments
- Double principal payments
- Annual lump-sum payments

See exactly how much time and interest you'll save with each approach.

### 💰 Mortgage Points Calculator
Determine if buying mortgage points makes financial sense:
- Compare multiple rate/points scenarios side-by-side
- Calculate break-even points
- See total costs at 5 years, 10 years, and full term
- Identify monthly savings for each scenario

### 🔄 Refinance Calculator
Decide if refinancing your current mortgage is worth it:
- Auto-populates current loan details from Calculator tab
- Compare new loan terms, rates, and closing costs
- Calculate break-even point to recover closing costs
- See monthly payment differences and long-term savings
- Analyze cost comparisons at 5 years, 10 years, and full term
- Get smart recommendations based on your specific situation
- Support for cash-out refinancing scenarios

### 📈 Financial Analysis
- Total interest paid over loan lifetime
- Total cost of loan
- Schedule comparison views
- Export data to CSV for further analysis

### 🎨 Modern User Experience
- Clean, intuitive interface
- Dark/light theme toggle with persistent preference
- Responsive design for desktop, tablet, and mobile
- Fast, client-side calculations with no server delays

---

## Quick Start

**This is a Docker-first project. All development should be done using Docker.**

### Prerequisites
- **Docker** and **Docker Compose** installed
- Optional: **Node.js** 18+ (only if running without Docker)

### Installation (Docker - Recommended)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jraitt/Claude-Mortgage-Calculator.git
   cd Claude-Mortgage-Calculator
   ```

2. **Build and start with Docker Compose**:
   ```bash
   docker compose up -d --build
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **View logs** (if needed):
   ```bash
   docker compose logs -f
   ```

### Alternative: Local Development (Without Docker)

If you prefer to run without Docker:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Usage Guide

### Basic Loan Calculation

1. Navigate to the **Calculator** tab
2. Enter your loan details:
   - Home price
   - Down payment
   - Loan term (years)
   - Interest rate
   - Property taxes (annual)
   - Home insurance (annual)
   - PMI (if applicable)
3. View your monthly payment breakdown instantly

### Comparing Paydown Strategies

1. Configure your base loan in the **Calculator** tab
2. Go to the **Paydown Strategies** tab
3. Enable different strategies (bi-weekly, extra principal, etc.)
4. See side-by-side comparison of:
   - Total interest saved
   - Time saved (months/years)
   - Payoff dates

### Analyzing Mortgage Points

1. Go to the **Points Calculator** tab
2. Add multiple scenarios with different rates and points
3. Mark one scenario as the baseline for comparison
4. Review:
   - Break-even months for each scenario
   - Monthly payment differences
   - Total costs at various timeframes
5. Determine which option saves you the most money

### Evaluating Refinancing Options

1. Configure your current loan in the **Calculator** tab
2. Go to the **Refinance Calculator** tab (current details auto-populate)
3. Enter new loan terms:
   - New interest rate
   - New loan term
   - Closing costs
   - Points (if applicable)
   - Cash-out amount (if taking cash out)
4. Review the analysis:
   - Break-even point (months to recover closing costs)
   - Monthly payment comparison
   - Total interest savings over time
   - Cost comparison at 5, 10 years, and full term
5. Check the recommendations for informed decision-making

### Exporting Data

1. Navigate to the **Amortization** tab
2. Click the **Export to CSV** button
3. Open the CSV file in Excel, Google Sheets, or any spreadsheet software
4. Analyze your schedule, create charts, or share with advisors

---

## Development

**IMPORTANT: This is a Docker-first project. All development should be done using Docker to ensure consistency across environments.**

### Docker Development Workflow

```bash
# Start development environment
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after dependency changes
docker compose up -d --build

# Stop the container
docker compose down

# Run tests in Docker
docker compose exec mortgage-calculator npm test

# Run linting in Docker
docker compose exec mortgage-calculator npm run lint
```

### Project Structure

```
mortgage-calculator/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── MortgageCalculator.tsx
├── contexts/              # React contexts
│   └── ThemeContext.tsx   # Theme management
├── utils/                 # Utility functions
│   ├── csvExport.ts       # CSV generation
│   ├── constants.ts       # Application constants and limits
│   ├── validation.ts      # Input validation utilities
│   └── __tests__/         # Unit tests for utilities
├── types/                 # TypeScript types
└── public/                # Static assets
```

### Available Scripts

**Using Docker (Recommended)**:
```bash
# Start development environment
docker compose up -d

# Run tests
docker compose exec mortgage-calculator npm test

# Run tests in watch mode
docker compose exec mortgage-calculator npm run test:watch

# Run linting
docker compose exec mortgage-calculator npm run lint

# Build for production
docker compose exec mortgage-calculator npm run build
```

**Without Docker** (if needed):
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **Runtime**: Node.js 18+

---

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start the container**:
   ```bash
   docker compose up -d --build
   ```

2. **Access the application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **View logs**:
   ```bash
   docker compose logs -f
   ```

4. **Stop the container**:
   ```bash
   docker compose down
   ```

### Manual Docker Build

```bash
# Build the image
docker build -t mortgage-calculator .

# Run the container
docker run -p 3000:3000 mortgage-calculator
```

---

## Production Deployment

### Server Requirements
- Ubuntu/Debian Linux server
- Docker and Docker Compose installed
- Nginx web server
- Valid domain name
- SSL certificate (Let's Encrypt recommended)

### Deployment Steps

1. **Clone the repository on your server**:
   ```bash
   git clone https://github.com/jraitt/Claude-Mortgage-Calculator.git
   cd Claude-Mortgage-Calculator
   ```

2. **Configure Nginx** (see `subdomain_info.md` for detailed config)

3. **Set up SSL with Certbot**:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Build and start the Docker container**:
   ```bash
   docker compose up -d --build
   ```

5. **Verify deployment**:
   Visit your domain and test the calculator

For detailed deployment instructions, see [`subdomain_info.md`](./subdomain_info.md).

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Follow code standards**:
   - Files must be < 500 lines
   - Use TypeScript type annotations
   - Add JSDoc comments to functions
   - Follow existing code style
4. **Commit your changes**: `git commit -m "feat: add your feature"`
5. **Push to your fork**: `git push origin feature/your-feature`
6. **Open a Pull Request**

### Development Guidelines

- **IMPORTANT**: This is a Docker-first project - use Docker for all development
- Read [`PLANNING.md`](./PLANNING.md) before starting work
- Check [`TASK.md`](./TASK.md) for current tasks and priorities
- All code must pass linting: `docker compose exec mortgage-calculator npm run lint`
- Run tests before submitting PR: `docker compose exec mortgage-calculator npm test`
- Test your changes thoroughly before submitting PR

---

## Known Issues & Roadmap

### Current Limitations
- Large component needs refactoring (see TASK-001 in `TASK.md`)
- Input validation implemented for refinance calculator, needs expansion to other areas

### Upcoming Features
- Chart visualizations for paydown strategies
- Mobile UI improvements
- Print-friendly styles
- Session persistence with localStorage
- Loan comparison feature (save and compare multiple scenarios)
- Expand test coverage to all calculation functions

See [`TASK.md`](./TASK.md) for full roadmap and task tracking.

---

## FAQ

### Q: Does this calculator save my data?
**A**: No, all calculations are performed client-side in your browser. Your data never leaves your device and is not stored on any server.

### Q: Can I use this for commercial mortgages?
**A**: This calculator is designed for residential mortgages. While it can handle various loan structures, it doesn't include commercial-specific features like balloon payments or interest-only periods.

### Q: Is the amortization schedule accurate?
**A**: Yes, the calculator uses standard mortgage amortization formulas. However, always verify calculations with your lender, as they may include additional fees or use slightly different calculation methods.

### Q: Can I save multiple loan scenarios?
**A**: Not yet, but this feature is planned (see TASK-009 in `TASK.md`). Currently, you can export scenarios to CSV and save them locally.

### Q: Why doesn't my actual monthly payment match the calculator?
**A**: Your lender may include additional fees not captured by this calculator (HOA dues, additional escrow items, origination fees, etc.). This calculator shows the core components: principal, interest, PMI, property tax, and insurance.

### Q: How do I report a bug or request a feature?
**A**: Please open an issue on [GitHub](https://github.com/jraitt/Claude-Mortgage-Calculator/issues) with a detailed description.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) by Vercel
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Developed with assistance from [Claude Code](https://claude.ai/code)

---

## Support

For questions, issues, or feature requests:
- **GitHub Issues**: [https://github.com/jraitt/Claude-Mortgage-Calculator/issues](https://github.com/jraitt/Claude-Mortgage-Calculator/issues)
- **Documentation**: See [`PLANNING.md`](./PLANNING.md) and [`CLAUDE.md`](./CLAUDE.md)

---

**Last Updated**: 2025-10-22
