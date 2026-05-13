CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(500) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_reviews_user_id (user_id),
  CONSTRAINT fk_reviews_users
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT chk_reviews_rating
    CHECK (rating BETWEEN 1 AND 5)
);
