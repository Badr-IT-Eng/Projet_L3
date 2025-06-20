#!/bin/bash

# 🔪 Kill All - Script pour tuer tous les processus RecovR

echo "🔪 Kill All ProcessES RecovR"
echo "============================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${YELLOW}🔪 $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. TUER TOUS LES PROCESSUS NODE.JS (Frontend)
log_info "Killing Frontend Next.js processes..."
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "npm run dev" 2>/dev/null
pkill -9 -f "node.*next" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null

# 2. TUER TOUS LES PROCESSUS JAVA (Backend Spring Boot)
log_info "Killing Backend Spring Boot processes..."
pkill -9 -f "java.*RecovRApplication" 2>/dev/null
pkill -9 -f "mvnw spring-boot:run" 2>/dev/null
pkill -9 -f "java.*spring-boot" 2>/dev/null
pkill -9 -f "spring-boot:run" 2>/dev/null

# 3. TUER TOUS LES PROCESSUS PYTHON (Detection API)
log_info "Killing Python Detection API processes..."
pkill -9 -f "python.*strict_detection_api" 2>/dev/null
pkill -9 -f "flask.*strict" 2>/dev/null
pkill -9 -f "python.*detection" 2>/dev/null
pkill -9 -f "strict_detection_api.py" 2>/dev/null

# 4. TUER PAR PORTS SPÉCIFIQUES
log_info "Killing processes by ports..."

# Port 3000 (Frontend)
PORT_3000=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$PORT_3000" ]; then
    kill -9 $PORT_3000 2>/dev/null
    log_success "Port 3000 libéré"
else
    log_info "Port 3000 déjà libre"
fi

# Port 8082 (Backend)
PORT_8082=$(lsof -ti:8082 2>/dev/null)
if [ ! -z "$PORT_8082" ]; then
    kill -9 $PORT_8082 2>/dev/null
    log_success "Port 8082 libéré"
else
    log_info "Port 8082 déjà libre"
fi

# Port 5002 (Python)
PORT_5002=$(lsof -ti:5002 2>/dev/null)
if [ ! -z "$PORT_5002" ]; then
    kill -9 $PORT_5002 2>/dev/null
    log_success "Port 5002 libéré"
else
    log_info "Port 5002 déjà libre"
fi

# 5. FORCE KILL TOUS LES PROCESSUS RÉCALCITRANTS
log_info "Force killing any remaining processes..."

# Tuer tous les processus Node.js qui contiennent "recovr" ou "lost-found"
pkill -9 -f -i "recovr" 2>/dev/null
pkill -9 -f -i "lost-found" 2>/dev/null

# Tuer tous les processus Maven/Gradle qui traînent
pkill -9 -f "mvnw" 2>/dev/null
pkill -9 -f "gradlew" 2>/dev/null

# 6. NETTOYER LES FICHIERS PID
log_info "Cleaning PID files..."
rm -f logs/*.pid 2>/dev/null
rm -f *.pid 2>/dev/null
rm -f spring-backend/*.pid 2>/dev/null

# 7. VÉRIFICATION FINALE
echo ""
log_info "🔍 Vérification finale..."

# Vérifier les ports
for port in 3000 8082 5002; do
    if lsof -i:$port &>/dev/null; then
        log_error "Port $port encore occupé"
    else
        log_success "Port $port libre"
    fi
done

# Vérifier les processus restants
REMAINING=$(ps aux | grep -E "(next|spring-boot|strict_detection)" | grep -v grep | wc -l)
if [ $REMAINING -eq 0 ]; then
    log_success "Aucun processus RecovR détecté"
else
    log_error "$REMAINING processus encore actifs:"
    ps aux | grep -E "(next|spring-boot|strict_detection)" | grep -v grep
fi

echo ""
echo "🔪 KILL TERMINÉ"
echo "==============="
log_success "Tous les processus RecovR ont été tués!"
log_info "Vous pouvez maintenant relancer avec ./start_all_services.sh"
echo ""