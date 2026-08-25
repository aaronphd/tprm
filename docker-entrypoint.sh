#!/bin/sh
set -e

npx prisma migrate deploy
node scripts/bootstrap-admin.js

exec node server.js
