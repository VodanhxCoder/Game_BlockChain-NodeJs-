# Game_BlockChain-NodeJs-
```markdown
# Game_BlockChain-NodeJs-

A full-stack demo project combining a React (Vite) client with an Express server and blockchain tooling (Hardhat/OpenZeppelin). It includes authentication helpers, file uploads, and integration with Ethereum-compatible libraries for smart contract interaction.

This README gives quick setup steps, useful scripts and notes to run the project locally on Windows or macOS/Linux.

## Prerequisites

- Node.js (recommended >= 18). Verify with `node -v`.
- npm (comes with Node.js) or Yarn.
- (Optional) Docker if you prefer containerized databases or services.

## Quick start

Clone the repository and switch to the project folder:

```bash
git clone <REMOTE_URL>
cd <repo-folder>
```

### 1) Client (frontend)

The frontend is built with Vite + React.

```bash
cd client
npm install
npm run dev   # starts Vite dev server (usually at http://localhost:5173)
```

Available scripts (see `client/package.json`):
- `dev` — start dev server
- `build` — build production bundle
- `preview` — preview built bundle

### 2) Server (backend)

The server is an Express app and contains project-specific APIs, authentication, and DB integration.

```bash
cd server
npm install
npm run dev   
```

Available scripts (see `server/package.json`):
- `start` — start server (nodemon with Babel register)
- `dev` — development start (nodemon)

## Environment variables

Create a `.env` file in the `server/` directory with the values your app needs. Example variables (adjust for your setup):

```
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/dbname
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=you@example.com
EMAIL_PASS=supersecret
```

If you use Sequelize, run migrations (if available) to prepare the database.

## Smart contracts & Hardhat

The server `package.json` includes dev dependencies for Hardhat and related tooling. Smart contract development and tests can be run from the `server/` (or a dedicated `contracts/`) location using Hardhat commands. Check the `server/` scripts and the project folders for a Hardhat setup.

## Project structure (high level)

- `client/` — React + Vite frontend
- `server/` — Express backend, APIs, DB models, smart contract tooling
- `server/fail2ban_service/` — auxiliary service README (if used)

Explore each folder for specific README files and instructions.

## Notes & tips (Windows)

- If PowerShell blocks npm scripts, run them using `npm.cmd` or temporarily lift execution policy:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
```

- On Windows, use `cmd` or PowerShell depending on your preference. The commands in this README are cross-platform shell examples.

## Contributing

If you'd like to contribute:

1. Fork the repo and create a feature branch.
2. Open a pull request with a clear description of your changes.

## License

This project currently lists `ISC` in `server/package.json`. Add or change license text here as needed.

## Contact

Author in `server/package.json`: MinhKhue

---


```