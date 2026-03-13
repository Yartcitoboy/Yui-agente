// mi_calculadora/index.js
const expression = process.argv[2];
if (!expression) {
  console.log('Uso: node index.js "2+3"');
  process.exit(1);
}

// Validar formato simple: número operador número (ej: 2+3, 5-2)
const match = expression.match(/^(-?\d+)\s*([+\-])\s*(-?\d+)$/);
if (!match) {
  console.log('Formato no válido. Usa una operación simple como "2+3" o "5-2".');
  process.exit(1);
}

const [, a, op, b] = match;
const num1 = parseInt(a, 10);
const num2 = parseInt(b, 10);
let result;

switch (op) {
  case '+': result = num1 + num2; break;
  case '-': result = num1 - num2; break;
  default: result = 'Operador no soportado';
}

console.log(`Resultado: ${result}`);