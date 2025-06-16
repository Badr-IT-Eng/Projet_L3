# Guide d'Authentification RecovR

## 🔐 Système d'Authentification Complet

Cette application utilise **NextAuth.js** pour l'authentification frontend et **Spring Security** avec **JWT** pour l'authentification backend.

## 🚀 Démarrage Rapide

```bash
# Démarrer l'application complète
./start_app.sh

# Arrêter l'application
./stop_app.sh
```

## 👥 Comptes Par Défaut

### Administrateur
- **URL**: http://localhost:3000/admin/login
- **Username**: `admin`
- **Password**: `admin123`
- **Accès**: Panel d'administration complet

### Utilisateur Normal
- **URL**: http://localhost:3000/auth/signin
- **Créer un compte**: http://localhost:3000/auth/register

## 🔧 Architecture d'Authentification

### Frontend (Next.js + NextAuth)
- **NextAuth.js** pour la gestion des sessions
- **Middleware** pour la protection des routes
- **Hooks personnalisés** pour l'authentification

### Backend (Spring Boot + JWT)
- **Spring Security** pour l'authentification
- **JWT tokens** pour l'autorisation
- **Rôles**: ROLE_USER, ROLE_ADMIN

## 📱 Fonctionnalités

### ✅ Authentification
- [x] Login utilisateur
- [x] Login administrateur séparé
- [x] Inscription utilisateur
- [x] Protection des routes par middleware
- [x] Gestion des rôles (USER/ADMIN)
- [x] Sessions persistantes

### ✅ Sécurité
- [x] Mots de passe hashés (BCrypt)
- [x] JWT tokens sécurisés
- [x] Validation côté client et serveur
- [x] Protection CSRF
- [x] Validation des rôles

## 🛣️ Routes Protégées

### Publiques
- `/` - Page d'accueil
- `/auth/signin` - Connexion utilisateur
- `/auth/register` - Inscription
- `/admin/login` - Connexion admin

### Utilisateur Authentifié
- `/dashboard` - Dashboard utilisateur
- `/profile` - Profil utilisateur

### Administrateur Seulement
- `/admin/*` - Panel d'administration
- `/admin/users` - Gestion des utilisateurs
- `/admin/objects` - Gestion des objets

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/signup` - Inscription
- `GET /api/auth/me` - Informations utilisateur courant

### Protégées (JWT requis)
- `GET /api/user/profile` - Profil utilisateur
- `PUT /api/user/profile` - Mise à jour profil

### Admin Seulement
- `GET /api/admin/*` - Endpoints admin

## 💻 Utilisation des Hooks

```tsx
import { useAuth, useRequireAuth, useRequireAdmin } from '@/hooks/use-auth'

// Hook basique
const { user, isAuthenticated, isAdmin, isLoading } = useAuth()

// Forcer l'authentification
const auth = useRequireAuth()

// Forcer l'authentification admin
const adminAuth = useRequireAdmin()
```

## 🎨 Composants d'Authentification

### AuthForm
```tsx
import { AuthForm } from '@/components/auth/auth-form'

// Page de connexion
<AuthForm type="signin" />

// Page d'inscription  
<AuthForm type="register" />
```

## 🔍 Dépannage

### Problèmes Courants

1. **JWT Token invalide**
   - Vérifier que le backend Spring Boot est démarré
   - Vérifier la configuration CORS

2. **Session non persistante**
   - Vérifier NEXTAUTH_SECRET dans .env
   - Vérifier la configuration des cookies

3. **Redirection incorrecte**
   - Vérifier la logique de rôles dans le middleware
   - Vérifier les callbacks NextAuth

### Logs Utiles
```bash
# Backend logs
tail -f backend.log

# Frontend logs  
tail -f frontend.log

# Logs de développement
npm run dev
```

## 🔄 Flow d'Authentification

1. **Connexion utilisateur**:
   ```
   Frontend (NextAuth) → Backend (Spring) → JWT Token → Session
   ```

2. **Protection des routes**:
   ```
   Middleware → Vérification token → Autorisation/Redirection
   ```

3. **API Calls**:
   ```
   Frontend → JWT Header → Backend → Validation → Response
   ```

## 📝 Configuration

### Variables d'Environnement (.env.local)
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Spring Boot (application.properties)
```properties
jwt.secret=mySecretKey
jwt.expirationMs=86400000
```

## 🛡️ Sécurité Best Practices

- ✅ Mots de passe hashés avec BCrypt
- ✅ JWT tokens avec expiration
- ✅ Validation côté client et serveur
- ✅ Protection CSRF activée
- ✅ CORS configuré correctement
- ✅ Rôles et permissions granulaires