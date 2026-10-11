#!/bin/bash
set -e

DOMAIN="34-64-159-225.sslip.io"
EMAIL="jetteyak.dev@gmail.com"
CERT_PATH="./certbot/conf/live/$DOMAIN"

echo "=== [0/4] Docker Compose 환경 감지 및 준비 ==="
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif sudo docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="sudo docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif sudo command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="sudo docker-compose"
else
    echo ">> docker-compose 가 없어 설치를 진행합니다..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin docker-compose
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    elif sudo docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="sudo docker compose"
    else
        COMPOSE_CMD="sudo docker-compose"
    fi
fi

echo ">> 사용할 Compose 명령어: $COMPOSE_CMD"

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
$COMPOSE_CMD up -d --build

# 최초 기동 시 진짜 Let's Encrypt 인증서 발급 진행
if [ "$IS_FIRST_INIT" = true ]; then
    echo "=== [3/4] Let's Encrypt 정식 SSL 인증서 발급 ==="
    echo ">> 잠시 Nginx 안정화를 위해 5초 대기..."
    sleep 5

    # 기존 임시 인증서 삭제
    rm -rf "$CERT_PATH"

    $COMPOSE_CMD run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --force-renewal

    echo "=== [4/4] Nginx SSL 적용 완료 및 재로드 ==="
    $COMPOSE_CMD exec frontend nginx -s reload
fi

echo ""
echo "🎉 배포가 성공적으로 완료되었습니다!"
echo "👉 접속 주소: https://$DOMAIN"
