# VPS Subdomain Deployment Checklist

This checklist configures production as:

- Storefront: `https://www.yourdomain.com`
- Admin: `https://admin.yourdomain.com`
- API: `https://api.yourdomain.com`
- MongoDB: private service inside Docker network (not public)

---

## 1. DNS Setup

Create A records:

- `www` -> VPS public IP
- `admin` -> VPS public IP
- `api` -> VPS public IP

Optional:

- root/apex domain redirect to `www` from your DNS provider or additional nginx block.

---

## 2. VPS Prerequisites

Install on VPS:

- Docker
- Docker Compose plugin
- Git

Open firewall ports:

- `80/tcp`
- `443/tcp`

Do not expose MongoDB port `27017` publicly.

---

## 3. Clone App on VPS

```bash
cd /opt
sudo git clone <your-repo-url> bman
cd bman
```

---

## 4. Create Production Env Files on VPS

### Root env for nginx template

Copy and edit:

```bash
cp .env.production.example .env.production
```

Set values:

- `PUBLIC_DOMAIN`
- `ADMIN_DOMAIN`
- `API_DOMAIN`
- `LETSENCRYPT_EMAIL`

### Backend env

Copy and edit:

```bash
cp server/.env.production.example server/.env
```

Set secure values:

- `JWT_SECRET`
- OAuth secrets if enabled
- URLs/cookie domain for your domain

---

## 5. First Production Start

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Verify services:

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 6. Verify Routes

- `https://www.yourdomain.com` -> storefront
- `https://admin.yourdomain.com` -> admin app
- `https://api.yourdomain.com/api/health` -> backend health

---

## 7. GitHub Actions Secrets

Set in GitHub repository secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_PORT` (optional, defaults to 22)
- `VPS_DEPLOY_PATH` (example: `/opt/bman`)

Current deploy workflow expects `.env.production` to already exist on the VPS.

---

## 8. Automatic Deploy Behavior

On push to `main`:

1. Build checks run in GitHub Actions.
2. SSH to VPS.
3. Pull latest code.
4. Rebuild/restart production stack with:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
```

---

## 9. Media Storage Behavior

- Uploads are stored on VPS in persistent volume `uploads-data`.
- Images are converted/compressed to WebP before storage.
- Space usage is reduced versus storing original full-size files.

---

## 10. MongoDB Behavior

- MongoDB runs as `mongo` container with persistent volume `mongo-data`.
- Backend connects to `mongodb://mongo:27017/bman`.
- DB remains internal to Docker network unless explicitly published.

---

## 11. Backup Minimum

At minimum, schedule backups for:

- `mongo-data`
- `uploads-data`
- `server/.env`
- `.env.production`

---

## 12. Quick Troubleshooting

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f server
docker compose -f docker-compose.prod.yml logs -f mongo
```

Restart stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```
