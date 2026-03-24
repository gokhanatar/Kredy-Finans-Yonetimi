import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Bell,
  TrendingUp,
  Shield,
  ChevronRight,
  Sparkles,
  Wallet,
  Target,
  PieChart,
  Eye,
  Crown,
  Building2,
  Brain,
  Cloud,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_SLIDES = [
  {
    id: 1,
    icon: CreditCard,
    iconBg: 'from-primary to-primary/70',
    titleKey: 'slides.1.title',
    descriptionKey: 'slides.1.description',
  },
  {
    id: 2,
    icon: Bell,
    iconBg: 'from-warning to-warning/70',
    titleKey: 'slides.2.title',
    descriptionKey: 'slides.2.description',
  },
  {
    id: 3,
    icon: Wallet,
    iconBg: 'from-emerald-500 to-emerald-500/70',
    titleKey: 'slides.3.title',
    descriptionKey: 'slides.3.description',
  },
  {
    id: 4,
    icon: Building2,
    iconBg: 'from-cyan-500 to-cyan-600/70',
    titleKey: 'slides.4.title',
    descriptionKey: 'slides.4.description',
  },
  {
    id: 5,
    icon: Target,
    iconBg: 'from-pink-500 to-rose-500/70',
    titleKey: 'slides.5.title',
    descriptionKey: 'slides.5.description',
  },
  {
    id: 6,
    icon: TrendingUp,
    iconBg: 'from-success to-success/70',
    titleKey: 'slides.6.title',
    descriptionKey: 'slides.6.description',
  },
  {
    id: 7,
    icon: Brain,
    iconBg: 'from-violet-500 to-purple-600/70',
    titleKey: 'slides.7.title',
    descriptionKey: 'slides.7.description',
  },
  {
    id: 8,
    icon: Eye,
    iconBg: 'from-slate-600 to-slate-700/70',
    titleKey: 'slides.8.title',
    descriptionKey: 'slides.8.description',
  },
  {
    id: 9,
    icon: Cloud,
    iconBg: 'from-sky-500 to-blue-600/70',
    titleKey: 'slides.9.title',
    descriptionKey: 'slides.9.description',
  },
  {
    id: 10,
    icon: Crown,
    iconBg: 'from-warning to-amber-500/70',
    titleKey: 'slides.10.title',
    descriptionKey: 'slides.10.description',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useTranslation(['onboarding']);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Skip Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('common:actions.skip')}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div className={cn(
              'mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg',
              slide.iconBg
            )}>
              <slide.icon className="h-14 w-14 text-white" />
            </div>

            {/* Slide Counter */}
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              {currentSlide + 1} / {ONBOARDING_SLIDES.length}
            </p>

            {/* Title */}
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              {t(slide.titleKey)}
            </h1>

            {/* Description */}
            <p className="max-w-sm text-muted-foreground leading-relaxed">
              {t(slide.descriptionKey)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-8">
        {/* Dots */}
        <div className="mb-6 flex justify-center gap-1.5">
          {ONBOARDING_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : index < currentSlide
                    ? 'w-2 bg-primary/40'
                    : 'w-2 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Button */}
        <Button
          onClick={handleNext}
          className={cn(
            'w-full py-6 text-lg font-semibold',
            isLastSlide && 'bg-gradient-to-r from-warning to-amber-500 hover:from-warning/90 hover:to-amber-500/90 text-white'
          )}
          size="lg"
        >
          {isLastSlide ? (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              {t('startButton')}
            </>
          ) : (
            <>
              {t('common:actions.continue')}
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
