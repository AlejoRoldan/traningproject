-- Tabla de Feedback y Notas de Administradores
CREATE TABLE admin_feedback (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_admin_id INT NOT NULL,
  to_agent_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  feedback_type ENUM('note', 'praise', 'improvement', 'urgent', 'follow_up') DEFAULT 'note',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (from_admin_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_agent_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_to_agent_id (to_agent_id),
  INDEX idx_from_admin_id (from_admin_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_feedback_type (feedback_type),
  INDEX idx_priority (priority)
);

-- Tabla de Adjuntos de Feedback
CREATE TABLE feedback_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  feedback_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(512) NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (feedback_id) REFERENCES admin_feedback(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_feedback_id (feedback_id)
);

-- Tabla de Respuestas a Feedback
CREATE TABLE feedback_replies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  feedback_id INT NOT NULL,
  from_user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (feedback_id) REFERENCES admin_feedback(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_feedback_id (feedback_id),
  INDEX idx_from_user_id (from_user_id)
);

-- Vista para Inbox del Agente
CREATE VIEW v_agent_feedback_inbox AS
SELECT 
  af.id,
  af.from_admin_id,
  CONCAT(admin_user.name) as from_admin_name,
  admin_user.email as from_admin_email,
  af.to_agent_id,
  af.title,
  af.message,
  af.feedback_type,
  af.priority,
  af.is_read,
  af.read_at,
  af.created_at,
  af.updated_at,
  (SELECT COUNT(*) FROM feedback_replies WHERE feedback_id = af.id) as reply_count,
  CASE 
    WHEN af.priority = 'high' THEN 3
    WHEN af.priority = 'medium' THEN 2
    ELSE 1
  END as priority_order
FROM admin_feedback af
JOIN users admin_user ON af.from_admin_id = admin_user.id
WHERE af.is_archived = FALSE
ORDER BY af.is_read ASC, priority_order DESC, af.created_at DESC;

-- Vista para Dashboard de Admin (Feedback Enviado)
CREATE VIEW v_admin_feedback_sent AS
SELECT 
  af.id,
  af.from_admin_id,
  af.to_agent_id,
  agent_user.name as agent_name,
  agent_user.email as agent_email,
  af.title,
  af.message,
  af.feedback_type,
  af.priority,
  af.is_read,
  af.read_at,
  af.created_at,
  (SELECT COUNT(*) FROM feedback_replies WHERE feedback_id = af.id) as reply_count,
  CASE WHEN af.is_read THEN 'Leído' ELSE 'No leído' END as read_status
FROM admin_feedback af
JOIN users agent_user ON af.to_agent_id = agent_user.id
WHERE af.is_archived = FALSE
ORDER BY af.created_at DESC;

-- Función para marcar feedback como leído
DELIMITER //
CREATE FUNCTION mark_feedback_as_read(p_feedback_id INT)
RETURNS BOOLEAN
DETERMINISTIC
MODIFIES SQL DATA
BEGIN
  UPDATE admin_feedback 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = p_feedback_id AND is_read = FALSE;
  
  RETURN TRUE;
END //
DELIMITER ;

-- Función para obtener contador de mensajes no leídos
DELIMITER //
CREATE FUNCTION get_unread_feedback_count(p_agent_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE unread_count INT;
  
  SELECT COUNT(*) INTO unread_count
  FROM admin_feedback
  WHERE to_agent_id = p_agent_id 
    AND is_read = FALSE 
    AND is_archived = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END //
DELIMITER ;

-- Trigger para auditoría de feedback
DELIMITER //
CREATE TRIGGER audit_feedback_creation
AFTER INSERT ON admin_feedback
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (
    user_id, 
    action, 
    table_name, 
    record_id, 
    changes, 
    ip_hash, 
    created_at
  ) VALUES (
    NEW.from_admin_id,
    'CREATE',
    'admin_feedback',
    NEW.id,
    CONCAT('Feedback enviado a agente ', NEW.to_agent_id, ' - Tipo: ', NEW.feedback_type),
    SHA2('127.0.0.1', 256),
    NOW()
  );
END //
DELIMITER ;

-- Trigger para auditoría de lectura de feedback
DELIMITER //
CREATE TRIGGER audit_feedback_read
AFTER UPDATE ON admin_feedback
FOR EACH ROW
BEGIN
  IF OLD.is_read = FALSE AND NEW.is_read = TRUE THEN
    INSERT INTO audit_log (
      user_id,
      action,
      table_name,
      record_id,
      changes,
      ip_hash,
      created_at
    ) VALUES (
      NEW.to_agent_id,
      'READ',
      'admin_feedback',
      NEW.id,
      CONCAT('Feedback leído - De: ', NEW.from_admin_id),
      SHA2('127.0.0.1', 256),
      NOW()
    );
  END IF;
END //
DELIMITER ;

-- Índices adicionales para optimización
CREATE INDEX idx_feedback_unread ON admin_feedback(to_agent_id, is_read, is_archived);
CREATE INDEX idx_feedback_priority_date ON admin_feedback(priority, created_at);
CREATE INDEX idx_feedback_type_agent ON admin_feedback(feedback_type, to_agent_id);
