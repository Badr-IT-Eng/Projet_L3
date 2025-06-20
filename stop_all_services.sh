#!/bin/bash

# 🛑 Script d'arrêt complet pour RecovR Lost & Found System
# Tue tous les processus et nettoie les ressources

echo "🛑 RecovR System - Arrêt complet des services"
echo "=============================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. ARRÊTER LES SERVICES VIA PIDS SAUVEGARDÉS
if [ -f "logs/services.pid" ]; then
    log_info "📋 Arrêt des services via PIDs sauvegardés..."
    
    source logs/services.pid
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null && log_success "Frontend arrêté (PID: $FRONTEND_PID)"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null && log_success "Backend arrêté (PID: $BACKEND_PID)"
    fi
    
    if [ ! -z "$PYTHON_PID" ]; then
        kill -TERM $PYTHON_PID 2>/dev/null && log_success "API Python arrêtée (PID: $PYTHON_PID)"
    fi
    
    sleep 3
fi

# 2. FORCER L'ARRÊT DES PROCESSUS RÉCALCITRANTS
log_info "🔪 Force kill des processus récalcitrants..."

# Tuer les processus Node.js (Frontend)
log_info "Arrêt forcé du frontend Next.js..."
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "npm run dev" 2>/dev/null
pkill -9 -f "node.*next" 2>/dev/null

# Tuer les processus Java (Backend Spring Boot)
log_info "Arrêt forcé du backend Spring Boot..."
pkill -9 -f "java.*RecovRApplication" 2>/dev/null
pkill -9 -f "mvnw spring-boot:run" 2>/dev/null
pkill -9 -f "java.*spring-boot" 2>/dev/null

# Tuer les processus Python (Detection API)
log_info "Arrêt forcé de l'API Python de détection..."
pkill -9 -f "python.*strict_detection_api" 2>/dev/null
pkill -9 -f "flask.*strict" 2>/dev/null
pkill -9 -f "python.*detection" 2>/dev/null

# 3. LIBÉRER LES PORTS
log_info "🔌 Libération des ports..."

# Ports principaux
for port in 3000 8082 5002; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill -9 $pid 2>/dev/null
        log_success "Port $port libéré"
    fi
done

# 4. NETTOYAGE DES FICHIERS TEMPORAIRES
log_info "🧹 Nettoyage des fichiers temporaires..."

# Supprimer les fichiers PID
rm -f logs/services.pid
rm -f logs/*.pid
rm -f *.pid
rm -f spring-backend/*.pid

# Nettoyer les logs anciens (garder les derniers)
if [ -d "logs" ]; then
    find logs -name "*.log" -mtime +7 -delete 2>/dev/null
fi

log_success "Fichiers temporaires nettoyés"

# 5. VÉRIFICATION FINALE
log_info "🔍 Vérification finale..."

sleep 2

# Vérifier que les ports sont libres
ports_libre=true
for port in 3000 8082 5002; do
    if lsof -i:$port &>/dev/null; then
        log_warning "Port $port encore occupé"
        ports_libre=false
    else
        log_success "Port $port libre"
    fi
done

# Vérifier qu'il n'y a plus de processus
remaining_processes=$(ps aux | grep -E "(next dev|spring-boot|strict_detection_api)" | grep -v grep | wc -l)
if [ $remaining_processes -eq 0 ]; then
    log_success "Aucun processus résiduel détecté"
else
    log_warning "$remaining_processes processus encore actifs"
    echo "Processus restants:"
    ps aux | grep -E "(next dev|spring-boot|strict_detection_api)" | grep -v grep
fi

echo ""
echo "======================================"
echo "🏁 ARRÊT TERMINÉ"
echo "======================================"

if [ "$ports_libre" = true ] && [ $remaining_processes -eq 0 ]; then
    log_success "🎉 Tous les services RecovR ont été arrêtés avec succès!"
    log_info "Vous pouvez maintenant relancer avec ./start_all_services.sh"
else
    log_warning "⚠️  Arrêt partiel - vérifiez manuellement les processus restants"
    echo ""
    echo "🛠️  Commandes de diagnostic:"
    echo "   ps aux | grep -E '(next|java|python)'"
    echo "   lsof -i:3000,8082,5002"
    echo ""
    echo "🔧 Arrêt manuel forcé:"
    echo "   sudo pkill -9 -f 'next|java|python'"
    echo "   sudo fuser -k 3000/tcp 8082/tcp 5002/tcp"
fi

echo ""