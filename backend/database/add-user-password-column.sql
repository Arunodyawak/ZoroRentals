USE zoro_rentals;

ALTER TABLE users
    ADD COLUMN password_hash VARCHAR(100) NOT NULL AFTER email;
