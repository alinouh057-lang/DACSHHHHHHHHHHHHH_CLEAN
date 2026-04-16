# 01. Introduction et Contexte du Projet

## 📋 Présentation Générale

### Qu'est-ce que PV Monitor ?

**PV Monitor** est un système complet de surveillance intelligente des panneaux solaires photovoltaïques. Il détecte automatiquement l'accumulation de poussière et de sable (ensablement) sur les panneaux et alerte les responsables quand un nettoyage est nécessaire.

### Problématique Adressée

Dans les régions désertiques ou semi-arides, l'ensablement des panneaux solaires représente un problème majeur :

- **Perte de production** : Jusqu'à 30-40% de réduction du rendement
- **Nettoyages inutiles** : Coûteux en eau, temps et argent
- **Nettoyages tardifs** : Perte d'énergie non produite
- **Manque de données** : Difficulté à suivre l'état des installations

### Solution Proposée

Notre système apporte une réponse technologique complète :

1. **Surveillance automatique** : Collecte continue de données via ESP32
2. **Analyse IA** : Détection précise du niveau d'ensablement
3. **Alertes intelligentes** : Notifications email selon seuils configurables
4. **Dashboard web** : Visualisation en temps réel des performances
5. **Rapports détaillés** : Historique, statistiques, export de données

---

## 🎯 Objectifs du Système

### Objectif Principal

**Optimiser la maintenance des panneaux solaires** en fournissant des informations précises sur leur état de propreté, permettant ainsi :

- Réduire les pertes de production d'énergie
- Optimiser la fréquence des nettoyages
- Diminuer les coûts de maintenance
- Augmenter le retour sur investissement

### Objectifs Secondaires

| Objectif | Description | Métrique |
|----------|-------------|----------|
| **Précision** | Détection fiable de l'ensablement | >90% de précision |
| **Temps réel** | Mise à jour fréquente des données | Refresh toutes les minutes |
| **Accessibilité** | Interface intuitive et multilingue | Support FR/EN/AR |
| **Évolutivité** | Support de multiples panneaux | Architecture modulaire |
| **Fiabilité** | Système robuste et tolérant aux pannes | Redondance ESP32 |

---

## 🌍 Contexte d'Utilisation

### Environnements Cibles

Le système est conçu pour fonctionner dans :

- **Centrales solaires industrielles** (MW)
- **Installations commerciales** (toitures, parkings)
- **Sites isolés** (zones rurales, désertiques)
- **Recherche et développement** (laboratoires, universités)

### Conditions Climatiques

Particulièrement adapté aux régions :

- **Désertiques** : Sahara, Moyen-Orient, Australie
- **Semi-arides** : Afrique du Nord, Californie, Inde
- **Poussiéreuses** : Zones industrielles, chantiers

---

## 👥 Utilisateurs Cibles

### Profils d'Utilisateurs

| Rôle | Permissions | Cas d'usage |
|------|-------------|-------------|
| **Administrateur** | Accès complet, gestion utilisateurs | Configuration système, administration |
| **Manager** | Supervision, rapports, interventions | Suivi de flotte, planification maintenance |
| **Utilisateur** | Consultation dashboard, historiques | Surveillance quotidienne |

### Scénarios d'Usage

#### Scénario 1 : Centrale Solaire Industrielle
```
Technicien → Consulte dashboard matin
           → Reçoit alerte Critical (75% ensablement)
           → Planifie équipe de nettoyage
           → Vérifie efficacité après intervention
```

#### Scénario 2 : Installation Commerciale
```
Propriétaire → Reçoit email automatique
             → Contacte prestataire de nettoyage
             → Suit l'historique de production
             → Exporte rapports pour comptabilité
```

#### Scénario 3 : Site de Recherche
```
Chercheur → Configure nouveaux capteurs
          → Analyse données historiques
          → Exporte datasets pour études
          → Génère rapports scientifiques
```

---

## 🔬 Innovation Technique

### Apports Principaux

1. **Modèle Hybride IA**
   - Combinaison Deep Learning + Features classiques
   - Plus robuste qu'une approche unique
   - Adaptable à différents types de panneaux

2. **Architecture Dual ESP32**
   - Séparation image / données électriques
   - Synchronisation intelligente
   - Redondance en cas de panne

3. **Système d'Alertes Contextuel**
   - Seuils configurables dynamiquement
   - Cooldowns anti-spam
   - Notifications email personnalisées

4. **Interface Web Moderne**
   - Temps réel avec mises à jour automatiques
   - Internationalisation (i18n)
   - Responsive design (mobile, tablette, desktop)

---

## 📊 Chiffres Clés

### Impact Potentiel

| Métrique | Avant | Avec PV Monitor | Gain |
|----------|-------|-----------------|------|
| Perte due à l'ensablement | 30-40% | <10% | **~70%** |
| Fréquence nettoyages | Hebdomadaire (fixe) | Selon besoin | **~40% économie** |
| Temps de détection | Jours/semaines | Minutes | **~99%** |
| Coût maintenance | Élevé (systématique) | Optimisé | **~30%** |

### Performance Technique

- **Précision modèle IA** : [À compléter avec vos tests]
- **Temps d'analyse** : <2 secondes par image
- **Latence API** : <100ms (hors IA)
- **Disponibilité** : 99.9% (avec bon déploiement)

---

## 🔗 Liens avec les Autres Documents

Ce document d'introduction s'inscrit dans une documentation complète :

- **Architecture** → Voir [`02_architecture_globale.md`](./02_architecture_globale.md)
- **Backend** → Voir [`03_backend_guide_complet.md`](./03_backend_guide_complet.md)
- **IA** → Voir [`04_intelligence_artificielle.md`](./04_intelligence_artificielle.md)
- **Questions Jury** → Voir [`09_qa_soutenance_jury.md`](./09_qa_soutenance_jury.md)

---

## 🎓 Pour la Soutenance

### Points à Mettre en Avant

1. **Problème réel** : L'ensablement est un enjeu économique majeur
2. **Solution complète** : Hardware + Software + IA
3. **Innovation** : Approche hybride unique
4. **Impact** : Gains mesurables en production et coûts

### Questions Probables

**Q: Pourquoi ce sujet ?**  
R: L'ensablement est un problème critique dans les régions ensoleillées, paradoxalement là où le solaire est le plus pertinent.

**Q: Quel est l'apport scientifique ?**  
R: La combinaison de features classiques (interprétables) et de deep learning (puissant) dans un modèle hybride.

**Q: Comment validez-vous les résultats ?**  
R: [Préparer votre protocole de validation : dataset, métriques, comparaison baseline]

---

## 📝 Résumé

**PV Monitor** = Système intelligent qui :
- 📸 Prend des photos de panneaux solaires
- 🤖 Analyse l'ensablement avec une IA hybride
- ⚠️ Alerte quand nettoyer est nécessaire
- 📊 Affiche tout sur un dashboard web moderne
- 📧 Envoie des emails automatiques
- 📈 Suit l'historique et les performances

**Prochaine lecture** : [`02_architecture_globale.md`](./02_architecture_globale.md) pour comprendre comment tous ces éléments s'articulent.
