-- Crear tabla de información corporativa
CREATE TABLE IF NOT EXISTS company_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  vision TEXT,
  mission TEXT,
  values_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar información de Kaitel
INSERT INTO company_info (company_name, vision, mission, values_json) VALUES (
  'Kaitel',
  'Kaitel, como la empresa de servicios de experiencia al cliente del Grupo Vázquez, tiene como propósito maximizar la satisfacción y fidelización de los clientes de las empresas del grupo, a través de la mejora continua de su experiencia multicanal.',
  'Nuestra Misión es ser el motor de la excelencia en la experiencia del cliente para el Grupo Vázquez, transformando cada interacción en una oportunidad de valor y fidelización.',
  '["Integridad", "Excelencia en servicio", "Empatía", "Trabajo en equipo", "Innovación"]'
);
