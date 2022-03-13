#/bin/sh

git fetch
git reset --hard origin/master

pwd=`pwd`

SSL_PUBLIC_CRT_PATH=$pwd/rsa/public.crt

rm .env

cat >> .env <<EOL
PORT=3000
REDIS_HOST='127.0.0.1'
REDIS_PORT=6379
SSL_PUBLIC_CRT_PATH=$SSL_PUBLIC_CRT_PATH
EOL

echo ".env created"

pm2 delete blizeSocket
pm2 start npm --name "blizeSocket" -- run "start-cluster-prod"
