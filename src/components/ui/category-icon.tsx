import {
  CreditCard, Clock, Sparkles, BarChart3, Thermometer, Coins,
  MessageSquare, Target, Lightbulb, TrendingUp, Banknote, HandCoins,
  Home, Gem, ShoppingCart, FileText, Bus, HeartPulse, GraduationCap,
  Film, Shirt, UtensilsCrossed, Armchair, Baby, PawPrint, Gift, Car,
  Shield, Package, Smartphone, Music, Gamepad2, Cloud, Dumbbell,
  Newspaper, Monitor, Coffee, Cigarette, Fuel, CircleParking,
  Briefcase, UserRound, Plane, Laptop, Palmtree, Star, Landmark,
  Bell, Calendar, ClipboardList, Bot, Play, Smile, Meh, Frown, Flame,
  Zap, Droplets, Wifi, Building2, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'credit-card': CreditCard,
  'clock': Clock,
  'sparkles': Sparkles,
  'bar-chart': BarChart3,
  'thermometer': Thermometer,
  'coins': Coins,
  'message-square': MessageSquare,
  'target': Target,
  'lightbulb': Lightbulb,
  'trending-up': TrendingUp,
  'banknote': Banknote,
  'hand-coins': HandCoins,
  'home': Home,
  'gem': Gem,
  'shopping-cart': ShoppingCart,
  'file-text': FileText,
  'bus': Bus,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'film': Film,
  'shirt': Shirt,
  'utensils-crossed': UtensilsCrossed,
  'armchair': Armchair,
  'baby': Baby,
  'paw-print': PawPrint,
  'gift': Gift,
  'car': Car,
  'shield': Shield,
  'package': Package,
  'smartphone': Smartphone,
  'music': Music,
  'gamepad-2': Gamepad2,
  'cloud': Cloud,
  'dumbbell': Dumbbell,
  'newspaper': Newspaper,
  'monitor': Monitor,
  'coffee': Coffee,
  'cigarette': Cigarette,
  'fuel': Fuel,
  'circle-parking': CircleParking,
  'briefcase': Briefcase,
  'user-round': UserRound,
  'plane': Plane,
  'laptop': Laptop,
  'palmtree': Palmtree,
  'star': Star,
  'landmark': Landmark,
  'bell': Bell,
  'calendar': Calendar,
  'clipboard-list': ClipboardList,
  'bot': Bot,
  'play': Play,
  'smile': Smile,
  'meh': Meh,
  'frown': Frown,
  'flame': Flame,
  'zap': Zap,
  'droplets': Droplets,
  'wifi': Wifi,
  'building-2': Building2,
};

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ name, size = 18, className }: CategoryIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <span className={className}>{name}</span>;
  return <Icon size={size} className={className} />;
}
