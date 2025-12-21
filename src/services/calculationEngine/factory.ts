/**
 * Calculation Engine v3.0 - Factory Pattern
 * 
 * Creates appropriate strategy based on calculation module type.
 */

import {
    CalculationModule,
    ICalculationFactory,
    ICalculationStrategy,
} from './types';
import { EmprestimoStrategy } from './strategies/emprestimo.strategy';
import { ImobiliarioStrategy } from './strategies/imobiliario.strategy';
import { CartaoRMCStrategy } from './strategies/cartao-rmc.strategy';

/**
 * Factory class for creating calculation strategies
 */
export class CalculationFactory implements ICalculationFactory {
    private static instance: CalculationFactory;

    private constructor() { }

    /**
     * Get singleton instance
     */
    public static getInstance(): CalculationFactory {
        if (!CalculationFactory.instance) {
            CalculationFactory.instance = new CalculationFactory();
        }
        return CalculationFactory.instance;
    }

    /**
     * Create strategy based on module type
     */
    public create(module: CalculationModule): ICalculationStrategy {
        switch (module) {
            case 'EMPRESTIMO':
                return new EmprestimoStrategy();

            case 'IMOBILIARIO':
                return new ImobiliarioStrategy();

            case 'CARTAO_RMC':
                return new CartaoRMCStrategy();

            default:
                throw new Error(`Unknown calculation module: ${module}`);
        }
    }
}

// Export convenience function
export function createCalculationStrategy(module: CalculationModule): ICalculationStrategy {
    return CalculationFactory.getInstance().create(module);
}
