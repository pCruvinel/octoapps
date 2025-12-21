/**
 * Calculation Engine v3.0
 * 
 * Main entry point for the refactored calculation module.
 * Uses Strategy Pattern with decimal.js for precise financial calculations.
 * 
 * @module calculationEngine
 */

// Types
export * from './types';

// Utilities
export * from './utils';

// Factory
export { CalculationFactory, createCalculationStrategy } from './factory';

// Strategies (for direct import if needed)
export { BaseStrategy } from './strategies/base.strategy';
export { EmprestimoStrategy } from './strategies/emprestimo.strategy';
export { ImobiliarioStrategy } from './strategies/imobiliario.strategy';
export { CartaoRMCStrategy } from './strategies/cartao-rmc.strategy';

// Re-export Decimal for convenience
export { default as Decimal } from 'decimal.js';
