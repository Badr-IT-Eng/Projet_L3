#!/bin/bash

# 🎯 RecovR Lost & Found System - Script de gestion principal
# Un seul script pour tout gérer facilement

echo "🎯 RecovR Lost & Found System"
echo "============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_success() {
    echo -e "${GREEN}$1${NC}"
}

log_warning() {
    echo -e "${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}"
}

# Afficher le menu
show_menu() {
    echo "🎛️  Que souhaitez-vous faire ?"
    echo ""
    echo "1) 🚀 Démarrer tous les services (Front + Back + Python)"
    echo "2) 🛑 Arrêter tous les services"
    echo "3) 📊 Surveiller les services"
    echo "4) 🔄 Redémarrer complètement (arrêt + nettoyage + démarrage)"
    echo "5) 📋 Statut rapide des services"
    echo "6) 📝 Voir les logs en temps réel"
    echo "7) 🧹 Nettoyage complet (cache, builds, logs)"
    echo "8) ❓ Aide et informations"
    echo "9) 🚪 Quitter"
    echo ""
}

# Statut rapide
quick_status() {
    log_info "🔍 Statut rapide des services..."
    echo ""
    
    # Frontend
    if curl -s --max-time 3 http://localhost:3000 &>/dev/null; then
        log_success "✅ Frontend (3000) - Actif"
    else
        log_error "❌ Frontend (3000) - Inactif"
    fi
    
    # Backend
    if curl -s --max-time 3 http://localhost:8082/api/test &>/dev/null; then
        log_success "✅ Backend (8082) - Actif"
    else
        log_error "❌ Backend (8082) - Inactif"
    fi
    
    # Python API
    if curl -s --max-time 3 http://localhost:5002/health &>/dev/null; then
        log_success "✅ Python API (5002) - Actif"
    else
        log_error "❌ Python API (5002) - Inactif"
    fi
    
    echo ""
    log_info "💻 Application web: http://localhost:3000"
}

# Logs en temps réel
show_live_logs() {
    echo ""
    echo "📝 Logs en temps réel - Choisissez le service:"
    echo "1) Frontend (Next.js)"
    echo "2) Backend (Spring Boot)"
    echo "3) Python API (Détection)"
    echo "4) Tous les logs"
    echo ""
    
    read -p "Votre choix (1-4): " log_choice
    
    case $log_choice in
        1)
            if [ -f "logs/frontend.log" ]; then
                log_info "📱 Logs Frontend (Ctrl+C pour arrêter):"
                tail -f logs/frontend.log
            else
                log_error "Fichier de log frontend introuvable"
            fi
            ;;
        2)
            if [ -f "logs/backend.log" ]; then
                log_info "🟢 Logs Backend (Ctrl+C pour arrêter):"
                tail -f logs/backend.log
            else
                log_error "Fichier de log backend introuvable"
            fi
            ;;
        3)
            if [ -f "logs/python-api.log" ]; then
                log_info "🐍 Logs Python API (Ctrl+C pour arrêter):"
                tail -f logs/python-api.log
            else
                log_error "Fichier de log Python API introuvable"
            fi
            ;;
        4)
            log_info "📊 Tous les logs (Ctrl+C pour arrêter):"
            if command -v multitail &> /dev/null; then
                multitail logs/frontend.log logs/backend.log logs/python-api.log
            else
                log_warning "multitail non installé, affichage séquentiel:"
                tail -f logs/*.log
            fi
            ;;
        *)
            log_error "Choix invalide"
            ;;
    esac
}

# Nettoyage complet
clean_all() {
    log_warning "🧹 Nettoyage complet du système..."
    
    # Arrêter les services d'abord
    log_info "Arrêt des services..."
    ./stop_all_services.sh
    
    # Nettoyer les caches
    log_info "Nettoyage des caches..."
    rm -rf .next node_modules/.cache
    rm -rf spring-backend/target
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
    find . -name "*.pyc" -delete 2>/dev/null
    
    # Nettoyer les logs anciens
    log_info "Nettoyage des logs anciens..."
    rm -rf logs/*.log
    
    log_success "✅ Nettoyage terminé!"
}

# Aide
show_help() {
    echo ""
    log_info "❓ AIDE - RecovR Lost & Found System"
    echo "===================================="
    echo ""
    echo "🏗️  ARCHITECTURE:"
    echo "   • Frontend: Next.js (Port 3000)"
    echo "   • Backend: Spring Boot (Port 8082)" 
    echo "   • Python API: Detection IA (Port 5002)"
    echo ""
    echo "📁 STRUCTURE DES FICHIERS:"
    echo "   • ./logs/ - Logs des services"
    echo "   • ./spring-backend/ - API Java"
    echo "   • ./python-detection/ - Service IA"
    echo "   • app/, components/, lib/ - Frontend Next.js"
    echo ""
    echo "🔧 SCRIPTS DISPONIBLES:"
    echo "   • ./recovr.sh - Ce script principal"
    echo "   • ./start_all_services.sh - Démarrage complet"
    echo "   • ./stop_all_services.sh - Arrêt complet"
    echo "   • ./monitor_services.sh - Surveillance avancée"
    echo ""
    echo "🌐 URLS D'ACCÈS:"
    echo "   • Application: http://localhost:3000"
    echo "   • API Backend: http://localhost:8082/api/"
    echo "   • API Python: http://localhost:5002/"
    echo ""
    echo "🛠️  DÉPANNAGE:"
    echo "   • Vérifier les logs: ./recovr.sh puis option 6"
    echo "   • Ports occupés: sudo lsof -i:3000,8082,5002"
    echo "   • Redémarrage complet: ./recovr.sh puis option 4"
    echo ""
}

# Boucle principale
while true; do
    show_menu
    read -p "Votre choix (1-9): " choice
    echo ""
    
    case $choice in
        1)
            log_info "🚀 Démarrage de tous les services..."
            ./start_all_services.sh
            ;;
        2)
            log_info "🛑 Arrêt de tous les services..."
            ./stop_all_services.sh
            ;;
        3)
            log_info "📊 Lancement de la surveillance..."
            ./monitor_services.sh
            ;;
        4)
            log_warning "🔄 Redémarrage complet du système..."
            ./stop_all_services.sh
            sleep 3
            clean_all
            sleep 2
            ./start_all_services.sh
            ;;
        5)
            quick_status
            ;;
        6)
            show_live_logs
            ;;
        7)
            clean_all
            ;;
        8)
            show_help
            ;;
        9)
            log_info "👋 Au revoir!"
            exit 0
            ;;
        *)
            log_error "❌ Choix invalide. Veuillez choisir entre 1 et 9."
            ;;
    esac
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    clear
done