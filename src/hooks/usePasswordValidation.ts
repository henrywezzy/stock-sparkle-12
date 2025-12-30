import { useMemo } from 'react';

// Lista de senhas comuns que devem ser bloqueadas
const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', 'password!', 
  '123456', '1234567', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'abc123', 'abcdef', 'abcd1234',
  'admin', 'admin123', 'administrator', 'root', 'user',
  'letmein', 'welcome', 'welcome1', 'iloveyou', 'monkey',
  'dragon', 'master', 'login', 'passw0rd', 'sunshine',
  'princess', 'football', 'baseball', 'soccer', 'hockey',
  'batman', 'superman', 'shadow', 'michael', 'jennifer',
  'thomas', 'charlie', 'donald', 'trustno1', 'whatever',
  'senha', 'senha123', 'mudar123', 'mudar', 'trocar',
  '12345', '123123', '111111', '000000', '666666',
  'teste', 'teste123', 'test', 'test123', 'testing',
  'admin1', 'admin@123', 'password@123', 'pass123',
  'qwerty1', 'asdf1234', 'zxcvbnm', 'qwertyuiop',
  'changeme', 'guest', 'guest123', 'default', 'temp',
  'senha@123', 'brasil', 'brasil123', 'flamengo', 'palmeiras',
];

// Sequências comuns que indicam senhas fracas
const COMMON_SEQUENCES = [
  '123', '234', '345', '456', '567', '678', '789', '890',
  'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
  'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
  'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
  'zxc', 'xcv', 'cvb', 'vbn', 'bnm',
  '111', '222', '333', '444', '555', '666', '777', '888', '999', '000',
  'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff',
];

export interface PasswordCheck {
  id: string;
  label: string;
  valid: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  strengthPercent: number;
  checks: PasswordCheck[];
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const checks: PasswordCheck[] = [
    { 
      id: 'length', 
      label: 'Mínimo 8 caracteres', 
      valid: password.length >= 8 
    },
    { 
      id: 'uppercase', 
      label: 'Letra maiúscula (A-Z)', 
      valid: /[A-Z]/.test(password) 
    },
    { 
      id: 'lowercase', 
      label: 'Letra minúscula (a-z)', 
      valid: /[a-z]/.test(password) 
    },
    { 
      id: 'number', 
      label: 'Número (0-9)', 
      valid: /[0-9]/.test(password) 
    },
    { 
      id: 'special', 
      label: 'Caractere especial (!@#$%)', 
      valid: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password) 
    },
    { 
      id: 'noCommon', 
      label: 'Não é uma senha comum', 
      valid: !isCommonPassword(password) 
    },
    { 
      id: 'noSequence', 
      label: 'Sem sequências óbvias', 
      valid: !hasCommonSequence(password) 
    },
  ];

  const errors: string[] = [];
  
  if (!checks[0].valid) errors.push('A senha deve ter no mínimo 8 caracteres');
  if (!checks[1].valid) errors.push('A senha deve conter pelo menos uma letra maiúscula');
  if (!checks[2].valid) errors.push('A senha deve conter pelo menos uma letra minúscula');
  if (!checks[3].valid) errors.push('A senha deve conter pelo menos um número');
  if (!checks[4].valid) errors.push('A senha deve conter pelo menos um caractere especial');
  if (!checks[5].valid) errors.push('Esta senha é muito comum e fácil de adivinhar');
  if (!checks[6].valid) errors.push('A senha contém sequências óbvias como "123" ou "abc"');

  const validCount = checks.filter(c => c.valid).length;
  const strengthPercent = Math.round((validCount / checks.length) * 100);
  
  let strength: PasswordValidationResult['strength'] = 'weak';
  if (validCount >= 7) {
    strength = 'very-strong';
  } else if (validCount >= 5) {
    strength = 'strong';
  } else if (validCount >= 3) {
    strength = 'medium';
  }

  return {
    isValid: checks.every(c => c.valid),
    strength,
    strengthPercent,
    checks,
    errors,
  };
}

function isCommonPassword(password: string): boolean {
  const normalized = password.toLowerCase().trim();
  return COMMON_PASSWORDS.some(common => 
    normalized === common || 
    normalized.includes(common) ||
    common.includes(normalized)
  );
}

function hasCommonSequence(password: string): boolean {
  const normalized = password.toLowerCase();
  
  // Check for common sequences
  const hasSequence = COMMON_SEQUENCES.some(seq => normalized.includes(seq));
  
  // Check for repeated characters (more than 2 in a row)
  const hasRepeated = /(.)\1{2,}/.test(normalized);
  
  return hasSequence || hasRepeated;
}

export function usePasswordValidation(password: string): PasswordValidationResult {
  return useMemo(() => validatePassword(password), [password]);
}

export function getStrengthColor(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very-strong':
      return 'bg-success';
    case 'strong':
      return 'bg-success/70';
    case 'medium':
      return 'bg-warning';
    default:
      return 'bg-destructive';
  }
}

export function getStrengthLabel(strength: PasswordValidationResult['strength']): string {
  switch (strength) {
    case 'very-strong':
      return 'Muito forte';
    case 'strong':
      return 'Forte';
    case 'medium':
      return 'Média';
    default:
      return 'Fraca';
  }
}
