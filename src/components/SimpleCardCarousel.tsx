import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard as CreditCardType } from '@/types/finance';
import { calculateGoldenWindow } from '@/lib/financeUtils';
import { formatCurrency } from '@/lib/financeUtils';
import { usePrivacyModeContext } from '@/contexts/PrivacyModeContext';
import { ChevronRight, Star, CreditCard, Plus } from 'lucide-react';

interface SimpleCardCarouselProps {
  cards: CreditCardType[];
}

export function SimpleCardCarousel({ cards }: SimpleCardCarouselProps) {
  const navigate = useNavigate();
  const { isPrivate } = usePrivacyModeContext();
  const goldenCards = calculateGoldenWindow(cards);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = 192; // 180px + 12px gap
      setActiveIndex(Math.round(scrollLeft / cardWidth));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Kartlarım
          </h3>
        </div>
        <button
          onClick={() => navigate('/wallet?tab=kartlar')}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/20 p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">İlk kartınızı ekleyin</p>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <CreditCard className="h-4 w-4" /> Kartlarım
        </h3>
        <button
          onClick={() => navigate('/wallet?tab=kartlar')}
          className="text-xs text-primary font-medium flex items-center gap-0.5"
        >
          Tümü <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory"
      >
        {cards.map((card) => {
          const golden = goldenCards.find((g) => g.card.id === card.id);
          const isGolden = golden?.isGoldenWindow;

          return (
            <button
              key={card.id}
              onClick={() => navigate('/wallet?tab=kartlar')}
              className={`relative flex-shrink-0 w-[180px] rounded-2xl p-4 shadow-soft transition-transform active:scale-[0.97] overflow-hidden snap-start bg-gradient-to-br ${card.color || "from-slate-600 to-slate-800"}`}
            >
              {/* Decorative circle */}
              <div
                className="absolute -top-6 -right-6 h-20 w-20 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              />
              <div
                className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-medium text-white/80 truncate max-w-[100px]">
                    {card.bankName}
                  </span>
                  {isGolden && (
                    <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                  )}
                </div>
                <p className="text-xs text-white/70 truncate">{card.cardName}</p>
                <p className="text-lg font-bold text-white mt-1.5">
                  {isPrivate ? '••••' : formatCurrency(card.currentDebt)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination dots */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-4 bg-primary'
                  : 'w-1.5 bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
