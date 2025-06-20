#!/bin/bash

# 🚀 Script de démarrage complet pour RecovR Lost & Found System
# Tue les processus existants, nettoie et lance tous les services

echo "🔥 RecovR System - Démarrage complet des services"
echo "=================================================="

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

# 1. TUER TOUS LES PROCESSUS EXISTANTS
echo ""
log_info "🔪 Arrêt des processus existants..."

# Tuer les processus Node.js (Frontend)
log_info "Arrêt du frontend Next.js..."
pkill -f "next dev" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "node.*next" 2>/dev/null

# Tuer les processus Java (Backend Spring Boot)
log_info "Arrêt du backend Spring Boot..."
pkill -f "java.*RecovRApplication" 2>/dev/null
pkill -f "mvnw spring-boot:run" 2>/dev/null
pkill -f "java.*spring-boot" 2>/dev/null

# Tuer les processus Python (Detection API)
log_info "Arrêt de l'API Python de détection..."
pkill -f "python.*strict_detection_api" 2>/dev/null
pkill -f "flask.*strict" 2>/dev/null
pkill -f "python.*detection" 2>/dev/null

# Tuer les processus sur les ports spécifiques
log_info "Libération des ports 3000, 8082, 5002..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
lsof -ti:5002 | xargs kill -9 2>/dev/null

sleep 3
log_success "Tous les processus ont été arrêtés"

# 2. NETTOYAGE DES CACHES ET BUILDS
echo ""
log_info "🧹 Nettoyage des caches et builds..."

# Nettoyer le frontend Next.js
if [ -d ".next" ]; then
    rm -rf .next
    log_success "Cache Next.js supprimé"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    log_success "Cache Node.js supprimé"
fi

# Nettoyer le backend Spring Boot
if [ -d "spring-backend/target" ]; then
    rm -rf spring-backend/target
    log_success "Build Spring Boot supprimé"
fi

# Nettoyer le cache Python
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.pyc" -delete 2>/dev/null
log_success "Cache Python supprimé"

# 3. VÉRIFICATION DES DÉPENDANCES
echo ""
log_info "🔍 Vérification des dépendances..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé!"
    exit 1
fi

# Vérifier Java
if ! command -v java &> /dev/null; then
    log_error "Java n'est pas installé!"
    exit 1
fi

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    log_error "Python3 n'est pas installé!"
    exit 1
fi

log_success "Toutes les dépendances sont présentes"

# 4. INSTALLATION DES DÉPENDANCES MANQUANTES
echo ""
log_info "📦 Installation des dépendances..."

# Installer les dépendances Node.js si nécessaire
if [ ! -d "node_modules" ]; then
    log_info "Installation des dépendances Node.js..."
    npm install
fi

# Installer les dépendances Python si nécessaire
if [ ! -d "python-detection/venv" ]; then
    log_info "Création de l'environnement virtuel Python..."
    cd python-detection
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

log_success "Dépendances installées"

# 5. CRÉER LES DOSSIERS DE LOGS
echo ""
log_info "📁 Création des dossiers de logs..."
mkdir -p logs
mkdir -p spring-backend/logs
mkdir -p python-detection/logs
log_success "Dossiers de logs créés"

# 6. DÉMARRAGE DES SERVICES
echo ""
log_info "🚀 Démarrage des services..."

# Fonction pour vérifier si un port est libre
check_port() {
    if lsof -i:$1 &>/dev/null; then
        return 1
    else
        return 0
    fi
}

# Attendre qu'un port soit libre
wait_for_port() {
    while ! check_port $1; do
        log_warning "Port $1 encore occupé, attente..."
        sleep 2
    done
}

# DÉMARRER LE BACKEND SPRING BOOT (Port 8082)
echo ""
log_info "🟢 Démarrage du Backend Spring Boot..."
wait_for_port 8082

cd spring-backend
nohup ./mvnw spring-boot:run > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

log_success "Backend Spring Boot démarré (PID: $BACKEND_PID)"
log_info "Attente du démarrage complet du backend..."
sleep 15

