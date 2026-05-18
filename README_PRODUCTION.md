# Production Quick Start (VPS + Subdomains)

This is the shortest path to deploy with:

- Store: https://www.bmanbd.com
- Admin: https://admin.bmanbd.com
- API: https://api.bmanbd.com

MongoDB remains private inside Docker network.

## 1) DNS records

Point these A records to your VPS IP:

- www
- admin
- api

## 2) First-time setup on VPS

Run these commands once:

```bash
cd /opt
sudo git clone <YOUR_REPO_URL> bman
cd bman
cp .env.production.example .env.production
cp server/.env.production.example server/.env
```

Now edit both files and set real values:

- .env.production
- server/.env

Minimum required values:

- Domains and email in .env.production
- JWT_SECRET in server/.env
- URL and cookie values in server/.env

## 3) First production deploy

```bash
cd /opt/bman
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## 4) Verify status and logs

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f server
```

Health check:

- https://api.yourdomain.com/api/health

## 5) GitHub Actions auto-deploy

Set repository secrets:

- VPS_HOST
- VPS_USER
- VPS_SSH_KEY
- VPS_DEPLOY_PATH (example: /opt/bman)
- VPS_PORT (optional)

On push to main, workflow will:

1. Run build checks.
2. SSH into VPS.
3. Pull latest code.
4. Recreate stack with:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build --remove-orphans
```

## 6) Common commands

Restart all:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Stop all:

```bash
docker compose -f docker-compose.prod.yml down
```

View all logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

## 7) Notes

- Uploaded images are compressed and stored in VPS persistent volume.
- MongoDB data is persisted in docker volume and not publicly exposed.
- Keep backups of .env.production, server/.env, mongo-data, uploads-data.
