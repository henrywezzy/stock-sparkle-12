import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  SkipForward, 
  CheckCircle2,
  Sparkles,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  HardHat,
  FileText,
  Warehouse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOnboarding, ONBOARDING_STEPS } from "@/hooks/useOnboarding";
import { cn } from "@/lib/utils";

const stepIcons: Record<string, React.ReactNode> = {
  welcome: <Sparkles className="w-8 h-8" />,
  dashboard: <Package className="w-8 h-8" />,
  products: <Package className="w-8 h-8" />,
  entries: <ArrowDownToLine className="w-8 h-8" />,
  exits: <ArrowUpFromLine className="w-8 h-8" />,
  epis: <HardHat className="w-8 h-8" />,
  reports: <FileText className="w-8 h-8" />,
  warehouse: <Warehouse className="w-8 h-8" />,
  complete: <CheckCircle2 className="w-8 h-8" />,
};

const stepRoutes: Record<string, string> = {
  dashboard: "/",
  products: "/produtos",
  entries: "/entradas",
  exits: "/saidas",
  epis: "/epis",
  reports: "/relatorios",
  warehouse: "/armazem",
};

export function OnboardingTour() {
  const navigate = useNavigate();
  const { 
    currentStep, 
    currentStepIndex, 
    totalSteps,
    completeStep,
    skipOnboarding,
    completeOnboarding,
    shouldShowOnboarding,
  } = useOnboarding();
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowOnboarding()) {
        setIsVisible(true);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [shouldShowOnboarding]);

  if (!isVisible || !currentStep) return null;

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = async () => {
    await completeStep(currentStep.id);
    
    // Navigate to next step's route if available
    const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];
    if (nextStep && stepRoutes[nextStep.id]) {
      navigate(stepRoutes[nextStep.id]);
    }
  };

  const handlePrevious = () => {
    const prevStep = ONBOARDING_STEPS[currentStepIndex - 1];
    if (prevStep && stepRoutes[prevStep.id]) {
      navigate(stepRoutes[prevStep.id]);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    setIsVisible(false);
  };

  const handleComplete = async () => {
    await completeOnboarding();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-4 bottom-4 sm:inset-auto sm:bottom-8 sm:right-8 sm:w-[400px] z-50"
          >
            <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
              {/* Progress Bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "p-3 rounded-xl",
                    currentStep.id === "complete" 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {stepIcons[currentStep.id]}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-1 -mr-2"
                    onClick={handleSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="space-y-2 mb-6">
                  <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentStep.description}
                  </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-1 mb-4">
                  {ONBOARDING_STEPS.map((step, idx) => (
                    <div
                      key={step.id}
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        idx < currentStepIndex
                          ? "bg-primary"
                          : idx === currentStepIndex
                          ? "bg-primary/50"
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Passo {currentStepIndex + 1} de {totalSteps}
                  </div>
                  
                  <div className="flex gap-2">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                    )}
                    
                    {isLastStep ? (
                      <Button
                        size="sm"
                        onClick={handleComplete}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Concluir
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSkip}
                          className="text-muted-foreground"
                        >
                          <SkipForward className="h-4 w-4 mr-1" />
                          Pular
                        </Button>
                        <Button size="sm" onClick={handleNext}>
                          Próximo
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
