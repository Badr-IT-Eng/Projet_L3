#!/usr/bin/env python3
"""
Script pour supprimer des objets de la base de données
Usage: python delete_items.py [options]
"""

import requests
import json
import sys
import argparse
from typing import List, Optional

# Configuration
API_BASE_URL = "http://localhost:8082/api"
ADMIN_ITEMS_URL = f"{API_BASE_URL}/admin/items"
ITEMS_URL = f"{API_BASE_URL}/items"

def get_all_items() -> List[dict]:
    """Récupère tous les objets de la base de données"""
    try:
        response = requests.get(ITEMS_URL)
        response.raise_for_status()
        data = response.json()
        return data.get('items', [])
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la récupération des objets: {e}")
        return []

def delete_item(item_id: int) -> bool:
    """Supprime un objet par son ID"""
    try:
        response = requests.delete(f"{ADMIN_ITEMS_URL}/{item_id}")
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la suppression de l'objet {item_id}: {e}")
        return False

def delete_items_by_criteria(category: Optional[str] = None, status: Optional[str] = None, 
                           name_contains: Optional[str] = None, dry_run: bool = True) -> None:
    """Supprime les objets selon les critères spécifiés"""
    items = get_all_items()
    
    if not items:
        print("Aucun objet trouvé dans la base de données.")
        return
    
    # Filtrer les objets selon les critères
    filtered_items = []
    for item in items:
        match = True
        
        if category and item.get('category') != category:
            match = False
        if status and item.get('status') != status:
            match = False
        if name_contains and name_contains.lower() not in item.get('name', '').lower():
            match = False
            
        if match:
            filtered_items.append(item)
    
    if not filtered_items:
        print("Aucun objet ne correspond aux critères spécifiés.")
        return
    
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Objets à supprimer ({len(filtered_items)}):")
    print("-" * 80)
    
    for item in filtered_items:
        print(f"ID: {item['id']} | Nom: {item['name']} | Catégorie: {item.get('category', 'N/A')} | Statut: {item.get('status', 'N/A')}")
    
    if dry_run:
        print(f"\n[DRY RUN] {len(filtered_items)} objets seraient supprimés.")
        print("Pour effectuer la suppression, utilisez --execute")
        return
    
    # Demander confirmation
    confirm = input(f"\nÊtes-vous sûr de vouloir supprimer {len(filtered_items)} objets ? (oui/non): ")
    if confirm.lower() not in ['oui', 'yes', 'o', 'y']:
        print("Suppression annulée.")
        return
    
    # Supprimer les objets
    deleted_count = 0
    for item in filtered_items:
        if delete_item(item['id']):
            print(f"✓ Supprimé: {item['name']} (ID: {item['id']})")
            deleted_count += 1
        else:
            print(f"✗ Échec: {item['name']} (ID: {item['id']})")
    
    print(f"\nSuppression terminée. {deleted_count}/{len(filtered_items)} objets supprimés.")

def delete_all_items(dry_run: bool = True) -> None:
    """Supprime tous les objets de la base de données"""
    items = get_all_items()
    
    if not items:
        print("Aucun objet à supprimer.")
        return
    
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Tous les objets ({len(items)}) seront supprimés.")
    
    if dry_run:
        print("Pour effectuer la suppression, utilisez --execute --all")
        return
    
    # Demander confirmation
    confirm = input(f"\nATTENTION: Êtes-vous ABSOLUMENT sûr de vouloir supprimer TOUS les {len(items)} objets ? (oui/non): ")
    if confirm.lower() not in ['oui', 'yes', 'o', 'y']:
        print("Suppression annulée.")
        return
    
    # Supprimer tous les objets
    deleted_count = 0
    for item in items:
        if delete_item(item['id']):
            print(f"✓ Supprimé: {item['name']} (ID: {item['id']})")
            deleted_count += 1
        else:
            print(f"✗ Échec: {item['name']} (ID: {item['id']})")
    
    print(f"\nSuppression terminée. {deleted_count}/{len(items)} objets supprimés.")

def list_items() -> None:
    """Liste tous les objets de la base de données"""
    items = get_all_items()
    
    if not items:
        print("Aucun objet trouvé dans la base de données.")
        return
    
    print(f"\nObjets dans la base de données ({len(items)}):")
    print("-" * 80)
    
    for item in items:
        print(f"ID: {item['id']} | Nom: {item['name']} | Catégorie: {item.get('category', 'N/A')} | Statut: {item.get('status', 'N/A')}")

def main():
    parser = argparse.ArgumentParser(description="Script pour supprimer des objets de la base de données")
    parser.add_argument("--list", action="store_true", help="Lister tous les objets")
    parser.add_argument("--all", action="store_true", help="Supprimer tous les objets")
    parser.add_argument("--category", help="Supprimer les objets d'une catégorie spécifique")
    parser.add_argument("--status", help="Supprimer les objets d'un statut spécifique")
    parser.add_argument("--name", help="Supprimer les objets dont le nom contient cette chaîne")
    parser.add_argument("--execute", action="store_true", help="Exécuter la suppression (par défaut: dry run)")
    parser.add_argument("--id", type=int, help="Supprimer un objet par son ID")
    
    args = parser.parse_args()
    
    # Mode par défaut: dry run
    dry_run = not args.execute
    
    if args.list:
        list_items()
    elif args.id:
        if dry_run:
            print(f"[DRY RUN] L'objet avec l'ID {args.id} serait supprimé.")
            print("Pour effectuer la suppression, utilisez --execute")
        else:
            if delete_item(args.id):
                print(f"Objet {args.id} supprimé avec succès.")
            else:
                print(f"Échec de la suppression de l'objet {args.id}.")
    elif args.all:
        delete_all_items(dry_run)
    elif args.category or args.status or args.name:
        delete_items_by_criteria(
            category=args.category,
            status=args.status,
            name_contains=args.name,
            dry_run=dry_run
        )
    else:
        print("Aucune action spécifiée. Utilisez --help pour voir les options disponibles.")
        print("\nExemples d'utilisation:")
        print("  python delete_items.py --list                    # Lister tous les objets")
        print("  python delete_items.py --category 'electronics'  # Voir les objets électroniques")
        print("  python delete_items.py --category 'electronics' --execute  # Supprimer les objets électroniques")
        print("  python delete_items.py --all --execute           # Supprimer tous les objets")
        print("  python delete_items.py --id 123 --execute        # Supprimer l'objet avec l'ID 123")

if __name__ == "__main__":
    main() 