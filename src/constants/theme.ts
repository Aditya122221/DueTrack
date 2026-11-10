/**
 * DueTrack Theme - Obsidian & Champagne
 * Luxury fintech · Minimalist · Sophisticated
 */

export const Colors = {
  // Brand Core Colors
  obsidian: '#171717',        // Obsidian Black - Primary deep background
  champagne: '#C6A56B',       // Champagne Gold - Luxury primary accent
  warmIvory: '#F5F1E8',       // Warm Ivory - Primary contrast text & highlight surface
  graphite: '#292929',        // Graphite - Elevated cards, borders, input backgrounds

  // Luxury Extended Palette
  champagneLight: '#DFCA9E',  // Soft gold highlight
  champagneDark: '#8F713E',   // Deep burnished gold
  champagneMuted: 'rgba(198, 165, 107, 0.15)', // Subtle gold ambient glow
  champagneBorder: 'rgba(198, 165, 107, 0.35)', // Accent borders

  // Backgrounds & Surfaces
  background: '#121212',      // Deepest background for true OLED depth
  backgroundSecondary: '#171717', // Obsidian Black
  card: '#1F1F1F',            // Rich graphite card surface
  cardElevated: '#292929',    // Elevated card / modal background
  surfaceInput: '#242424',    // Input fields

  // Borders & Dividers
  border: '#333333',
  borderLight: '#444444',
  divider: 'rgba(245, 241, 232, 0.08)',

  // Typography Colors
  textPrimary: '#F5F1E8',     // Warm Ivory - High contrast, soft on eyes
  textSecondary: '#A9A398',   // Muted Warm Ivory for labels & secondary info
  textTertiary: '#736E66',    // Disabled / tertiary text
  textGold: '#C6A56B',        // Champagne Gold text

  // Khatabook Ledger Financial States (Sophisticated luxury variants)
  // "Gave" = Money given to others -> You will receive it back (Debit / Receivable)
  gave: '#E06D53',            // Luxury Terracotta Coral
  gaveLight: 'rgba(224, 109, 83, 0.15)',
  gaveBorder: 'rgba(224, 109, 83, 0.35)',

  // "Got" = Money received from others -> You owe them or they settled (Credit / Payable)
  got: '#4EBA87',             // Sophisticated Sage Emerald
  gotLight: 'rgba(78, 186, 135, 0.15)',
  gotBorder: 'rgba(78, 186, 135, 0.35)',

  // Neutral / Settled
  settled: '#8E8E8E',
  settledLight: 'rgba(142, 142, 142, 0.12)',

  // Status Alerts
  success: '#4EBA87',
  warning: '#E5A93C',
  danger: '#E06D53',
  info: '#6BA4C6',
};

export const Typography = {
  // Fonts mapped to requirements:
  // Sora: Distinctive branding & key currency highlights
  brand: 'Sora_700Bold',
  brandSemiBold: 'Sora_600SemiBold',
  brandRegular: 'Sora_400Regular',

  // Plus Jakarta Sans: Premium headings & titles
  heading: 'PlusJakartaSans_700Bold',
  headingSemiBold: 'PlusJakartaSans_600SemiBold',
  headingMedium: 'PlusJakartaSans_500Medium',

  // Manrope: Dashboard & application UI
  ui: 'Manrope_600SemiBold',
  uiMedium: 'Manrope_500Medium',
  uiRegular: 'Manrope_400Regular',
  uiBold: 'Manrope_700Bold',

  // DM Sans: Clean interface & data tables
  data: 'DMSans_500Medium',
  dataRegular: 'DMSans_400Regular',
  dataBold: 'DMSans_700Bold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Currencies: Record<string, { code: string; symbol: string; name: string }> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
};

