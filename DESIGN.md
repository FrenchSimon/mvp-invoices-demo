# Design : « Le carnet »

Direction A, choisie par Simon et validée par la cliente le 2026-11-13 (« Approuvé »), avec un ajustement : boutons d'action de l'éditeur en haut, action principale en terracotta plein.
Maquette : https://claude.ai/artifact/9LCaVxDBzHiXzziKP91Gaz (rangée A).

Idée : un carnet de facturation bien rangé. Papier beige, encre brune, filets fins plutôt que cartes. Le terracotta est réservé à l'action principale et aux retards.

Les valeurs ci-dessous sont traduites en variables dans `src/app/globals.css`. Les composants utilisent ces variables (`bg-primary`, `text-muted-foreground`, `bg-status-paid`…), jamais de couleurs écrites en dur.

## Couleurs

| Rôle | Variable | Valeur |
|---|---|---|
| Fond de page (papier) | `--background` | #F4EEE4 |
| Texte | `--foreground` | #2B2520 |
| Texte secondaire | `--ink-soft` | #4A4038 |
| Texte discret (libellés) | `--muted-foreground` | #6B5F55 |
| Feuille (facture, formulaires) | `--card` | #FFFCF7 |
| Action principale | `--primary` / `--primary-foreground` | #B5532F / #FFF8F0 |
| Liens, montants en retard | `--destructive` | #9C4426 |
| Filet fin | `--border` | #DCD1C2 |
| Filet fort (haut des tableaux, totaux) | `--rule-strong` | #2B2520 |
| Bord des champs | `--input` | #CFC2B1 |

Statuts, toujours avec leur libellé (jamais la couleur seule) :

| Statut | Fond | Texte |
|---|---|---|
| Brouillon | #E7E1D8 | #4A4038 |
| Envoyée | #DCE6F0 | #24476B |
| Payée | #DDEBDD | #275C34 |
| En retard | #9C4426 | #FFF8F0 |

## Typographie

- Titres et grands montants : Newsreader (empattements), graisse 500.
- Texte, tableaux, boutons : Source Sans 3, 16 px (17 px sur l'accueil).
- Chiffres alignés dans les tableaux (`tabular-nums`).
- Site en anglais (depuis le 2026-11-16) : montants au format €1,234.56, dates « 4 Nov 2026 », « VAT » pour la TVA. Nom : Billnote.
- Version française (depuis le 2026-11-23), au choix dans la barre de démo : 1 234,56 €, « 4 nov. 2026 », « TVA », « Total HT / TTC », vouvoiement, espace insécable avant « : ; ? ! ». Textes dans `src/i18n/` (anglais = source, français typé dessus).

## Formes et densité

- Arrondis : 4 px (`--radius: 0.25rem`). Pas d'ombres.
- Tableaux à filets : une ligne fine entre les rangées, un filet fort en haut. Pas de cartes pour les listes.
- Les trois montants du tableau de bord sont côte à côte, séparés par des filets verticaux.
- Largeur de contenu : 1120 px max, marges de 32 px (16 px sur mobile).

## Navigation

- Barre « Portfolio demo » au-dessus de chaque page, comme Kinora (fond `--demo` #1E2B24, texte `--demo-foreground` #F3EEE4, discret `--demo-muted` #C9C2B3). Ligne 1 : « Portfolio demo · sample data » à gauche, choix FR | EN à droite (langue courante en gras soulignée). Ligne 2 : « Read the code ↗ » (masquée si `SOURCE_CODE` est vide).

- Barre du haut : logo B + nom de l'app (Billnote) à gauche, onglets texte à droite (Dashboard, Invoices, Clients, Settings). Onglet actif : texte en gras + soulignement terracotta de 2 px.
- Admin : onglet en plus, visible seulement pour le rôle admin.

## Composants

- Bouton principal : fond terracotta plein. Un seul par écran.
- Bouton secondaire : contour terracotta, fond transparent.
- Champs : fond feuille, bord `--input`, libellé au-dessus en texte discret.
- Éditeur de facture : la facture est une feuille (`--card`) avec le titre, le statut et les boutons « Télécharger le PDF » (secondaire) et « Envoyer par email » (principal) en haut. Les changements de statut sont des liens dans une colonne à droite.
- Accueil : la facture d'exemple est montrée comme une feuille légèrement inclinée (1°).

## À éviter

Dégradés, ombres douces, emojis, police Inter, grand titre centré, terracotta partout, statuts distingués par la couleur seule.
