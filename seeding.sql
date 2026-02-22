-- Zuerst alle bestehenden Daten löschen (Reihenfolge wegen Foreign Keys beachten)
DELETE FROM kommentare;
DELETE FROM favoriten;
DELETE FROM rezept_likes;
DELETE FROM rezept;
DELETE FROM nutzer;

-- Diverse Nutzer anlegen mit unterschiedlichen Rängen
INSERT INTO nutzer (username, passwort, email, bio, level, xp) VALUES 
('chef_luigi', '123', 'luigi@italy.com', 'Echter italienischer Chefkoch. Pasta ist Leben! 🍝', 15, 1450),
('sweet_sara', '123', 'sara@bakery.com', 'Backen ist meine Therapie. 🍰✨', 8, 780),
('vegan_viktoria', '123', 'viktoria@green.de', 'Pflanzenfresserin aus Leidenschaft. 🌿', 6, 520),
('fitness_frank', '123', 'frank@gym.de', 'High Protein & Low Carb für maximale Gains! 💪', 4, 340),
('quick_quinn', '123', 'quinn@fast.com', 'Keine Zeit zum Kochen, aber Hunger! ⏱️', 2, 120),
('hobby_hans', '123', 'hans@test.de', 'Ich probiere einfach alles aus.', 1, 40);

-- Rezepte anlegen (ca. 3 pro Kategorie)

-- FRÜHSTÜCK
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Overnight Oats mit Beeren', 5, 0, 'leicht', 'Frühstück', 'gesund,beeren,hafer', 'Haferflocken, Chia-Samen, Milch, Blaubeeren, Honig', 'Alles mischen und über Nacht in den Kühlschrank stellen.' FROM nutzer WHERE username = 'fitness_frank';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Strammer Max Deluxe', 10, 5, 'leicht', 'Frühstück', 'herzhaft,ei,schinken', 'Brot, Schinken, Eier, Gewürzgurken', 'Brot belegen, Spiegelei oben drauf, fertig.' FROM nutzer WHERE username = 'hobby_hans';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Banane-Erdnuss-Toast', 5, 2, 'leicht', 'Frühstück', 'süß,schnell,vegan', 'Vollkornbrot, Erdnussbutter, Banane, Zimt', 'Brot toasten, bestreichen, belegen.' FROM nutzer WHERE username = 'vegan_viktoria';

-- HAUPTGERICHT
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Gourmet Pizza Margherita', 60, 10, 'schwer', 'Hauptgericht', 'italienisch,pizza,klassiker', 'Mehl Typ 00, Hefe, Wasser, San Marzano Tomaten, Mozzarella di Bufala, Basilikum', 'Teig 24h gehen lassen. Dünn ausrollen, belegen und bei maximaler Hitze backen.' FROM nutzer WHERE username = 'chef_luigi';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Puten-Gemüse-Pfanne', 10, 15, 'leicht', 'Hauptgericht', 'lowcarb,protein,fitness', 'Putenbrust, Paprika, Zucchini, Brokkoli, Sojasauce', 'Fleisch anbraten, Gemüse dazu, mit Sauce ablöschen.' FROM nutzer WHERE username = 'fitness_frank';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Ein-Topf Pasta', 5, 12, 'leicht', 'Hauptgericht', 'onepot,schnell', 'Nudeln, Tomatenmark, Gemüsebrühe, Spinat, Sahne', 'Alles in einen Topf werfen und kochen, bis die Nudeln gar sind.' FROM nutzer WHERE username = 'quick_quinn';

-- DESSERT
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Lavakuchen mit flüssigem Kern', 15, 10, 'mittel', 'Dessert', 'schoko,backen,warm', 'Zartbitterschokolade, Butter, Eier, Zucker, Mehl', 'Eier mit Zucker schaumig schlagen. Schokolade schmelzen. Backen bis der Rand fest, aber die Mitte weich ist.' FROM nutzer WHERE username = 'sweet_sara';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Veganes Mango-Mousse', 10, 0, 'leicht', 'Dessert', 'fruchtig,vegan,mango', 'Reife Mango, Seidentofu, Ahornsirup, Limettensaft', 'Alles pürieren und kalt stellen.' FROM nutzer WHERE username = 'vegan_viktoria';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Omas Milchreis', 5, 25, 'leicht', 'Dessert', 'kindheit,süß', 'Milchreis, Milch, Vanille, Zimt & Zucker', 'Milch mit Reis köcheln lassen, bis sie aufgesaugt ist.' FROM nutzer WHERE username = 'hobby_hans';

-- SNACK
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Hausgemachtes Hummus', 10, 0, 'leicht', 'Snack', 'orientalisch,vegan,dip', 'Kichererbsen, Tahini, Zitrone, Knoblauch, Kreuzkümmel', 'Mixen bis es cremig ist.' FROM nutzer WHERE username = 'vegan_viktoria';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Protein Riegel', 15, 0, 'mittel', 'Snack', 'sport,riegel,selbstgemacht', 'Proteinpulver, Haferflocken, Erdnussmus, Milch', 'Mischen, in Form drücken, fest werden lassen.' FROM nutzer WHERE username = 'fitness_frank';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Nachos Supreme', 5, 5, 'leicht', 'Snack', 'party,käse,mexikanisch', 'Nachos, Käse, Jalapenos, Salsa', 'Nachos mit Käse belegen und im Ofen schmelzen.' FROM nutzer WHERE username = 'quick_quinn';

