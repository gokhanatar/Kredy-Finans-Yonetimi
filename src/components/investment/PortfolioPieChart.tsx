import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Investment, InvestmentCategory, INVESTMENT_CATEGORY_LABEL_KEYS, INVESTMENT_CATEGORY_EMOJIS } from '@/types/investment';
import { useInvestmentPricesContext } from '@/contexts/InvestmentPricesContext';

interface PortfolioPieChartProps {
  investments: Investment[];
}

const COLORS: Record<InvestmentCategory, string> = {
  altin: '#f59e0b',
  gumus: '#94a3b8',
  doviz: '#22c55e',
  hisse: '#3b82f6',
  kripto: '#a855f7',
};

export function PortfolioPieChart({ investments }: PortfolioPieChartProps) {
  const { t } = useTranslation(['investments']);
  const { getCurrentValue } = useInvestmentPricesContext();

  if (investments.length === 0) return null;

  const data = (Object.keys(INVESTMENT_CATEGORY_LABEL_KEYS) as InvestmentCategory[])
    .map((cat) => {
      const catInvestments = investments.filter((inv) => inv.category === cat);
      if (catInvestments.length === 0) return null;

      const value = catInvestments.reduce((sum, inv) => {
        const currentVal = getCurrentValue(inv.subType, inv.quantity);
        return sum + (currentVal > 0 ? currentVal : inv.quantity * inv.purchasePrice);
      }, 0);

      return {
        name: t(INVESTMENT_CATEGORY_LABEL_KEYS[cat]),
        emoji: INVESTMENT_CATEGORY_EMOJIS[cat],
        value,
        color: COLORS[cat],
      };
    })
    .filter(Boolean) as { name: string; emoji: string; value: number; color: string }[];

  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <h3 className="font-semibold text-sm mb-3">Portföy Dağılımı</h3>
      <div className="flex items-center gap-4">
        <div className="h-[160px] w-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`,
                  'Değer',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs">{item.emoji} {item.name}</span>
              </div>
              <span className="text-xs font-medium">
                %{((item.value / total) * 100).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
