-- Zuerst alle alten Tabellen in der richtigen Reihenfolge (wegen Foreign Keys) löschen
DROP TABLE IF EXISTS rezept_likes;
DROP TABLE IF EXISTS kommentare;
DROP TABLE IF EXISTS favoriten;
DROP TABLE IF EXISTS rezept;
DROP TABLE IF EXISTS nutzer;

-- Jetzt die neuen Tabellen mit allen Gamification-Spalten erstellen
CREATE TABLE IF NOT EXISTS nutzer (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    passwort VARCHAR(255) NOT NULL,
    geburtsdatum DATE,
    bio TEXT,
    email VARCHAR(255) UNIQUE NOT NULL,
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    profile_image_url VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS rezept (
    rezept_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    titel VARCHAR(255) NOT NULL,
    zubereitungszeit INT,
    kochzeit INT,
    schwierigkeit ENUM('leicht', 'mittel', 'schwer'),
    zutaten TEXT,
    zubereitung TEXT,
    kategorie ENUM('Frühstück', 'Hauptgericht', 'Dessert', 'Vegetarisch', 'Sonstiges') DEFAULT 'Sonstiges',
    tags VARCHAR(255) DEFAULT '',
    image_url VARCHAR(255) DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES nutzer(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favoriten (
    user_id INT NOT NULL,
    rezept_id INT NOT NULL,
    PRIMARY KEY (user_id, rezept_id),
    FOREIGN KEY (user_id) REFERENCES nutzer(user_id) ON DELETE CASCADE,
    FOREIGN KEY (rezept_id) REFERENCES rezept(rezept_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kommentare (
    kommentar_id INT AUTO_INCREMENT PRIMARY KEY,
    rezept_id INT NOT NULL,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rezept_id) REFERENCES rezept(rezept_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES nutzer(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rezept_likes (
    rezept_id INT NOT NULL,
    user_id INT NOT NULL,
    liked TINYINT(1) DEFAULT NULL,
    PRIMARY KEY(rezept_id, user_id),
    FOREIGN KEY (rezept_id) REFERENCES rezept(rezept_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES nutzer(user_id) ON DELETE CASCADE
);