-- GETRÄNK
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Iced Matcha Latte', 5, 0, 'leicht', 'Getränk', 'matcha,wachmacher,trend', 'Matcha Pulver, heißes Wasser, Eiswürfel, Hafermilch', 'Matcha anrühren, Eis und Milch dazu.' FROM nutzer WHERE username = 'vegan_viktoria';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Beeriger Smoothie', 3, 0, 'leicht', 'Getränk', 'vitamin,smoothie,schnell', 'TK Beeren, Banane, Apfelsaft', 'Mixen und genießen.' FROM nutzer WHERE username = 'fitness_frank';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Hausgemachte Limonade', 10, 0, 'leicht', 'Getränk', 'erfrischend,zitrone', 'Zitronen, Zucker, Wasser, Minze', 'Zitronen pressen, mit Zucker und Wasser mischen.' FROM nutzer WHERE username = 'sweet_sara';

-- VEGETARISCH / VEGAN Spezials
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Pilz-Risotto', 10, 20, 'mittel', 'Vegetarisch', 'pilze,reis,cremig', 'Arborio Reis, Champignons, Zwiebeln, Parmesan, Weißwein', 'Zwiebeln und Pilze anbraten. Reis dazu, nach und nach Brühe zufügen.' FROM nutzer WHERE username = 'chef_luigi';

INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Linsen-Curry (Dal)', 15, 20, 'leicht', 'Vegan', 'indisch,linsen,wärmend', 'Rote Linsen, Kokosmilch, Kurkuma, Ingwer, Spinat', 'Linsen mit Gewürzen kochen, Kokosmilch und Spinat zum Schluss dazu.' FROM nutzer WHERE username = 'vegan_viktoria';

-- SONSTIGES
INSERT INTO rezept (user_id, titel, zubereitungszeit, kochzeit, schwierigkeit, kategorie, tags, zutaten, zubereitung)
SELECT user_id, 'Gewürzmischung Allrounder', 5, 0, 'leicht', 'Sonstiges', 'diy,küchenhack', 'Salz, Pfeffer, Paprika, Knoblauchpulver, Oregano', 'Alles mischen und in ein Glas füllen.' FROM nutzer WHERE username = 'hobby_hans';

-- INTERAKTIONEN (LIKES, FAVORITEN, KOMMENTARE)

-- Platz 1 Likes: Gourmet Pizza Margherita (6 Likes)
INSERT INTO rezept_likes (rezept_id, user_id, liked) SELECT r.rezept_id, n.user_id, 1 FROM rezept r, nutzer n WHERE r.titel = 'Gourmet Pizza Margherita' AND n.username IN ('sweet_sara', 'vegan_viktoria', 'fitness_frank', 'quick_quinn', 'hobby_hans', 'chef_luigi');

-- Platz 2 Likes: Lavakuchen (4 Likes)
INSERT INTO rezept_likes (rezept_id, user_id, liked) SELECT r.rezept_id, n.user_id, 1 FROM rezept r, nutzer n WHERE r.titel = 'Lavakuchen mit flüssigem Kern' AND n.username IN ('chef_luigi', 'vegan_viktoria', 'fitness_frank', 'hobby_hans');

-- Platz 3 Likes: Overnight Oats (3 Likes)
INSERT INTO rezept_likes (rezept_id, user_id, liked) SELECT r.rezept_id, n.user_id, 1 FROM rezept r, nutzer n WHERE r.titel = 'Overnight Oats mit Beeren' AND n.username IN ('chef_luigi', 'sweet_sara', 'quick_quinn');

-- Am meisten favorisiert: Gourmet Pizza Margherita (4 Favoriten) - Stacked Badge Test!
INSERT INTO favoriten (rezept_id, user_id) SELECT r.rezept_id, n.user_id FROM rezept r, nutzer n WHERE r.titel = 'Gourmet Pizza Margherita' AND n.username IN ('sweet_sara', 'vegan_viktoria', 'fitness_frank', 'quick_quinn');

-- Weitere Favoriten zur Streuung
INSERT INTO favoriten (rezept_id, user_id) SELECT r.rezept_id, n.user_id FROM rezept r, nutzer n WHERE r.titel = 'Lavakuchen mit flüssigem Kern' AND n.username IN ('chef_luigi', 'fitness_frank');
INSERT INTO favoriten (rezept_id, user_id) SELECT r.rezept_id, n.user_id FROM rezept r, nutzer n WHERE r.titel = 'Linsen-Curry (Dal)' AND n.username IN ('chef_luigi', 'sweet_sara');

-- Kommentare
INSERT INTO kommentare (rezept_id, user_id, text) SELECT r.rezept_id, n.user_id, 'Die Pizza war wie beim Italiener! Unfassbar gut.' FROM rezept r, nutzer n WHERE r.titel = 'Gourmet Pizza Margherita' AND n.username = 'sweet_sara';
INSERT INTO kommentare (rezept_id, user_id, text) SELECT r.rezept_id, n.user_id, 'Kann ich statt Tofu auch Cashews nehmen?' FROM rezept r, nutzer n WHERE r.titel = 'Veganes Mango-Mousse' AND n.username = 'quick_quinn';
INSERT INTO kommentare (rezept_id, user_id, text) SELECT r.rezept_id, n.user_id, 'Perfekt nach dem Training!' FROM rezept r, nutzer n WHERE r.titel = 'Protein Riegel' AND n.username = 'hobby_hans';
INSERT INTO kommentare (rezept_id, user_id, text) SELECT r.rezept_id, n.user_id, 'Mein flüssiger Kern war leider fest. Was habe ich falsch gemacht?' FROM rezept r, nutzer n WHERE r.titel = 'Lavakuchen mit flüssigem Kern' AND n.username = 'fitness_frank';
INSERT INTO kommentare (rezept_id, user_id, text) SELECT r.rezept_id, n.user_id, 'Wahrscheinlich war der Ofen zu heiß oder er war 2 Minuten zu lange drin!' FROM rezept r, nutzer n WHERE r.titel = 'Lavakuchen mit flüssigem Kern' AND n.username = 'sweet_sara';
