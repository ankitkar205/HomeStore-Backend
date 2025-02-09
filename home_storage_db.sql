USE home_storage_db;
CREATE TABLE groceries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    quantity INT
);

CREATE TABLE monthlies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    quantity INT
);

CREATE TABLE electrical (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    quantity INT
);

CREATE TABLE money_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item VARCHAR(100),
    cost DECIMAL(10,2)
);
SHOW DATABASES;
SHOW TABLES;

