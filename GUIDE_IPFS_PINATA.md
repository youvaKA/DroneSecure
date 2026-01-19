# 📤 Guide d'Intégration IPFS avec Pinata

Ce guide explique comment obtenir vos clés API Pinata et utiliser le système d'upload IPFS intégré dans DroneSecure.

## 🔑 Obtenir vos Clés API Pinata

### Étape 1: Créer un Compte Pinata

1. Allez sur [https://www.pinata.cloud/](https://www.pinata.cloud/)
2. Cliquez sur "Sign Up" (Inscription)
3. Créez votre compte (gratuit pour commencer)
4. Vérifiez votre email

### Étape 2: Générer les Clés API

1. Connectez-vous à votre compte Pinata
2. Cliquez sur votre profil en haut à droite
3. Allez dans **"API Keys"**
4. Cliquez sur **"New Key"**
5. Configurez les permissions:
   - ✅ **pinFileToIPFS** (pour uploader des fichiers)
   - ✅ **pinJSONToIPFS** (pour uploader du JSON)
   - ❌ Laissez les autres désactivées pour la sécurité
6. Donnez un nom à votre clé: "DroneSecure"
7. Cliquez sur **"Create Key"**

### Étape 3: Sauvegarder les Clés

⚠️ **IMPORTANT:** Vous ne verrez les clés qu'une seule fois!

Copiez et sauvegardez:
- **API Key** (commence souvent par des chiffres et lettres)
- **API Secret** (une longue chaîne de caractères)

📝 **Exemple:**
```
API Key: a1b2c3d4e5f6g7h8i9j0
API Secret: k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2
```

## 🚀 Utiliser l'Upload IPFS dans DroneSecure

### Option 1: Upload Automatique (Recommandé)

1. **Ouvrez l'interface DroneSecure** (http://localhost:8000)
2. **Connectez votre wallet** MetaMask
3. Allez dans l'onglet **"➕ Créer Mission"**
4. Dans la section **"Configuration Pinata"**:
   - Collez votre **API Key Pinata**
   - Collez votre **Secret Key Pinata**
5. Remplissez les métadonnées de la mission:
   - Nom de la mission
   - Type de mission
   - Poids, Portée
   - Villes de départ/destination
   - Durée estimée
   - Cargaison
6. (Optionnel) Uploadez un fichier de plan de vol (PDF/JSON)
7. Cliquez sur **"📤 Uploader vers IPFS"**
8. Attendez la confirmation (quelques secondes)
9. Le CID IPFS sera automatiquement rempli dans le champ
10. Sélectionnez le niveau de ressource
11. Cliquez sur **"🚀 Créer Mission sur la Blockchain"**

### Option 2: Upload Manuel

Si vous préférez uploader vos métadonnées manuellement:

1. Créez un fichier JSON avec vos métadonnées (voir exemple ci-dessous)
2. Allez sur [https://app.pinata.cloud/](https://app.pinata.cloud/)
3. Cliquez sur **"Upload"** → **"File"**
4. Sélectionnez votre fichier JSON
5. Cliquez sur **"Upload"**
6. Copiez le **CID** généré
7. Dans DroneSecure, scrollez jusqu'à **"Option 2: Utiliser un CID IPFS Existant"**
8. Collez le CID dans le champ
9. Sélectionnez le niveau de ressource
10. Cliquez sur **"🚀 Créer Mission sur la Blockchain"**

## 📋 Format des Métadonnées

### Structure JSON Requise

```json
{
    "name": "Mission_Alpha_2026",
    "type": "Urgence Médicale",
    "value": "Niveau 3",
    "hash": "QmP7hdxc...",
    "previousOwners": [],
    "createdAt": "1737052800",
    "lastTransferAt": "1737052800",
    "attributes": {
        "weight": "2kg",
        "range": "15km",
        "priority": "high",
        "departureCity": "Paris",
        "destinationCity": "Lyon",
        "estimatedDuration": "45min",
        "cargo": "Medical supplies"
    },
    "flightPlan": {
        "waypoints": [
            {"lat": 48.8566, "lon": 2.3522},
            {"lat": 47.2173, "lon": -1.5534},
            {"lat": 45.7640, "lon": 4.8357}
        ],
        "altitude": "120m",
        "speed": "25m/s"
    }
}
```

### Champs Obligatoires

- ✅ `name` - Nom unique de la mission
- ✅ `type` - Type de mission
- ✅ `value` - Niveau de ressource (Niveau 1, 2, ou 3)
- ✅ `createdAt` - Timestamp de création
- ✅ `lastTransferAt` - Timestamp du dernier transfert

### Champs Optionnels

- `hash` - Hash IPFS d'un plan de vol détaillé
- `previousOwners` - Liste des anciens propriétaires (géré automatiquement)
- `attributes` - Attributs personnalisés
- `flightPlan` - Plan de vol détaillé

## 🔒 Sécurité

### ⚠️ Bonnes Pratiques

1. **Ne partagez JAMAIS vos clés API** publiquement
2. **Ne commitez JAMAIS vos clés** dans Git
3. **Créez des clés différentes** pour développement et production
4. **Limitez les permissions** aux seules nécessaires
5. **Régénérez vos clés** régulièrement
6. **Supprimez les clés** non utilisées

### 🔐 Stockage des Clés

**Pour le Développement:**
- Entrez les clés directement dans l'interface (elles ne sont pas sauvegardées)
- Les clés restent en mémoire uniquement pendant la session

**Pour la Production:**
- Utilisez des variables d'environnement
- Utilisez un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)
- Considérez un backend intermédiaire pour gérer les uploads

## 💰 Limites et Tarification Pinata

### Plan Gratuit
- ✅ 1 Go de stockage
- ✅ 100,000 requêtes gateway/mois
- ✅ Parfait pour le développement et tests

### Plan Picnic ($20/mois)
- 🚀 20 Go de stockage
- 🚀 500,000 requêtes gateway/mois
- 🚀 Support prioritaire

[Voir tous les plans](https://www.pinata.cloud/pricing)

## 🛠️ Dépannage

### Problème: "Pinata API credentials not set"

**Solution:** Entrez vos clés API dans les champs de configuration

### Problème: "Failed to upload to IPFS"

**Solutions possibles:**
1. Vérifiez que vos clés API sont correctes
2. Vérifiez que vous avez les bonnes permissions activées
3. Vérifiez votre connexion internet
4. Vérifiez que vous n'avez pas dépassé votre quota

### Problème: "Invalid CID format"

**Solution:** 
- Le CID doit commencer par "Qm" (CIDv0) ou "b"/"z" (CIDv1)
- Exemple valide: `QmP7hdxcUCjC5aM6ZgcRvSgMPP9HjL1F9Zr2xVZ1MqQ8Lh`

### Problème: "Le fichier est trop volumineux"

**Solution:**
- Limite Pinata: 100 Mo par fichier (plan gratuit)
- Compressez vos fichiers si nécessaire
- Pour des fichiers plus volumineux, considérez de les diviser

## 📚 Ressources Supplémentaires

- [Documentation Pinata](https://docs.pinata.cloud/)
- [API Pinata Reference](https://docs.pinata.cloud/pinata-api)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Comprendre les CIDs](https://docs.ipfs.tech/concepts/content-addressing/)

## 💡 Astuces

### Vérifier un CID IPFS

Vous pouvez vérifier le contenu d'un CID en visitant:
- https://ipfs.io/ipfs/VOTRE_CID
- https://gateway.pinata.cloud/ipfs/VOTRE_CID

### Exemple de Test Rapide

Utilisez ce CID de test pour votre première mission:
```
QmP7hdxcUCjC5aM6ZgcRvSgMPP9HjL1F9Zr2xVZ1MqQ8Lh
```

Il contient des métadonnées d'exemple valides.

### Upload de Plusieurs Fichiers

Pour un plan de vol complexe:
1. Uploadez d'abord le fichier PDF/JSON du plan de vol
2. Notez le CID généré
3. Incluez ce CID dans le champ `hash` de vos métadonnées
4. Uploadez les métadonnées JSON

## 🎯 Checklist

Avant de créer votre première mission avec IPFS:

- [ ] Compte Pinata créé
- [ ] Clés API générées et sauvegardées
- [ ] Permissions configurées (pinFileToIPFS + pinJSONToIPFS)
- [ ] Clés testées dans l'interface DroneSecure
- [ ] Métadonnées préparées au bon format
- [ ] CID généré avec succès
- [ ] Mission créée sur la blockchain

---

**Besoin d'aide?** Ouvrez une issue sur GitHub ou consultez la documentation complète.

© 2026 DroneSecure - Interface IPFS intégrée
