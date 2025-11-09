# Game_BlockChain-NodeJs-

Quick start (Windows PowerShell)

1. Clone

```powershell
git clone <REMOTE_URL>
cd <repo-folder>
```

2. Client (Vite)

```powershell
cd client
npm install
npm run dev
```

3. Server (Express)

```powershell
cd server
npm install
npm run dev
```

Note: if PowerShell blocks npm scripts, use `npm.cmd` or run:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
```

Create `server/.env` as needed and run migrations if required.

That's it — open the client URL printed by Vite (usually http://localhost:5173).