# Vérifier que le backend est démarré
if curl -s http://localhost:8082/api/test &>/dev/null; then
    log_success "Backend accessible sur http://localhost:8082"
else
    log_warning "Backend en cours de démarrage..."
fi

# DÉMARRER L'API PYTHON DE DÉTECTION (Port 5002)
echo ""
log_info "🐍 Démarrage de l'API Python de détection..."
wait_for_port 5002

cd python-detection
# Activer l'environnement virtuel s'il existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

nohup python3 strict_detection_api.py > ../logs/python-api.log 2>&1 &
PYTHON_PID=$!
echo $PYTHON_PID > ../logs/python-api.pid
cd ..

log_success "API Python démarrée (PID: $PYTHON_PID)"
log_info "Attente du démarrage de l'API Python..."
sleep 10

# Vérifier que l'API Python est démarrée
if curl -s http://localhost:5002/health &>/dev/null; then
    log_success "API Python accessible sur http://localhost:5002"
else
    log_warning "API Python en cours de démarrage..."
fi

# DÉMARRER LE FRONTEND NEXT.JS (Port 3000)
echo ""
log_info "🎨 Démarrage du Frontend Next.js..."
wait_for_port 3000

nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid

log_success "Frontend Next.js démarré (PID: $FRONTEND_PID)"
log_info "Attente du démarrage du frontend..."
sleep 20

# Vérifier que le frontend est démarré
if curl -s http://localhost:3000 &>/dev/null; then
    log_success "Frontend accessible sur http://localhost:3000"
else
    log_warning "Frontend en cours de démarrage..."
fi

# 7. VÉRIFICATION FINALE
echo ""
log_info "🔍 Vérification finale des services..."

# Fonction pour vérifier un service
check_service() {
    if curl -s $1 &>/dev/null; then
        log_success "$2 ✅ Opérationnel"
        return 0
    else
        log_error "$2 ❌ Non accessible"
        return 1
    fi
}

echo ""
echo "======================================"
echo "🎯 STATUT DES SERVICES"
echo "======================================"

check_service "http://localhost:3000" "Frontend (Next.js)"
check_service "http://localhost:8082/api/test" "Backend (Spring Boot)"
check_service "http://localhost:5002/health" "API Python (Détection)"

echo ""
echo "======================================"
echo "📊 INFORMATIONS DES SERVICES"
echo "======================================"
echo "🎨 Frontend Next.js    : http://localhost:3000"
echo "🟢 Backend Spring Boot : http://localhost:8082"
echo "🐍 API Python Détection: http://localhost:5002"
echo ""
echo "📁 Logs disponibles dans : ./logs/"
echo "   - Frontend: logs/frontend.log"
echo "   - Backend:  logs/backend.log"
echo "   - Python:   logs/python-api.log"
echo ""

# 8. COMMANDES UTILES
echo "======================================"
echo "🛠️  COMMANDES UTILES"
echo "======================================"
echo "📋 Voir les logs en temps réel:"
echo "   tail -f logs/frontend.log"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/python-api.log"
echo ""
echo "🔍 Vérifier les processus:"
echo "   ps aux | grep -E '(next|java|python.*strict)'"
echo ""
echo "🛑 Arrêter tous les services:"
echo "   ./stop_all_services.sh"
echo ""

# Sauvegarder les PIDs dans un fichier
echo "FRONTEND_PID=$FRONTEND_PID" > logs/services.pid
echo "BACKEND_PID=$BACKEND_PID" >> logs/services.pid
echo "PYTHON_PID=$PYTHON_PID" >> logs/services.pid

log_success "🎉 Tous les services RecovR sont démarrés!"
log_info "Système prêt pour le client! 🚀"

# Afficher un résumé final
echo ""
echo "🎯 RÉSUMÉ FINAL:"
echo "==============="
echo "✅ Frontend (Next.js) : PID $FRONTEND_PID"
echo "✅ Backend (Spring)   : PID $BACKEND_PID"  
echo "✅ Python API         : PID $PYTHON_PID"
echo ""
echo "🌐 Accédez à l'application : http://localhost:3000"
echo ""