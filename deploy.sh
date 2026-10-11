#!/bin/bash
set -e

DOMAIN="34-64-159-225.sslip.io"
EMAIL="jetteyak.dev@gmail.com"
CERT_PATH="./certbot/conf/live/$DOMAIN"

echo "=== [1/4] 디렉토리 및 더미 SSL 인증서 준비 ==="
mkdir -p ./certbot/conf/live/$DOMAIN
mkdir -p ./certbot/www

# 인증서가 아직 없다면 Nginx 최초 기동을 위한 임시(Dummy) 인증서 생성
if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    echo ">> 임시 SSL 인증서를 생성합니다..."
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout "$CERT_PATH/privkey.pem" \
        -out "$CERT_PATH/fullchain.pem" \
        -subj "/CN=localhost"
    IS_FIRST_INIT=true
else
    IS_FIRST_INIT=false
fi

echo "=== [2/4] 컨테이너 빌드 및 실행 ==="
docker compose up -d --build

# 최초 기동 시 진짜 Let's Encrypt 인증서 발급 진행
if [ "$IS_FIRST_INIT" = true ]; then
    echo "=== [3/4] Let's Encrypt 정식 SSL 인증서 발급 ==="
    echo ">> 잠시 Nginx 안정화를 위해 5초 대기..."
    sleep 5

    # 기존 임시 인증서 삭제
    rm -rf "$CERT_PATH"

    docker compose run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal

    echo "=== [4/4] Nginx SSL 적용 완료 및 재로드 ==="
    docker compose exec frontend nginx -s reload
fi

echo ""
echo "🎉 배포가 성공적으로 완료되었습니다!"
echo "👉 접속 주소: https://$DOMAIN"
