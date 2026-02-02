/**
 * Keyword Detection Service
 * Detects important keywords in transcripts for highlighting
 */

// Banking and financial keywords (Spanish for Paraguay)
const BANKING_KEYWORDS = [
  // Account operations
  "cuenta", "saldo", "depósito", "retiro", "transferencia", "movimiento",
  
  // Cards
  "tarjeta", "débito", "crédito", "PIN", "CVV", "vencimiento",
  
  // Loans
  "préstamo", "cuota", "interés", "garantía", "refinanciación",
  
  // Security
  "contraseña", "clave", "token", "seguridad", "verificación", "autenticación",
  
  // Fraud/Crime
  "fraude", "robo", "estafa", "sospechoso", "bloqueo", "denuncia",
  "lavado", "activos", "ilícito",
  
  // Customer service
  "reclamo", "queja", "consulta", "solicitud", "problema", "solución",
];

// Emotional/empathy keywords
const EMOTIONAL_KEYWORDS = [
  "disculpe", "lamento", "comprendo", "entiendo", "ayudar", "resolver",
  "tranquilo", "preocupe", "asegurar", "garantizar", "confianza",
];

// Protocol keywords
const PROTOCOL_KEYWORDS = [
  "verificar", "confirmar", "documento", "identidad", "DNI", "cédula",
  "autorización", "permiso", "procedimiento", "protocolo", "política",
];

interface KeywordMatch {
  word: string;
  category: "banking" | "emotional" | "protocol";
  count: number;
}

/**
 * Detect keywords in transcript
 */
export function detectKeywords(transcript: string): {
  keywords: string[];
  matches: KeywordMatch[];
  stats: {
    totalKeywords: number;
    bankingCount: number;
    emotionalCount: number;
    protocolCount: number;
  };
} {
  const text = transcript.toLowerCase();
  const words = text.split(/\s+/);
  
  const matchesMap = new Map<string, KeywordMatch>();
  
  // Count banking keywords
  BANKING_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      matchesMap.set(keyword, {
        word: keyword,
        category: "banking",
        count: matches.length,
      });
    }
  });
  
  // Count emotional keywords
  EMOTIONAL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      matchesMap.set(keyword, {
        word: keyword,
        category: "emotional",
        count: matches.length,
      });
    }
  });
  
  // Count protocol keywords
  PROTOCOL_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      matchesMap.set(keyword, {
        word: keyword,
        category: "protocol",
        count: matches.length,
      });
    }
  });
  
  const matches = Array.from(matchesMap.values());
  const keywords = matches.map(m => m.word);
  
  const stats = {
    totalKeywords: matches.reduce((sum, m) => sum + m.count, 0),
    bankingCount: matches
      .filter(m => m.category === "banking")
      .reduce((sum, m) => sum + m.count, 0),
    emotionalCount: matches
      .filter(m => m.category === "emotional")
      .reduce((sum, m) => sum + m.count, 0),
    protocolCount: matches
      .filter(m => m.category === "protocol")
      .reduce((sum, m) => sum + m.count, 0),
  };
  
  return { keywords, matches, stats };
}

/**
 * Get top N most frequent keywords
 */
export function getTopKeywords(matches: KeywordMatch[], n: number = 10): KeywordMatch[] {
  return matches
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
