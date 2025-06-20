#!/bin/bash

# 📊 Script de surveillance pour RecovR Lost & Found System
# Surveille l'état des services en temps réel

echo "📊 RecovR System - Surveillance des services"
echo "============================================"

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

# Fonction pour vérifier un service
check_service() {
    local url=$1
    local name=$2
    local port=$3
    
    if curl -s --max-time 5 $url &>/dev/null; then
        log_success "$name (Port $port) - Opérationnel"
        return 0
    else
        log_error "$name (Port $port) - Non accessible"
        return 1
    fi
}

# Fonction pour vérifier les processus
check_processes() {
    echo ""
    log_info "🔍 Vérification des processus..."
    
    # Frontend
    if pgrep -f "next dev" &>/dev/null; then
        log_success "Frontend Next.js - Processus actif"
    else
        log_error "Frontend Next.js - Processus non trouvé"
    fi
    
    # Backend
    if pgrep -f "spring-boot" &>/dev/null; then
        log_success "Backend Spring Boot - Processus actif"
    else
        log_error "Backend Spring Boot - Processus non trouvé"
    fi
    
    # Python API
    if pgrep -f "strict_detection_api" &>/dev/null; then
        log_success "API Python - Processus actif"
    else
        log_error "API Python - Processus non trouvé"
    fi
}

# Fonction pour afficher les statistiques des ports
check_ports() {
    echo ""
    log_info "🔌 Vérification des ports..."
    
    for port in 3000 8082 5002; do
        if lsof -i:$port &>/dev/null; then
            local process=$(lsof -i:$port | tail -n 1 | awk '{print $1}')
            log_success "Port $port - Occupé par $process"
        else
            log_error "Port $port - Libre (service non démarré)"
        fi
    done
}

# Fonction pour afficher les logs récents
show_recent_logs() {
    echo ""
    log_info "📝 Logs récents (dernières 5 lignes)..."
    
    if [ -f "logs/frontend.log" ]; then
        echo ""
        echo "🎨 Frontend:"
        tail -n 5 logs/frontend.log
    fi
    
    if [ -f "logs/backend.log" ]; then
        echo ""
        echo "🟢 Backend:"
        tail -n 5 logs/backend.log
    fi
    
    if [ -f "logs/python-api.log" ]; then
        echo ""
        echo "🐍 Python API:"
        tail -n 5 logs/python-api.log
    fi
}

# Fonction de surveillance continue
monitor_continuous() {
    log_info "🔄 Surveillance continue activée (Ctrl+C pour arrêter)"
    echo ""
    
    while true; do
        clear
        echo "📊 RecovR System - Surveillance en temps réel"
        echo "=============================================="
        echo "$(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        # Vérifier les services
        log_info "🌐 État des services web:"
        check_service "http://localhost:3000" "Frontend Next.js" "3000"
        check_service "http://localhost:8082/api/test" "Backend Spring Boot" "8082"
        check_service "http://localhost:5002/health" "API Python" "5002"
        
        # Vérifier les processus
        check_processes
        
        # Vérifier les ports
        check_ports
        
        echo ""
        echo "⏱️  Prochaine vérification dans 10 secondes..."
        echo "🛑 Appuyez sur Ctrl+C pour arrêter la surveillance"
        
        sleep 10
    done
}

# Menu principal
echo ""
echo "Que souhaitez-vous faire ?"
echo "1) Vérification unique des services"
echo "2) Surveillance continue"
echo "3) Afficher les logs récents"
echo "4) Redémarrer un service spécifique"
echo "5) Quitter"
echo ""

read -p "Votre choix (1-5): " choice

case $choice in
    1)
        echo ""
        log_info "🔍 Vérification unique des services..."
        
        check_service "http://localhost:3000" "Frontend Next.js" "3000"
        check_service "http://localhost:8082/api/test" "Backend Spring Boot" "8082" 
        check_service "http://localhost:5002/health" "API Python" "5002"
        
        check_processes
        check_ports
        ;;
        
    2)
        monitor_continuous
        ;;
        
    3)
        show_recent_logs
        ;;
        
    4)
        echo ""
        echo "Quel service redémarrer ?"
        echo "1) Frontend (Next.js)"
        echo "2) Backend (Spring Boot)"
        echo "3) API Python"
        echo ""
        
        read -p "Votre choix (1-3): " service_choice
        
        case $service_choice in
            1)
                log_info "🔄 Redémarrage du Frontend..."
                pkill -f "next dev"
                sleep 3
                nohup npm run dev > logs/frontend.log 2>&1 &
                log_success "Frontend redémarré"
                ;;
            2)
                log_info "🔄 Redémarrage du Backend..."
                pkill -f "spring-boot"
                sleep 5
                cd spring-backend
                nohup ./mvnw spring-boot:run > ../logs/backend.log 2>&1 &
                cd ..
                log_success "Backend redémarré"
                ;;
            3)
                log_info "🔄 Redémarrage de l'API Python..."
                pkill -f "strict_detection_api"
                sleep 3
                cd python-detection
                nohup python3 strict_detection_api.py > ../logs/python-api.log 2>&1 &
                cd ..
                log_success "API Python redémarrée"
                ;;
            *)
                log_error "Choix invalide"
                ;;
        esac
        ;;
        
    5)
        log_info "Au revoir! 👋"
        exit 0
        ;;
        
    *)
        log_error "Choix invalide"
        exit 1
        ;;
esac

echo ""
log_info "Surveillance terminée. Services RecovR en cours d'exécution."