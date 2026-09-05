/**
 * safeCalculator.util.js
 * 
 * Secure mathematical expression evaluator for PeoplePay360 payroll calculations.
 * STRICT SECURITY: Zero use of eval() or dynamic Function() constructors.
 * Evaluates arithmetic expressions, ternary conditions, and safe math functions.
 */

class SafeCalculator {
  /**
   * Extract all variable identifier tokens from a formula string.
   * Useful for dependency analysis and validating formula references.
   * e.g. "BASIC * 0.4 + allowances" -> ["BASIC", "allowances"]
   */
  static extractVariables(formula) {
    if (!formula || typeof formula !== 'string') return [];
    
    // Replace string literals or comments if any
    const cleaned = formula.replace(/\s+/g, ' ');
    
    // Tokenize potential identifiers (letters, underscores, dots for contract.salary)
    const matches = cleaned.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g) || [];
    
    // Filter out math functions and operators
    const reservedWords = new Set([
      'min', 'max', 'round', 'floor', 'ceil', 'abs',
      'true', 'false', 'null', 'undefined'
    ]);
    
    const variables = matches.filter((word) => !reservedWords.has(word.toLowerCase()));
    return [...new Set(variables)];
  }

  /**
   * Safe evaluation of mathematical expressions with context variables.
   * Supports: +, -, *, /, %, ^, parentheses, ternary (cond ? trueExpr : falseExpr),
   * comparison (<, <=, >, >=, ==, ===, !=, !==), and math functions (min, max, round, floor, ceil, abs).
   */
  static evaluate(expression, context = {}) {
    if (typeof expression === 'number') return expression;
    if (!expression || typeof expression !== 'string') {
      throw new Error('Invalid expression provided for calculation');
    }

    const trimmed = expression.trim();
    if (!trimmed) return 0;

    // Build case-insensitive variable resolver
    const resolvedContext = {};
    for (const [key, val] of Object.entries(context)) {
      resolvedContext[key.toUpperCase()] = Number(val) || 0;
      resolvedContext[key] = Number(val) || 0;
    }

    // Helper for nested properties like contract.salary / contract.wage
    const getContextValue = (identifier) => {
      if (identifier.includes('.')) {
        const parts = identifier.split('.');
        let curr = context;
        for (const p of parts) {
          if (curr && typeof curr === 'object' && p in curr) {
            curr = curr[p];
          } else {
            curr = undefined;
            break;
          }
        }
        if (curr !== undefined) return Number(curr) || 0;
      }

      if (identifier in resolvedContext) return resolvedContext[identifier];
      if (identifier.toUpperCase() in resolvedContext) return resolvedContext[identifier.toUpperCase()];

      // Normalize common synonyms
      if (identifier.toLowerCase() === 'deductions' && 'TOTAL_DEDUCTION' in resolvedContext) {
        return resolvedContext['TOTAL_DEDUCTION'];
      }
      if (identifier.toLowerCase() === 'allowances' && 'TOTAL_ALLOWANCE' in resolvedContext) {
        return resolvedContext['TOTAL_ALLOWANCE'];
      }

      throw new Error(`Undefined variable '${identifier}' in formula: "${expression}"`);
    };

    // Recursive Descent Parser
    let pos = 0;

    const peek = () => trimmed[pos];
    const isWhitespace = (ch) => /\s/.test(ch);

    const skipWhitespace = () => {
      while (pos < trimmed.length && isWhitespace(trimmed[pos])) {
        pos++;
      }
    };

    // Parse ternary conditional: condition ? expr1 : expr2
    const parseTernary = () => {
      const condition = parseComparison();
      skipWhitespace();

      if (pos < trimmed.length && trimmed[pos] === '?') {
        pos++; // consume '?'
        const trueExpr = parseTernary();
        skipWhitespace();
        if (pos >= trimmed.length || trimmed[pos] !== ':') {
          throw new Error(`Syntax error: expected ':' in ternary expression "${expression}"`);
        }
        pos++; // consume ':'
        const falseExpr = parseTernary();
        return condition ? trueExpr : falseExpr;
      }

      return condition;
    };

    // Parse comparison operators: <, <=, >, >=, ==, !=
    const parseComparison = () => {
      let left = parseAdditive();
      skipWhitespace();

      while (pos < trimmed.length) {
        if (trimmed.startsWith('<=', pos)) {
          pos += 2;
          const right = parseAdditive();
          left = left <= right ? 1 : 0;
        } else if (trimmed.startsWith('>=', pos)) {
          pos += 2;
          const right = parseAdditive();
          left = left >= right ? 1 : 0;
        } else if (trimmed.startsWith('===', pos) || trimmed.startsWith('==', pos)) {
          pos += trimmed.startsWith('===', pos) ? 3 : 2;
          const right = parseAdditive();
          left = left === right ? 1 : 0;
        } else if (trimmed.startsWith('!==', pos) || trimmed.startsWith('!=', pos)) {
          pos += trimmed.startsWith('!==', pos) ? 3 : 2;
          const right = parseAdditive();
          left = left !== right ? 1 : 0;
        } else if (trimmed[pos] === '<') {
          pos++;
          const right = parseAdditive();
          left = left < right ? 1 : 0;
        } else if (trimmed[pos] === '>') {
          pos++;
          const right = parseAdditive();
          left = left > right ? 1 : 0;
        } else {
          break;
        }
        skipWhitespace();
      }

      return left;
    };

    // Parse additive operators: +, -
    const parseAdditive = () => {
      let left = parseMultiplicative();
      skipWhitespace();

      while (pos < trimmed.length && (trimmed[pos] === '+' || trimmed[pos] === '-')) {
        const op = trimmed[pos];
        pos++;
        const right = parseMultiplicative();
        if (op === '+') left += right;
        else left -= right;
        skipWhitespace();
      }

      return left;
    };

    // Parse multiplicative operators: *, /, %
    const parseMultiplicative = () => {
      let left = parsePower();
      skipWhitespace();

      while (pos < trimmed.length && (trimmed[pos] === '*' || trimmed[pos] === '/' || trimmed[pos] === '%')) {
        const op = trimmed[pos];
        pos++;
        const right = parsePower();
        if (op === '*') {
          left *= right;
        } else if (op === '/') {
          if (right === 0) left = 0; // Safe division by zero
          else left /= right;
        } else if (op === '%') {
          if (right === 0) left = 0;
          else left %= right;
        }
        skipWhitespace();
      }

      return left;
    };

    // Parse exponentiation: ^
    const parsePower = () => {
      let left = parseUnary();
      skipWhitespace();

      if (pos < trimmed.length && trimmed[pos] === '^') {
        pos++;
        const right = parsePower();
        left = Math.pow(left, right);
      }

      return left;
    };

    // Parse unary operators: +, -
    const parseUnary = () => {
      skipWhitespace();
      if (pos < trimmed.length && (trimmed[pos] === '+' || trimmed[pos] === '-')) {
        const op = trimmed[pos];
        pos++;
        const val = parseUnary();
        return op === '-' ? -val : val;
      }
      return parsePrimary();
    };

    // Parse primary values: numbers, variables, functions, parentheses
    const parsePrimary = () => {
      skipWhitespace();
      if (pos >= trimmed.length) {
        throw new Error(`Unexpected end of expression "${expression}"`);
      }

      const ch = trimmed[pos];

      // Parentheses ( ... )
      if (ch === '(') {
        pos++; // consume '('
        const result = parseTernary();
        skipWhitespace();
        if (pos >= trimmed.length || trimmed[pos] !== ')') {
          throw new Error(`Missing closing parenthesis in "${expression}"`);
        }
        pos++; // consume ')'
        return result;
      }

      // Numbers: integer or float
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(trimmed[pos + 1] || ''))) {
        let numStr = '';
        while (pos < trimmed.length && /[0-9.]/.test(trimmed[pos])) {
          numStr += trimmed[pos];
          pos++;
        }
        // Percentage notation: e.g. "40%" -> 0.4
        skipWhitespace();
        if (pos < trimmed.length && trimmed[pos] === '%') {
          pos++;
          return parseFloat(numStr) / 100;
        }
        return parseFloat(numStr);
      }

      // Identifiers / Variables / Functions
      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (pos < trimmed.length && /[a-zA-Z0-9_.]/.test(trimmed[pos])) {
          ident += trimmed[pos];
          pos++;
        }

        skipWhitespace();

        // Check if it's a function call e.g. min(a, b)
        if (pos < trimmed.length && trimmed[pos] === '(') {
          pos++; // consume '('
          const args = [];
          skipWhitespace();
          if (pos < trimmed.length && trimmed[pos] !== ')') {
            args.push(parseTernary());
            skipWhitespace();
            while (pos < trimmed.length && trimmed[pos] === ',') {
              pos++; // consume ','
              args.push(parseTernary());
              skipWhitespace();
            }
          }
          if (pos >= trimmed.length || trimmed[pos] !== ')') {
            throw new Error(`Missing closing parenthesis in function call '${ident}'`);
          }
          pos++; // consume ')'

          const fnName = ident.toLowerCase();
          switch (fnName) {
            case 'min':
              return Math.min(...args);
            case 'max':
              return Math.max(...args);
            case 'round':
              return Math.round(args[0] || 0);
            case 'floor':
              return Math.floor(args[0] || 0);
            case 'ceil':
              return Math.ceil(args[0] || 0);
            case 'abs':
              return Math.abs(args[0] || 0);
            default:
              throw new Error(`Unsupported function '${ident}' in formula`);
          }
        }

        // Percentage suffix on variable? e.g. BASIC * 40%
        skipWhitespace();
        const value = getContextValue(ident);
        if (pos < trimmed.length && trimmed[pos] === '%') {
          pos++;
          return value / 100;
        }
        return value;
      }

      throw new Error(`Unexpected character '${ch}' at position ${pos} in "${expression}"`);
    };

    const result = parseTernary();
    skipWhitespace();
    if (pos < trimmed.length) {
      throw new Error(`Unexpected extra tokens at end of formula: "${trimmed.slice(pos)}"`);
    }

    return isNaN(result) ? 0 : Number(result);
  }
}

module.exports = SafeCalculator;
