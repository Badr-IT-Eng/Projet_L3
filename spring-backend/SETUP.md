# RECOVR Backend Setup Guide

## 🏗️ Spring Boot Backend pour Système de Détection d'Objets Perdus

Ce backend Spring Boot implémente l'API REST pour votre système de détection et gestion d'objets perdus avec intégration de modèles PyTorch.

## 📋 Prérequis

- **Java 17+** (OpenJDK recommandé)
- **PostgreSQL 12+**
- **Gradle** (fourni via wrapper)
- **Python 3.8+** (pour vos modèles PyTorch)

## 🚀 Installation

### 1. Configuration de la Base de Données

```bash
# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib

# Créer la base de données
sudo -u postgres psql
CREATE DATABASE recovr_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE recovr_db TO postgres;
\q
```

### 2. Configuration du Backend

```bash
cd spring-backend

# Construire le projet
./gradlew build

# Lancer l'application
./gradlew bootRun
```

L'API sera disponible sur `http://localhost:8080`

## 🎯 Endpoints Principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Objets Perdus/Trouvés (selon votre rapport)
- `GET /api/items/public/lost` - Liste des objets perdus
- `GET /api/items/public/found` - Liste des objets trouvés  
- `POST /api/items` - Signaler un objet perdu/trouvé

### Système de Détection (nouveau)
- `POST /api/detection/sessions/start` - Démarrer session de détection
- `POST /api/detection/process` - Traiter résultat de détection PyTorch
- `GET /api/detection/abandoned` - Objets abandonnés détectés
- `GET /api/detection/recent` - Détections récentes

### Recherche par Photo (selon votre rapport)
- `POST /api/search/request` - Recherche par upload photo
- `GET /api/search/results/{id}` - Résultats de recherche
- `GET /api/search/history` - Historique des recherches

## 🔧 Intégration avec vos Modèles PyTorch

### Configuration des Modèles

Vos modèles sont déjà référencés dans `application.properties` :

```properties
# PyTorch Model Configuration
pytorch.model.default=stable_model_epoch_30.pth
pytorch.model.confidence-threshold=0.6
pytorch.tracking.max-disappeared=10
pytorch.tracking.max-distance=50
```

### Interface avec Python

Pour intégrer vos modèles PyTorch, vous pouvez :

1. **Option 1: Microservice Python**
   ```python
   # Exemple d'appel vers votre API
   import requests
   
   detection_result = {
       "sessionId": "session_001_library",
       "trackingId": "TRACK_001_BAG", 
       "category": "BAGS",
       "confidence": 0.89,
       "x": 120, "y": 200, "width": 80, "height": 100,
       "snapshotUrl": "/snapshots/detection.jpg"
   }
   
   response = requests.post(
       "http://localhost:8080/api/detection/process",
       json=detection_result
   )
   ```

2. **Option 2: gRPC Service**
   - Créer un service Python séparé
   - Communiquer via gRPC avec Spring Boot

## 📊 Base de Données

### Tables Principales

- `items` - Objets perdus/trouvés signalés
- `detected_objects` - Objets détectés par caméras
- `detection_sessions` - Sessions de détection caméra
- `search_requests` - Requêtes de recherche par photo
- `image_matching` - Résultats de matching photo-photo

### Données de Test

Le fichier `data.sql` contient des données d'exemple :
- Utilisateurs de test (admin/password123)
- Objets perdus/trouvés d'exemple
- Sessions de détection simulées
- Objets abandonnés détectés

## 🔐 Sécurité

- **JWT Authentication** configuré
- **Spring Security** avec rôles (USER, ADMIN, MODERATOR)
- **CORS** configuré pour développement

### Utilisateurs par défaut
- Admin: `admin` / `admin123`
- Test: `testuser1` / `password123`

## 🐛 Tests et Debug

```bash
# Tests unitaires
./gradlew test

# Logs détaillés
./gradlew bootRun --debug

# Vérifier la santé de l'API
curl http://localhost:8080/api/items/public/lost
```

## 📁 Structure du Projet

```
spring-backend/
├── src/main/java/com/recovr/api/
│   ├── controller/     # Controllers REST
│   │   ├── DetectionController.java    # Détection temps réel
│   │   ├── SearchController.java       # Recherche par photo
│   │   └── ItemController.java         # Objets perdus/trouvés
│   ├── service/        # Services métier
│   │   ├── DetectionService.java       # Logique de détection
│   │   └── SearchService.java          # Logique de recherche
│   ├── entity/         # Entités JPA
│   │   ├── DetectedObject.java         # Objets détectés
│   │   ├── DetectionSession.java       # Sessions caméra
│   │   └── SearchRequest.java          # Requêtes de recherche
│   ├── repository/     # Repositories JPA
│   └── dto/           # Data Transfer Objects
└── src/main/resources/
    ├── application.properties          # Configuration
    └── data.sql                       # Données d'exemple
```

## 🚀 Prochaines Étapes

1. **Intégrer vos modèles PyTorch** dans `DetectionService`
2. **Implémenter le matching photo-photo** dans `SearchService`
3. **Configurer le tracking d'objets** (ByteTrack/StrongSORT)
4. **Déployer avec Docker** (Dockerfile déjà présent)

## 📞 API Documentation

Une fois lancé, la documentation Swagger sera disponible sur :
`http://localhost:8080/swagger-ui.html` (à configurer si besoin)

## 🏆 Status du Projet

✅ **Backend Spring Boot** - Fonctionnel  
✅ **Base de données PostgreSQL** - Configurée  
✅ **API REST** - Endpoints créés  
✅ **Sécurité JWT** - Configurée  
🔄 **Intégration PyTorch** - Prêt pour vos modèles  
🔄 **Matching d'images** - À implémenter  

**Votre système est prêt pour l'intégration avec vos modèles PyTorch !** 🎯 