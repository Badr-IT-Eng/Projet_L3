# 🎯 RecovR Scripts - Guide d'utilisation

## 📋 Scripts disponibles

### 1. **`./recovr.sh`** - Script principal (RECOMMANDÉ)
**Le plus simple à utiliser !** Menu interactif pour tout gérer.

```bash
./recovr.sh
```

**Menu disponible :**
- 🚀 Démarrer tous les services
- 🛑 Arrêter tous les services  
- 📊 Surveiller les services
- 🔄 Redémarrage complet
- 📋 Statut rapide
- 📝 Logs en temps réel
- 🧹 Nettoyage complet

---

### 2. **`./start_all_services.sh`** - Démarrage complet
Lance tous les services dans l'ordre correct.

```bash
./start_all_services.sh
```

**Ce qu'il fait :**
1. ❌ Tue tous les processus existants
2. 🧹 Nettoie les caches et builds
3. 🔍 Vérifie les dépendances
4. 🚀 Lance Backend Spring Boot (port 8082)
5. 🐍 Lance Python Detection API (port 5002)  
6. 🎨 Lance Frontend Next.js (port 3000)
7. ✅ Vérifie que tout fonctionne

---

### 3. **`./stop_all_services.sh`** - Arrêt complet
Arrête proprement tous les services.

```bash
./stop_all_services.sh
```

**Ce qu'il fait :**
1. 🛑 Arrêt gracieux via PIDs sauvegardés
2. 🔪 Force kill des processus récalcitrants
3. 🔌 Libère tous les ports (3000, 8082, 5002)
4. 🧹 Nettoie les fichiers temporaires

---

### 4. **`./monitor_services.sh`** - Surveillance avancée
Surveille l'état des services en temps réel.

```bash
./monitor_services.sh
```

**Options disponibles :**
- Vérification unique
- Surveillance continue (auto-refresh)
- Affichage des logs récents
- Redémarrage de services individuels

---

## 🚀 Démarrage rapide

### Pour démarrer le système complet :
```bash
# Option 1: Script principal (RECOMMANDÉ)
./recovr.sh
# Puis choisir l'option 1

# Option 2: Script direct  
./start_all_services.sh
```

### Pour arrêter le système :
```bash
# Option 1: Script principal
./recovr.sh
# Puis choisir l'option 2

# Option 2: Script direct
./stop_all_services.sh
```

### Pour surveiller :
```bash
./recovr.sh
# Puis choisir l'option 3 ou 5
```

---

## 🌐 Accès aux services

Une fois démarrés, les services sont accessibles à :

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur principale |
| **Backend API** | http://localhost:8082/api | API REST Spring Boot |
| **Python Detection** | http://localhost:5002 | API de détection IA |

---

## 📁 Structure des logs

Les logs sont automatiquement créés dans `./logs/` :

```
logs/
├── frontend.log      # Logs Next.js
├── backend.log       # Logs Spring Boot  
├── python-api.log    # Logs Python Detection
├── services.pid      # PIDs des processus
└── *.pid            # Fichiers PID individuels
```

---

## 🔧 Dépannage

### ❗ Problèmes courants

**🚫 Port déjà utilisé :**
```bash
# Vérifier les ports occupés
sudo lsof -i:3000,8082,5002

# Forcer l'arrêt
./stop_all_services.sh
```

**🐛 Service ne démarre pas :**
```bash
# Voir les logs détaillés
./recovr.sh
# Option 6 pour les logs en temps réel

# Ou directement :
tail -f logs/frontend.log
tail -f logs/backend.log  
tail -f logs/python-api.log
```

**🧹 Problèmes de cache :**
```bash
# Nettoyage complet
./recovr.sh
# Option 7 pour nettoyage

# Ou redémarrage complet
./recovr.sh  
# Option 4 pour redémarrage complet
```

**🔄 Redémarrer un seul service :**
```bash
./monitor_services.sh
# Choisir l'option 4 pour redémarrage individuel
```

---

## ⚡ Commandes utiles

### Vérification rapide de l'état :
```bash
# Statut des services
curl -s http://localhost:3000 && echo "✅ Frontend OK"
curl -s http://localhost:8082/api/test && echo "✅ Backend OK"  
curl -s http://localhost:5002/health && echo "✅ Python OK"

# Processus actifs
ps aux | grep -E "(next|spring-boot|python.*strict)"

# Ports occupés
lsof -i:3000,8082,5002
```

### Logs en direct :
```bash
# Tous les logs
tail -f logs/*.log

# Log spécifique
tail -f logs/frontend.log
tail -f logs/backend.log
tail -f logs/python-api.log
```

---

## 🎯 Workflow recommandé

### 🌅 Démarrage de journée :
```bash
./recovr.sh
# Option 1: Démarrer tous les services
# Option 5: Vérifier le statut
```

### 💻 Pendant le développement :
```bash
./recovr.sh
# Option 6: Surveiller les logs
# Option 3: Surveillance continue
```

### 🌙 Fin de journée :
```bash
./recovr.sh  
# Option 2: Arrêter tous les services
```

### 🔧 En cas de problème :
```bash
./recovr.sh
# Option 4: Redémarrage complet
# Option 7: Nettoyage si nécessaire
```

---

## 🎊 Prêt pour le client !

Le système est maintenant **100% opérationnel** avec :
- ✅ Scripts automatisés pour toute la gestion
- ✅ Surveillance et monitoring intégrés  
- ✅ Logs détaillés pour le debug
- ✅ Nettoyage et maintenance automatiques
- ✅ Interface simple avec `./recovr.sh`

**🚀 Pour démarrer immédiatement :**
```bash
./recovr.sh
```