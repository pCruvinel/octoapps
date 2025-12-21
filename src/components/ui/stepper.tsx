'use client';

import * as React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// ============================================================================
// TYPES
// ============================================================================

export interface StepConfig {
    id: string;
    title: string;
    description?: string;
}

interface StepperContextValue {
    currentStep: number;
    totalSteps: number;
    goToStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const StepperContext = React.createContext<StepperContextValue | undefined>(undefined);

export function useStepperContext() {
    const context = React.useContext(StepperContext);
    if (!context) {
        throw new Error('useStepperContext must be used within a StepperProvider');
    }
    return context;
}

// Alias for backward compatibility
export const useStepper = useStepperContext;

// ============================================================================
// STEPPER PROVIDER
// ============================================================================

interface StepperProviderProps {
    children: React.ReactNode;
    totalSteps: number;
    initialStep?: number;
    onStepChange?: (step: number) => void;
}

export function StepperProvider({
    children,
    totalSteps,
    initialStep = 0,
    onStepChange,
}: StepperProviderProps) {
    const [currentStep, setCurrentStep] = React.useState(initialStep);

    const goToStep = React.useCallback(
        (step: number) => {
            if (step >= 0 && step < totalSteps) {
                setCurrentStep(step);
                onStepChange?.(step);
            }
        },
        [totalSteps, onStepChange]
    );

    const nextStep = React.useCallback(() => {
        goToStep(currentStep + 1);
    }, [currentStep, goToStep]);

    const prevStep = React.useCallback(() => {
        goToStep(currentStep - 1);
    }, [currentStep, goToStep]);

    const value = React.useMemo(
        () => ({
            currentStep,
            totalSteps,
            goToStep,
            nextStep,
            prevStep,
            isFirstStep: currentStep === 0,
            isLastStep: currentStep === totalSteps - 1,
        }),
        [currentStep, totalSteps, goToStep, nextStep, prevStep]
    );

    return <StepperContext.Provider value={value}>{children}</StepperContext.Provider>;
}

// ============================================================================
// STEPPER (Visual Progress Indicator)
// ============================================================================

interface StepperProps {
    steps: StepConfig[];
    currentStep: number;
    className?: string;
    orientation?: 'horizontal' | 'vertical';
}

export function Stepper({ steps, currentStep, className, orientation = 'horizontal' }: StepperProps) {
    return (
        <div
            className={cn(
                'flex gap-2',
                orientation === 'vertical' ? 'flex-col' : 'flex-row items-center justify-between',
                className
            )}
        >
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex items-center gap-3 flex-1">
                            {/* Step Circle */}
                            <div
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all shrink-0',
                                    isCompleted && 'border-emerald-500 bg-emerald-500 text-white',
                                    isCurrent && 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100',
                                    !isCompleted && !isCurrent && 'border-slate-300 bg-white text-slate-400'
                                )}
                            >
                                {isCompleted ? <Check className="h-5 w-5" /> : index + 1}
                            </div>

                            {/* Step Text */}
                            <div className="hidden sm:block min-w-0">
                                <p
                                    className={cn(
                                        'text-sm font-medium truncate',
                                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'
                                    )}
                                >
                                    {step.title}
                                </p>
                                {step.description && (
                                    <p className="text-xs text-slate-400 truncate">{step.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && orientation === 'horizontal' && (
                            <div
                                className={cn(
                                    'hidden sm:block h-0.5 w-8 lg:w-16',
                                    isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ============================================================================
// STEPPER CONTENT
// ============================================================================

interface StepperContentProps {
    children: React.ReactNode;
    step: number;
    className?: string;
}

export function StepperContent({ children, step, className }: StepperContentProps) {
    const { currentStep } = useStepperContext();

    if (currentStep !== step) {
        return null;
    }

    return <div className={cn('animate-in fade-in-50 duration-300', className)}>{children}</div>;
}

// ============================================================================
// STEPPER NAVIGATION
// ============================================================================

interface StepperNavigationProps {
    className?: string;
    showPrevious?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    completeLabel?: string;
    onNext?: () => Promise<boolean> | boolean;
    onPrev?: () => void;
    onComplete?: () => void;
    isLoading?: boolean;
    isNextDisabled?: boolean;
}

export function StepperNavigation({
    className,
    showPrevious = true,
    prevLabel = 'Anterior',
    nextLabel = 'Próximo',
    completeLabel = 'Finalizar',
    onNext,
    onPrev,
    onComplete,
    isLoading = false,
    isNextDisabled = false,
}: StepperNavigationProps) {
    const { prevStep, nextStep, isFirstStep, isLastStep } = useStepperContext();

    const handlePrev = () => {
        onPrev?.();
        prevStep();
    };

    const handleNext = async () => {
        if (onNext) {
            const canProceed = await onNext();
            if (canProceed) {
                nextStep();
            }
        } else {
            nextStep();
        }
    };

    const handleComplete = () => {
        onComplete?.();
    };

    return (
        <div className={cn('flex justify-between items-center', className)}>
            {showPrevious && !isFirstStep ? (
                <Button variant="outline" onClick={handlePrev} disabled={isLoading}>
                    {prevLabel}
                </Button>
            ) : (
                <div />
            )}

            {isLastStep ? (
                <Button onClick={handleComplete} disabled={isLoading || isNextDisabled}>
                    {isLoading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Processando...
                        </>
                    ) : (
                        completeLabel
                    )}
                </Button>
            ) : (
                <Button onClick={handleNext} disabled={isLoading || isNextDisabled}>
                    {nextLabel}
                </Button>
            )}
        </div>
    );
}
