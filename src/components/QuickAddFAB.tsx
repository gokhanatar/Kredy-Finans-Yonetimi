import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { GlobalQuickAdd } from '@/components/GlobalQuickAdd';

interface QuickAddFABProps {
  onAddExpense?: () => void;
  onAddIncome?: () => void;
  onPayBill?: () => void;
}

export function QuickAddFAB(_props: QuickAddFABProps) {
  const [showSheet, setShowSheet] = useState(false);

  return (
    <>
      {/* Main FAB button — opens bottom sheet */}
      <div className="fixed right-5 z-40" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <motion.button
          onClick={() => setShowSheet(true)}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </motion.button>
      </div>

      {/* Global Quick Add Sheet */}
      <GlobalQuickAdd open={showSheet} onOpenChange={setShowSheet} />
    </>
  );
}
