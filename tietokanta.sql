CREATE TABLE tuotteet (
  tuote_id INT AUTO_INCREMENT PRIMARY KEY,
  nimi VARCHAR(100) NOT NULL,
  kuvaus TEXT,
  hinta DECIMAL(5,2) NOT NULL,
  kategoria VARCHAR(50),
  viikonpaiva VARCHAR(20),
  erityisruokavalio VARCHAR(100)
);