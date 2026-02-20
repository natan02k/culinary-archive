-- Zuerst alle bestehenden Daten löschen (Reihenfolge wegen Foreign Keys beachten)
DELETE FROM kommentare;
DELETE FROM favoriten;
DELETE FROM rezept_likes;
DELETE FROM rezept;
DELETE FROM nutzer;

-- Beispiel Nutzer anlegen
INSERT INTO nutzer (username, passwort, email, bio, level, xp) VALUES 
('kochmeister', '123', 'kochmeister@test.de', 'Ich liebe es herzhaft zu kochen!', 3, 250),
('backfee', '123', 'backfee@test.de', 'Süßigkeiten sind mein Leben. 🍰', 5, 520),
('vegan_star', '123', 'vegan@test.de', '100% Pflanzlich und 100% Lecker 🥦', 2, 80);

-- Beispiel Rezepte anlegen (wir nutzen SELECT um die generierte user_id der gerade erstellten Nutzer zu finden)
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Klassische Spaghetti Bolognese', 15, 45, 'mittel', 'Hauptgericht', 'pasta,italienisch,herzhaft',
'- 500g Hackfleisch (Rind)\n- 500g Spaghetti\n- 2 Dosen Tomaten\n- 1 Zwiebel\n- 2 Zehen Knoblauch\n- Oregano, Salz, Pfeffer',
'1. **Vorbereitung**: Zwiebeln und Knoblauch fein würfeln.\n2. **Anbraten**: Das Hackfleisch in einer Pfanne krümelig anbraten. Zwiebeln und Knoblauch kurz mitbraten.\n3. **Köcheln**: Mit den Dosentomaten auffüllen, würzen und mind. 30 Min. auf kleiner Flamme köcheln lassen.\n4. **Servieren**: Spaghetti al dente kochen und mit der Soße servieren.'
FROM nutzer WHERE username = 'kochmeister';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Fluffige Buttermilch-Pancakes', 10, 10, 'leicht', 'Frühstück', 'süß,pancakes,backen',
'- 200g Mehl\n- 2 TL Backpulver\n- 1 Prise Salz\n- 2 EL Zucker\n- 250ml Buttermilch\n- 1 Ei\n- 2 EL flüssige Butter',
'1. Trockene Zutaten (Mehl, Backpulver, Salz, Zucker) in einer Schüssel mischen.\n2. Feuchte Zutaten (Buttermilch, Ei, Butter) verquirlen und kurz unter die trockenen Zutaten heben (nicht zu stark rühren!).\n3. Portionsweise in einer beschichteten Pfanne mit wenig Butter bei mittlerer Hitze ausbacken, aufsteigen lassen und wenden.'
FROM nutzer WHERE username = 'backfee';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Cremige Avocado-Pasta', 10, 10, 'leicht', 'Vegetarisch', 'vegan,avocado,pasta,schnell',
'- 2 reife Avocados\n- 1 Handvoll Basilikum\n- 1 Knoblauchzehe\n- 2 EL Olivenöl\n- Spritzer Zitronensaft\n- 400g Nudeln nach Wahl',
'1. Die Nudeln nach Packungsbeilage al dente kochen.\n2. In der Zwischenzeit das Fruchtfleisch der Avocados zusammen mit den restlichen Zutaten in einem Mixer pürieren.\n3. Die fertigen Nudeln abgießen (etwas Nudelwasser aufbewahren!) und sofort mit der Avocado-Creme vermengen. Falls nötig, etwas Nudelwasser für mehr Cremigkeit hinzufügen.'
FROM nutzer WHERE username = 'vegan_star';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Schnelles Schoko-Soufflé', 15, 12, 'schwer', 'Dessert', 'schoko,dessert,süß,backen',
'- 100g dunkle Schokolade\n- 100g Butter\n- 2 Eier\n- 2 Eigelb\n- 50g Zucker\n- 2 EL Mehl',
'1. Schokolade und Butter im Wasserbad schmelzen.\n2. Eier, Eigelb und Zucker schaumig schlagen, bis die Masse hell wird.\n3. Die flüssige Schoko-Mischung unterrühren und das Mehl darübersieben und unterheben.\n4. Teig in gebutterte Förmchen füllen und bei 200°C Ober-/Unterhitze ca. 10 Minuten backen (der Kern muss noch flüssig sein!).'
FROM nutzer WHERE username = 'backfee';

-- Beispiel Kommentare hinzufügen
INSERT INTO kommentare (rezept_id, user_id, text)
SELECT r.rezept_id, n.user_id, 'Wow, das sieht unglaublich lecker aus! Wird am Wochenende direkt nachgemacht.'
FROM rezept r, nutzer n 
WHERE r.titel = 'Fluffige Buttermilch-Pancakes' AND n.username = 'kochmeister';

INSERT INTO kommentare (rezept_id, user_id, text)
SELECT r.rezept_id, n.user_id, 'Kann man die Buttermilch auch durch Hafermilch ersetzen für eine vegane Variante?'
FROM rezept r, nutzer n 
WHERE r.titel = 'Fluffige Buttermilch-Pancakes' AND n.username = 'vegan_star';

INSERT INTO kommentare (rezept_id, user_id, text)
SELECT r.rezept_id, n.user_id, 'Ein echter Klassiker! Ich gebe gerne noch einen Schuss Rotwein zum Ablöschen dazu.'
FROM rezept r, nutzer n 
WHERE r.titel = 'Klassische Spaghetti Bolognese' AND n.username = 'backfee';

-- Beispiel Favoriten anlegen
INSERT INTO favoriten (rezept_id, user_id)
SELECT r.rezept_id, n.user_id
FROM rezept r, nutzer n 
WHERE r.titel = 'Klassische Spaghetti Bolognese' AND n.username = 'backfee';

-- Beispiel Likes (Votes) vergeben (1 = Like)
INSERT INTO rezept_likes (rezept_id, user_id, liked)
SELECT r.rezept_id, n.user_id, 1
FROM rezept r, nutzer n 
WHERE r.titel = 'Fluffige Buttermilch-Pancakes' AND n.username = 'kochmeister';

INSERT INTO rezept_likes (rezept_id, user_id, liked)
SELECT r.rezept_id, n.user_id, 1
FROM rezept r, nutzer n 
WHERE r.titel = 'Klassische Spaghetti Bolognese' AND n.username = 'backfee';
