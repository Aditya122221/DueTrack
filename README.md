# DueTrack ✦ Obsidian & Champagne

A luxury, serverless personal ledger and debt-tracking mobile application (Khatabook style) built with **React Native**, **Expo SDK 58**, and an integrated **Supabase** backend.

---

## 🎨 Brand Identity & Design System

### Color Palette: Obsidian & Champagne
* **Obsidian Black (`#171717`)**: Primary dark background creating deep OLED contrast and refined depth.
* **Champagne Gold (`#C6A56B`)**: Luxury primary accent for active states, branding, borders, and hero statistics.
* **Warm Ivory (`#F5F1E8`)**: Contrast typography and card highlights.
* **Graphite (`#292929`)**: Elevated cards, navigation surfaces, and modal sheets.
* **Financial Accents**:
  * **You Gave (`#E06D53` / Terracotta Coral)**: Money you gave/lent to friends (Debtor balance, receivable).
  * **You Got (`#4EBA87` / Sage Emerald)**: Money you received or repaid (Creditor balance, settled).

### Typography Hierarchy
* **Sora (`@expo-google-fonts/sora`)**: Distinctive branding, app logo, and large net currency values.
* **Plus Jakarta Sans (`@expo-google-fonts/plus-jakarta-sans`)**: Premium headings, contact names, and section titles.
* **Manrope (`@expo-google-fonts/manrope`)**: Dashboard UI, statistics, tabs, action buttons, and filter pills.
* **DM Sans (`@expo-google-fonts/dm-sans`)**: Clean interface, data tables, transaction notes, and inputs.

---

## 🚀 Key Features

1. **Net Balance Portfolio Card**
   * Real-time calculation of **Net Receivable** vs **Net Payable**.
   * Split view: Total amount you will get vs Total amount you will give.
   * Filter contacts by All, "You'll Get", "You'll Give", and "Settled".

2. **Per-Friend / Customer Ledger**
   * Full ledger statement for every contact.
   * Signature Khatabook Dual Action Bottom Bar:
     * 🟥 **YOU GAVE ₹** (Record money you gave/lent).
     * 🟩 **YOU GOT ₹** (Record money received/borrowed).
   * 1-Click **Settle Full Balance** action.
   * **WhatsApp Reminder**: Generates polite settlement reminders.
   * **PDF Ledger Statement**: Generates and shares Obsidian & Champagne styled PDF statements via `expo-print` & `expo-sharing`.

3. **Integrated Supabase Backend (No Hosting Required)**
   * Ready-to-execute schema in `supabase/schema.sql` with tables: `profiles`, `contacts`, `transactions`.
   * Row Level Security (RLS) policies and real-time sync enabled.
   * Zero-server infrastructure — client connects securely and directly to Supabase via `@supabase/supabase-js`.
   * Seamless offline caching with `@react-native-async-storage/async-storage`.
   * Built-in connection tester and credential switcher right inside the app settings.

4. **Multi-Currency Support**
   * Instant switcher for INR (`₹`), USD (`$`), EUR (`€`), GBP (`£`), AED (`د.إ`), CAD (`C$`), AUD (`A$`), and SGD (`S$`).

---

## ⚡ Quick Start

### 1. Install & Run
```bash
# Start development server
npx expo start
```
* Press `a` to run on Android emulator / device
* Press `i` to run on iOS simulator
* Press `w` to run on Web

### 2. Connect Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. In DueTrack, go to **Settings** > **Supabase Backend**:
   * Enter your **Project URL** (e.g. `https://xyz.supabase.co`)
   * Enter your **Anon Public Key**
   * Tap **Test & Connect Supabase**.

