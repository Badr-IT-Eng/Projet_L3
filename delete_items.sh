#!/bin/bash

# Script pour supprimer des objets de la base de données
# Utilise l'interface web admin

echo "=== Script de suppression d'objets ==="
echo ""

# Vérifier si les services sont en cours d'exécution
echo "Vérification des services..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Le frontend n'est pas accessible sur http://localhost:3000"
    echo "Démarrez d'abord les services avec: ./start_all_services.sh"
    exit 1
fi

if ! curl -s http://localhost:8082/api/items > /dev/null; then
    echo "❌ Le backend n'est pas accessible sur http://localhost:8082"
    echo "Démarrez d'abord les services avec: ./start_all_services.sh"
    exit 1
fi

echo "✅ Services accessibles"
echo ""

# Afficher les options
echo "Choisissez une option:"
echo "1. Ouvrir l'interface admin pour supprimer des objets"
echo "2. Lister tous les objets (via API)"
echo "3. Supprimer tous les objets (ATTENTION!)"
echo "4. Supprimer des objets par catégorie"
echo "5. Utiliser le script Python"
echo "6. Quitter"
echo ""

read -p "Votre choix (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Ouverture de l'interface admin..."
        echo "URL: http://localhost:3000/admin/objects"
        echo ""
        echo "Instructions:"
        echo "1. Connectez-vous en tant qu'admin"
        echo "2. Cliquez sur les 3 points (...) à côté de chaque objet"
        echo "3. Sélectionnez 'Delete'"
        echo "4. Confirmez la suppression"
        echo ""
        echo "Ouvrir dans le navigateur? (o/n): "
        read -p "" open_browser
        if [[ $open_browser =~ ^[Oo]$ ]]; then
            xdg-open http://localhost:3000/admin/objects 2>/dev/null || \
            open http://localhost:3000/admin/objects 2>/dev/null || \
            echo "Impossible d'ouvrir le navigateur automatiquement"
        fi
        ;;
    2)
        echo ""
        echo "📋 Liste des objets dans la base de données:"
        echo "----------------------------------------"
        curl -s http://localhost:8082/api/items | jq -r '.items[] | "ID: \(.id) | Nom: \(.name) | Catégorie: \(.category // "N/A") | Statut: \(.status // "N/A")"' 2>/dev/null || \
        curl -s http://localhost:8082/api/items | python3 -m json.tool
        ;;
    3)
        echo ""
        echo "⚠️  ATTENTION: Cette action supprimera TOUS les objets!"
        echo "Cette action est irréversible."
        read -p "Êtes-vous ABSOLUMENT sûr? (oui/non): " confirm
        if [[ $confirm =~ ^[Oo][Uu][Ii]$ ]]; then
            echo "Suppression de tous les objets..."
            # Récupérer tous les IDs
            ids=$(curl -s http://localhost:8082/api/items | jq -r '.items[].id' 2>/dev/null)
            if [ -z "$ids" ]; then
                echo "Aucun objet trouvé ou erreur lors de la récupération"
                exit 1
            fi
            
            count=0
            for id in $ids; do
                echo "Suppression de l'objet ID: $id"
                response=$(curl -s -X DELETE http://localhost:8082/api/admin/items/$id)
                if [ $? -eq 0 ]; then
                    echo "✅ Supprimé: $id"
                    ((count++))
                else
                    echo "❌ Échec: $id"
                fi
            done
            echo "Suppression terminée. $count objets supprimés."
        else
            echo "Suppression annulée."
        fi
        ;;
    4)
        echo ""
        echo "Suppression par catégorie"
        echo "Catégories disponibles:"
        curl -s http://localhost:8082/api/items | jq -r '.items[].category' | sort | uniq 2>/dev/null || echo "Impossible de récupérer les catégories"
        echo ""
        read -p "Entrez la catégorie à supprimer: " category
        if [ -n "$category" ]; then
            echo "Suppression des objets de la catégorie: $category"
            # Utiliser le script Python pour cette fonctionnalité
            python3 delete_items.py --category "$category" --execute
        fi
        ;;
    5)
        echo ""
        echo "Utilisation du script Python..."
        echo "Options disponibles:"
        echo "  --list                    # Lister tous les objets"
        echo "  --all --execute           # Supprimer tous les objets"
        echo "  --category 'nom' --execute # Supprimer par catégorie"
        echo "  --status 'LOST' --execute # Supprimer par statut"
        echo "  --name 'mot' --execute    # Supprimer par nom"
        echo "  --id 123 --execute        # Supprimer par ID"
        echo ""
        echo "Exemple: python3 delete_items.py --list"
        echo ""
        read -p "Entrez la commande Python: " python_cmd
        if [ -n "$python_cmd" ]; then
            eval "python3 delete_items.py $python_cmd"
        fi
        ;;
    6)
        echo "Au revoir!"
        exit 0
        ;;
    *)
        echo "Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "Script terminé." 