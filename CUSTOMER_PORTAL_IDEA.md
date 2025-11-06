# Idée : Portail Client pour Suivi de Crédit

## Concept
Permettre aux clients de suivre leur crédit via une page publique accessible avec un code unique.

## Fonctionnalités Proposées

### 1. Page de Suivi Client (`/customer-track/:customerId`)
- Accès via un lien unique ou code d'accès
- Affichage du crédit actuel :
  - Montant restant
  - Date d'échéance
  - Statut (Actif, Payé, En retard)
  - Progression du paiement
- Historique des transactions :
  - Liste des paiements effectués
  - Augmentations de crédit
  - Dates et montants
- Possibilité de télécharger un reçu PDF

### 2. Authentification Simple
- **Option A** : Code d'accès unique (ex: `CUST-1234-ABCD`)
  - Généré automatiquement lors de la création du client
  - Stocké dans le schéma Customer
  - Partageable par SMS/WhatsApp/Email

- **Option B** : Téléphone + Code PIN
  - Client saisit son numéro de téléphone
  - Reçoit un code PIN par SMS
  - Connexion avec le code

### 3. Interface Client
- Design simple et responsive
- Support multilingue (AR/FR/EN)
- Affichage du logo du magasin
- Informations de contact du magasin

## Schéma de Données Proposé

### Modification du Customer Schema
```typescript
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  accessCode: z.string().optional(), // Code d'accès unique
  userId: z.string(),
  createdAt: z.number(),
});
```

## Routes Proposées

1. `/customer-track` - Page d'accès (saisie du code)
2. `/customer-track/:customerId` - Page de suivi du crédit
3. `/customer-track/:customerId/receipt/:paymentId` - Téléchargement du reçu

## Sécurité

- Les données sont en lecture seule pour les clients
- Pas de modification possible des crédits
- Code d'accès unique par client
- Option : expiration du code après X jours

## Avantages

✅ Simple à utiliser pour les clients
✅ Pas besoin de créer un compte
✅ Accès rapide via lien/code
✅ Réduit les appels de suivi
✅ Améliore la transparence

## Implémentation Étape par Étape

1. **Étape 1** : Ajouter `accessCode` au schéma Customer
2. **Étape 2** : Générer automatiquement le code lors de la création
3. **Étape 3** : Créer la page `/customer-track`
4. **Étape 4** : Créer l'interface de suivi
5. **Étape 5** : Ajouter bouton "Partager lien" dans la page Customers
6. **Étape 6** : Mettre à jour les règles Firestore pour autoriser la lecture

## Exemple d'Interface

```
┌─────────────────────────────────────┐
│  [Logo Magasin]                     │
│  Suivi de Votre Crédit              │
├─────────────────────────────────────┤
│                                      │
│  Montant Restant                    │
│  150.00 DT                          │
│                                      │
│  Date d'échéance: 15 Jan 2025       │
│  Statut: Actif                      │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Historique des Transactions        │
│  • 05 Jan - Paiement: 50 DT        │
│  • 01 Jan - Crédit: 200 DT         │
│                                      │
│  [Télécharger Reçu]                 │
└─────────────────────────────────────┘
```

