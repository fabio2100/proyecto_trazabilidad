export const textRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ' ]*$/;

export const validateTextField = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} es requerido`;
  }
  if (!textRegex.test(value)) {
    return `${fieldName} solo puede contener letras, espacios y acentos`;
  }
  return '';
};

export const validateNumber = (value: string, fieldName: string, allowZero = false): string => {
  if (!value.trim()) {
    return `${fieldName} es requerido`;
  }
  if (!/^\d+$/.test(value)) {
    return `${fieldName} solo puede contener números`;
  }
  const num = parseInt(value, 10);
  if (!allowZero && num <= 0) {
    return `${fieldName} debe ser mayor a 0`;
  }
  return '';
};

export const validateEdad = (value: string): string => {
  return validateNumber(value, 'Edad', false);
};

export const validateDni = (value: string): string => {
  return validateNumber(value, 'DNI', true);
};

export const validateTelefono = (value: string): string => {
  return validateNumber(value, 'Teléfono', true);
};

export const validateSelect = (value: string, fieldName: string): string => {
  if (!value.trim()) {
    return `${fieldName} es requerido`;
  }
  return '';
};
