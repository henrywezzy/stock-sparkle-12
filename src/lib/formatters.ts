/**
 * Abrevia um nome para mostrar apenas o primeiro e segundo nome
 * Ex: "João Carlos da Silva Pereira" -> "João Carlos"
 */
export function abbreviateName(fullName: string | null | undefined): string {
  if (!fullName) return "—";
  
  const names = fullName.trim().split(/\s+/);
  
  if (names.length <= 2) {
    return fullName;
  }
  
  // Pega os dois primeiros nomes significativos (ignora conectores curtos como "da", "de", "dos")
  const connectors = ["da", "de", "do", "das", "dos", "e"];
  const significantNames: string[] = [];
  
  for (const name of names) {
    if (significantNames.length >= 2) break;
    
    if (connectors.includes(name.toLowerCase())) {
      // Se for um conector, adiciona ao último nome significativo
      if (significantNames.length > 0) {
        significantNames[significantNames.length - 1] += ` ${name}`;
      }
    } else {
      significantNames.push(name);
    }
  }
  
  return significantNames.slice(0, 2).join(" ");
}

/**
 * Abrevia nome de fornecedor para tabelas
 */
export function abbreviateSupplierName(name: string | null | undefined): string {
  return abbreviateName(name);
}
