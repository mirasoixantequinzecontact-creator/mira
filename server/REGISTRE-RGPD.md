# Registre des traitements — Mira

Document interne (RGPD, art. 30). À tenir à jour et à présenter à la CNIL en cas de contrôle.
Ne pas publier sur le site.

**Responsable du traitement** : [prénom nom], entrepreneur individuel (EI), nom commercial « Mira » — [adresse] — mira.soixantequinze.contact@gmail.com
**Dernière mise à jour** : [date]

---

## 1. Demandes de contact (formulaire « Être rappelé »)

| | |
|---|---|
| Finalité | Répondre aux demandes et recontacter les prospects |
| Base légale | Consentement (case obligatoire, horodaté dans `requests.consent_at`) + mesures précontractuelles |
| Personnes concernées | Prospects |
| Données | Prénom, nom, entreprise, e-mail, téléphone, situation, message, créneau de rappel |
| Destinataires | Équipe Mira (espace équipe) ; hébergeur [nom] |
| Transferts hors UE | Aucun par le site. E-mails reçus via Gmail (Google, Data Privacy Framework) |
| Conservation | 3 ans — suppression automatique (`purgeOldRequests` dans `server.js`) |
| Sécurité | Accès réservé au rôle « équipe », HTTPS, limitation des envois, anti-robots |

## 1 bis. Prise de RDV en ligne (agenda du site)

| | |
|---|---|
| Finalité | Permettre aux prospects de réserver un appel de 20 min |
| Base légale | Mesures précontractuelles prises à la demande de la personne (réservation volontaire) |
| Personnes concernées | Prospects |
| Données | Prénom, nom, établissement, e-mail, téléphone, créneau choisi, offre d'intérêt, message facultatif, date du consentement |
| Destinataires | Mira ; hébergeur du site (sous-traitant) |
| Transferts hors UE | Aucun |
| Conservation | 3 ans, suppression automatique (table `appointments`) |
| Sécurité | Liste visible du seul rôle « équipe », HTTPS, limitation des envois, anti-robots, aucun service tiers |

## 2. Comptes et suivi de projet clients

| | |
|---|---|
| Finalité | Donner aux clients l'accès au suivi de leur projet et à leur tableau de bord (contenus, statistiques de leurs comptes, publicité) ; gérer la relation client |
| Base légale | Exécution du contrat |
| Personnes concernées | Clients, membres de l'équipe |
| Données | E-mail, nom de l'établissement, personne à contacter, téléphone, notes internes, mot de passe haché (bcrypt), informations du projet, statistiques de leurs comptes et campagnes |
| Destinataires | Équipe Mira ; le client pour son propre projet uniquement |
| Transferts hors UE | Aucun |
| Conservation | Durée du contrat, puis suppression du compte (bouton « Supprimer » de l'espace équipe : compte, projets et tableau de bord effacés) ; archives comptables 10 ans |
| Sécurité | Bcrypt, cookie de session httpOnly/secure, rôles vérifiés côté serveur, limitation des connexions |

## 3. Sécurité du site (limitation de débit)

| | |
|---|---|
| Finalité | Bloquer les attaques par force brute et le spam |
| Base légale | Intérêt légitime |
| Données | Adresse IP, en mémoire vive uniquement, jamais écrite sur disque |
| Conservation | 15 min (connexion) à 1 h (formulaire) |

---

## Procédures

- **Demande d'accès / portabilité** : exporter la ligne de la personne depuis `mira.db` et l'envoyer par e-mail sous 1 mois.
- **Demande d'effacement** : espace équipe → « Demandes reçues » → « Supprimer ». Pour un compte client : supprimer la ligne `users` (et projets associés si plus d'obligation légale).
- **Violation de données** (fuite, piratage) : notifier la CNIL sous **72 h** (cnil.fr/fr/notifier-une-violation-de-donnees-personnelles) et prévenir les personnes concernées si le risque est élevé. Consigner l'incident ici.

## Sous-traitants à encadrer par contrat (art. 28)

- Hébergeur : [nom] — vérifier qu'il propose un DPA (accord de traitement des données)
- Google (Gmail) : DPA Google Workspace / conditions Gmail

## Journal des incidents

| Date | Description | Mesures prises | Notifié CNIL ? |
|---|---|---|---|
| | | | |
