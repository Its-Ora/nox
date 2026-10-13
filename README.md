# Nox

Pilote ta Freebox Pop depuis Windows ou Android, sans Freebox OS et sans serveur. L'app parle directement à l'API de la box, en local ou à distance.

## Ce que ça fait

- **Accueil** : débit en temps réel, état de la ligne, IP, appareils, Wi-Fi, températures, redémarrage
- **Appareils** : en ligne / hors ligne, recherche, renommer, type, Wake-on-LAN, réserver l'IP
- **Wi-Fi** : allumer/couper, SSID, mot de passe, sécurité, SSID masqué, canaux et largeur par bande, accès invités temporaires, partage par QR code
- **Réseau local** : IP et nom de la box, mode routeur/bridge, DHCP (plage, DNS), réservations d'adresses, baux en cours
- **Ports** : redirections (ajout, modif, activation, suppression), DMZ, UPnP
- **Connexion** : accès à distance, port, API distante, ping, WoL, IPv6 et pare-feu IPv6
- **VPN** : serveurs WireGuard/OpenVPN, comptes, config client (QR code WireGuard)
- **Contrôle parental** : couper ou rendre internet à un profil, pour une durée
- **Appels** : journal, marquer comme vu, effacer
- **API brute** : n'importe quel point de l'API en GET/PUT/POST/DELETE, pour tout réglage qui n'a pas encore son écran

## Récupérer le .exe et l'APK (sans rien installer chez toi)

1. Crée un dépôt GitHub (privé si tu veux) et pousse ce dossier.
2. GitHub Actions lance le workflow **Build Nox** tout seul.
3. Dans l'onglet *Actions* → le dernier run → *Artifacts* : `nox-windows` (installeur .exe et .msi) et `nox-android` (APK universel).
4. Pour une release propre : `git tag v0.1.0 && git push --tags`. Les fichiers arrivent dans *Releases*.

### Garder la même signature Android entre les versions

Sans clé fournie, le workflow signe avec une clé jetable : Android refusera la mise à jour et il faudra désinstaller avant. Pour éviter ça, une fois :

```bash
keytool -genkeypair -v -keystore nox.jks -alias nox -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 nox.jks   # copie la sortie
```

Puis dans le dépôt GitHub → *Settings → Secrets and variables → Actions* :
- `ANDROID_KEYSTORE_B64` : la sortie base64
- `ANDROID_KEYSTORE_PASS` : le mot de passe choisi

Garde `nox.jks` de côté, ne le commite pas.

## Première connexion

1. Lance Nox **depuis le réseau de la maison** (la box n'accepte les demandes d'accès qu'en local).
2. *Demander l'accès*, puis valide sur la Freebox.
3. Dans Freebox OS → *Paramètres → Gestion des accès → Applications*, coche **tous les droits** de Nox, surtout *Modification des réglages*. Sans ça, Nox ne fait que lire.
4. Pour l'accès hors de la maison : page *Connexion* → active l'accès à distance et l'API distante, puis *Utiliser dans Nox*.

## Développer

```bash
npm install
npm run dev          # interface seule dans le navigateur (box simulée dispo)
npm run tauri dev    # app desktop (nécessite Rust)
npm run build:demo   # un seul fichier HTML autonome avec une box simulée
```

## Notes techniques

- Tauri 2 + Svelte 5. Les requêtes passent par le plugin HTTP de Tauri (côté Rust) : pas de CORS, et le certificat de la Freebox (signé par l'autorité Freebox, pas une CA publique) est accepté pour les adresses `https://`.
- Auth : `app_token` obtenu une fois, puis à chaque session challenge → HMAC-SHA1 → `session_token`. Reconnexion automatique si la session expire.
- Affichage : les données déjà vues s'affichent instantanément depuis le cache et se rafraîchissent en arrière-plan. Pas de spinner bloquant, les actions sont optimistes.
- Les écrans ont été testés contre la box simulée. Certains champs de l'API peuvent différer selon le firmware de la Pop : si un réglage ne passe pas, regarde la vraie réponse dans *API brute* et dis-moi ce qui coince.
