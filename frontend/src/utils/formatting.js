export const formatCurrency = (number) => {
  if (number === null || number === undefined) {
    return '';
  }

  // Convertir a string con 2 decimales fijos
  const fixedNumber = Number(number).toFixed(2);
  
  // Separar la parte entera de la decimal
  let [integerPart, decimalPart] = fixedNumber.split('.');

  // Añadir separadores de miles a la parte entera
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Unir la parte entera y la decimal con una coma
  return `${integerPart},${decimalPart}`;
};
