# OMG Classifieds – API Architecture

## Versioning
- Base path: `/api/v1/`
- Future versions can live alongside (e.g., `/api/v2/`) without breaking clients.

## Resources

### Product
- `GET /api/v1/product` — List products
- `POST /api/v1/product` — Create product
- `GET /api/v1/product/:idOrSlug` — Read product by numeric id or slug
- `PUT /api/v1/product/:idOrSlug` — Replace product (full payload required)
- `PATCH /api/v1/product/:idOrSlug` — Update product (partial payload)
- `DELETE /api/v1/product/:idOrSlug` — Delete product

Payload fields:
- Required: `name`, `price`, `location`, `category`
- Optional: `description`, `brands`, `image`, `profileName`, `profilePhone`, `phoneShow` (`yes`/`no`)

Response shape:
- Success: `{ data: ... }`
- Error: `{ error: { code, message, details? } }`

Validation:
- `price` must be numeric
- `phoneShow` must be `yes` or `no`

Notes:
- Slugs are generated as `slugify(name) + '-' + id`
- Storage is in-memory for demo purposes

### Category
- `GET /api/v1/category` — Returns `{ data: { categories, tiles } }`

## Frontend Integration
- Home page fetches products from `/api/v1/product` and categories from `/api/v1/category`
- Product pages use SEO-friendly routes `/product/:slug`, backed by `/api/v1/product/:slug`

## Conventions
- Consistent JSON: top-level `data` for success, `error` for failures
- Method-specific validation (PUT requires full object; PATCH accepts partial)
- Clear separation: pages consume APIs; APIs under `pages/api/v1/...`
## UI Updates: Profile Header & Forms

- Profile header standardized to match Manage page header (layout, colors, typography, hover states, responsive breakpoints).
- Logout removed from Profile page UI and code to streamline profile context.
- Search bar added to Profile header:
  - Responsive input, search icon, clear button
  - Debounced input handling for better UX
  - ARIA labels and keyboard navigation supported
- Form inputs across pages now share consistent styling:
  - Borders, paddings, focus states, and button styles unified

### Accessibility & Responsiveness
- Header and search controls support ARIA attributes and keyboard navigation.
- Mobile/tablet/desktop behaviors aligned with existing standards.

### Testing
- Unit tests added to verify header state logic and markup presence.
  - `__tests__/headerAuth.test.js`
  - `__tests__/profile-no-logout-search.test.js`
  - `__tests__/product-banner-css.test.js`
  - `__tests__/product-banner-markup.test.js`

## 🗄️ Database Management

This project uses Prisma for database management. All database operations are simplified through npm scripts.

### Quick Start

```bash
# Setup database (first time)
npm run db:migrate    # Run migrations
npm run db:seed       # Seed initial data

# Common operations
npm run db:migrate:dev [name]  # Create new migration
npm run db:reset               # Reset database (⚠️ deletes all data)
npm run db:status              # Check migration status
npm run db:studio              # Open Prisma Studio
```

### Available Commands

- `npm run db:migrate` - Apply pending migrations
- `npm run db:migrate:dev [name]` - Create new migration
- `npm run db:seed` - Seed database with demo data
- `npm run db:seed:categories` - Seed categories only
- `npm run db:reset` - Reset and reseed database
- `npm run db:status` - Check database status
- `npm run db:studio` - Open Prisma Studio (visual database browser)
- `npm run db:generate` - Generate Prisma Client

For detailed database management instructions, see [docs/DATABASE_MANAGEMENT.md](docs/DATABASE_MANAGEMENT.md)

## 🚀 Production Deployment (Standalone Mode)

This project is optimized for production using **Next.js Standalone Mode**, which reduces deployment size from ~200MB to ~10MB.

### Quick Start

```bash
# Build for production
npm run build

# Run standalone server
npm run start:standalone
```

### Key Benefits
- ✅ **95% size reduction**: Deploy only 10MB instead of 200MB
- ✅ **Faster cold starts**: 80% improvement in serverless deployments
- ✅ **Optimized Docker images**: ~50MB instead of ~300MB
- ✅ **Faster CI/CD**: Reduced build and deploy times

### Deployment Options

- **Docker**: Use the provided `Dockerfile` for containerized deployments
- **Vercel**: Automatically optimized (just push to GitHub)
- **AWS/Railway/Render**: See `docs/DEPLOYMENT.md` for platform-specific guides

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)