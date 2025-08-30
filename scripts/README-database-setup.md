# Database Setup Scripts

## Quick Database Setup

### `quick-db-setup.sh`

Interactive script that gets your database running instantly with zero configuration.

#### Features

- **🔍 Auto-Detection**: Automatically detects local PostgreSQL installations
- **☁️ Supabase Integration**: Guided setup for managed database
- **🔧 Environment Config**: Automatically updates `.env.local`
- **⚡ Prisma Setup**: Runs all necessary Prisma commands
- **✅ Connection Testing**: Verifies database connection works
- **🎨 Beautiful UI**: Colorful, interactive command-line interface

#### Usage

```bash
# Make executable (first time only)
chmod +x scripts/quick-db-setup.sh

# Run the setup
./scripts/quick-db-setup.sh
```

#### What it does

1. **Detects Local Database**: Checks for PostgreSQL, Docker containers
2. **Offers Options**: Local setup or Supabase (recommended)
3. **Guides Supabase Setup**: Step-by-step instructions with validation
4. **Updates Configuration**: Automatically updates `.env.local`
5. **Runs Prisma**: Generates client and pushes schema
6. **Tests Connection**: Verifies everything works
7. **Shows Next Steps**: Clear instructions on what to do next

#### Supported Database Options

- **Local PostgreSQL**: Automatic database and user creation
- **Docker PostgreSQL**: Detects running containers
- **Supabase**: Guided setup with connection validation
- **Any PostgreSQL**: Manual connection string input

#### Error Handling

- Graceful fallbacks if local setup fails
- Connection validation before proceeding
- Backup of existing environment files
- Clear error messages with suggested fixes

#### Next Steps After Setup

The script will guide you to:

1. Start development server: `npm run dev`
2. Seed database: `npm run db:seed`
3. Access your app at `http://localhost:3000`
4. Manage data in Supabase dashboard (if using Supabase)

#### Troubleshooting

**Script won't run?**
```bash
# Make sure it's executable
chmod +x scripts/quick-db-setup.sh

# Run from project root
cd /path/to/hodos-site
./scripts/quick-db-setup.sh
```

**Database connection fails?**
- Double-check your Supabase connection string
- Ensure your IP is allowed in Supabase settings
- Try running the script again

**Prisma errors?**
```bash
# Manual Prisma setup if script fails
npx prisma generate
npx prisma db push
```

#### Requirements

- Node.js and npm/yarn installed
- Internet connection (for Supabase)
- `psql` command (optional, for connection testing)

#### Security

- Generates secure random passwords
- Creates database backups before modifications
- Never logs sensitive connection details
- Uses environment variables for all secrets

---

**Pro tip**: The script is idempotent - you can run it multiple times safely!