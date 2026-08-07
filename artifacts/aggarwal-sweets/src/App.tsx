import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Link, useLocation, useParams } from 'wouter';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight,
  ChevronRight as ChevronRightSmall, Clock3, Gift, Heart, Instagram, Menu, Minus,
  PackageCheck, Phone, Plus, Search, ShoppingBag, Sparkles, Star, Store, Truck,
  UserRound, X, ShieldCheck, SlidersHorizontal, LayoutDashboard, Mail, MapPin,
  Trash2, Wheat, CircleAlert, LogIn, KeyRound, BookOpen, Send
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'All' | 'Mithai' | 'Namkeen' | 'Snacks' | 'Gifting';
type ProductVariant = { material: string; weight: string; price: number };
type Product = {
  id: string; name: string; category: Exclude<Category, 'All'>; price: number; unit: string;
  rating: number; reviews: number; description: string; image: string; badge?: string;
  variants: ProductVariant[];
};
type CartLine = { product: Product; variant: ProductVariant; quantity: number };
type AuthUser = { email: string };

// ─── Nav structure ────────────────────────────────────────────────────────────
type NavSubItem = { label: string; category: Exclude<Category, 'All'> };
type NavCategory = { label: string; subs: NavSubItem[] };

const navCategories: NavCategory[] = [
  {
    label: 'Mithai',
    subs: [
      { label: 'Kaju Sweets', category: 'Mithai' },
      { label: 'Ghee Sweets', category: 'Mithai' },
      { label: 'Milk Sweets', category: 'Mithai' },
      { label: 'Ladoo & Laddus', category: 'Mithai' },
      { label: 'Barfi & Halwa', category: 'Mithai' },
      { label: 'Festive Specials', category: 'Mithai' },
    ],
  },
  {
    label: 'Namkeen',
    subs: [
      { label: 'Bhujia & Sev', category: 'Namkeen' },
      { label: 'Roasted Nuts', category: 'Namkeen' },
      { label: 'Mathri & Crackers', category: 'Namkeen' },
    ],
  },
  {
    label: 'Snacks',
    subs: [
      { label: 'Tea-time Snacks', category: 'Snacks' },
      { label: 'Spiced Snacks', category: 'Snacks' },
    ],
  },
  {
    label: 'Gifting',
    subs: [
      { label: 'Festival Boxes', category: 'Gifting' },
      { label: 'Corporate Gifts', category: 'Gifting' },
      { label: 'Personal Gifts', category: 'Gifting' },
    ],
  },
];

// ─── Data ─────────────────────────────────────────────────────────────────────
const products: Product[] = [
  {
    id: 'kaju-katli', name: 'Kaju Katli', category: 'Mithai', price: 340, unit: '250 gm',
    rating: 4.9, reviews: 126, badge: 'Best seller', image: '/hero-mithai.jpg',
    description: 'Silky cashew fudge finished with a whisper of silver leaf. Made in small batches for the perfect melt.',
    variants: [
      { material: 'Pure desi ghee', weight: '250 gm', price: 340 },
      { material: 'Pure desi ghee', weight: '500 gm', price: 680 },
      { material: 'Pure desi ghee', weight: '1 kg', price: 1320 },
    ],
  },
  {
    id: 'motichoor-ladoo', name: 'Motichoor Ladoo', category: 'Mithai', price: 220, unit: '250 gm',
    rating: 4.8, reviews: 89, badge: 'Festive favourite', image: '/ladoo-plate.jpg',
    description: 'Tiny saffron-hued boondi pearls, slow-cooked and hand-rolled with melon seeds.',
    variants: [
      { material: 'Desi ghee', weight: '250 gm', price: 220 },
      { material: 'Desi ghee', weight: '500 gm', price: 420 },
      { material: 'Desi ghee', weight: '1 kg', price: 800 },
    ],
  },
  {
    id: 'pista-barfi', name: 'Pista Barfi', category: 'Mithai', price: 280, unit: '250 gm',
    rating: 4.7, reviews: 54, image: '/hero-mithai.jpg',
    description: 'Pistachio, khoya and cardamom layered into a delicate, nutty barfi.',
    variants: [
      { material: 'Pure desi ghee', weight: '250 gm', price: 280 },
      { material: 'Pure desi ghee', weight: '500 gm', price: 560 },
      { material: 'Pure desi ghee', weight: '1 kg', price: 1080 },
    ],
  },
  {
    id: 'desi-ghee-jalebi', name: 'Desi Ghee Jalebi', category: 'Mithai', price: 150, unit: '250 gm',
    rating: 4.9, reviews: 72, badge: 'Made today', image: '/ladoo-plate.jpg',
    description: 'Crisp spirals soaked in warm saffron syrup. Best enjoyed the same day.',
    variants: [
      { material: 'Desi ghee', weight: '250 gm', price: 150 },
      { material: 'Desi ghee', weight: '500 gm', price: 290 },
    ],
  },
  {
    id: 'aloo-bhujia', name: 'Aloo Bhujia', category: 'Namkeen', price: 95, unit: '200 gm',
    rating: 4.8, reviews: 108, badge: 'Tea-time hero', image: '/namkeen-bowl.jpg',
    description: 'Crunchy potato sev with a bright, savoury masala blend — impossible to stop at one handful.',
    variants: [
      { material: 'Groundnut oil', weight: '200 gm', price: 95 },
      { material: 'Groundnut oil', weight: '400 gm', price: 180 },
      { material: 'Groundnut oil', weight: '800 gm', price: 340 },
    ],
  },
  {
    id: 'masala-kaju', name: 'Masala Kaju', category: 'Namkeen', price: 190, unit: '150 gm',
    rating: 4.7, reviews: 43, image: '/namkeen-bowl.jpg',
    description: 'Roasted cashews tossed in our house chilli, pepper and amchur seasoning.',
    variants: [
      { material: 'Roasted & spiced', weight: '150 gm', price: 190 },
      { material: 'Roasted & spiced', weight: '250 gm', price: 360 },
      { material: 'Roasted & spiced', weight: '500 gm', price: 700 },
    ],
  },
  {
    id: 'mathri', name: 'Ajwain Mathri', category: 'Snacks', price: 120, unit: '250 gm',
    rating: 4.6, reviews: 38, image: '/namkeen-bowl.jpg',
    description: 'Flaky, savoury and gently spiced with ajwain. A Sirsa afternoon ritual.',
    variants: [
      { material: 'Traditional', weight: '250 gm', price: 120 },
      { material: 'Traditional', weight: '500 gm', price: 220 },
      { material: 'Traditional', weight: '1 kg', price: 420 },
    ],
  },
  {
    id: 'shagun-box', name: 'Shagun Box · Golden Edit', category: 'Gifting', price: 690, unit: '750 gm',
    rating: 4.9, reviews: 31, badge: 'Gift ready', image: '/hero-mithai.jpg',
    description: 'A celebration-ready assortment of kaju katli, ladoo, pista barfi and premium namkeen.',
    variants: [
      { material: 'Classic assortment', weight: '750 gm', price: 690 },
      { material: 'Classic assortment', weight: '1.25 kg', price: 1290 },
      { material: 'Classic assortment', weight: '2 kg', price: 1980 },
    ],
  },
];

const categories: { label: Exclude<Category, 'All'>; note: string; icon: typeof Gift; image: string }[] = [
  { label: 'Mithai', note: 'Soft, fragrant, handmade', icon: Sparkles, image: '/hero-mithai.jpg' },
  { label: 'Namkeen', note: 'Crunch for every chai', icon: Wheat, image: '/namkeen-bowl.jpg' },
  { label: 'Snacks', note: 'Old recipes, new cravings', icon: Star, image: '/ladoo-plate.jpg' },
  { label: 'Gifting', note: 'Send a little celebration', icon: Gift, image: '/hero-mithai.jpg' },
];

// ─── Blog posts (static) ──────────────────────────────────────────────────────
const blogPosts = [
  {
    id: 'history-of-kaju-katli', slug: 'history-of-kaju-katli',
    title: "The Silver Story: How Kaju Katli Became India's Favourite Mithai",
    excerpt: "From royal kitchens to neighbourhood sweet shops — tracing the journey of the most gifted sweet in India.",
    date: 'July 2025', readTime: '4 min', category: 'Heritage',
    image: '/hero-mithai.jpg',
  },
  {
    id: 'ghee-vs-oil', slug: 'ghee-vs-oil',
    title: 'Desi Ghee vs Oil in Sweets: What Actually Changes the Flavour?',
    excerpt: "Our head mithai maker breaks down why ghee isn't just a tradition — it's the reason the barfi melts just right.",
    date: 'June 2025', readTime: '3 min', category: 'Craft',
    image: '/ladoo-plate.jpg',
  },
  {
    id: 'festive-gifting-guide', slug: 'festive-gifting-guide',
    title: '2025 Festive Gifting Guide: What to Send, How Much, and When',
    excerpt: 'A practical guide from the Aggarwal family — how to pick a box that says exactly the right thing.',
    date: 'May 2025', readTime: '5 min', category: 'Guide',
    image: '/hero-mithai.jpg',
  },
  {
    id: 'tea-time-namkeen', slug: 'tea-time-namkeen',
    title: 'Five Namkeens That Belong Next to Your Evening Chai',
    excerpt: 'From bhujia to mathri, we rank the snacks that have earned a permanent spot on the tea tray.',
    date: 'April 2025', readTime: '3 min', category: 'Food',
    image: '/namkeen-bowl.jpg',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const defaultVariant = (product: Product): ProductVariant =>
  product.variants[0] ?? { material: 'Standard', weight: product.unit, price: product.price };
const variantLabel = (variant: ProductVariant) => `${variant.material} · ${variant.weight}`;
const lowestPrice = (product: Product) =>
  Math.min(...product.variants.map(v => v.price), product.price);

function readCatalog(): Product[] {
  try {
    const saved = JSON.parse(localStorage.getItem('aggarwal-catalog') || 'null');
    return Array.isArray(saved) && saved.length ? saved : products;
  } catch { return products; }
}

function readUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem('aggarwal-user') || 'null'); } catch { return null; }
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
type AuthStep = 'email' | 'otp' | 'done';

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (user: AuthUser) => void }) {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      // In a real app, send OTP via API. For demo: alert shows it.
      console.info(`[demo] OTP for ${email}: ${sentOtp}`);
    }, 1200);
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === sentOtp || otp === '123456') {
      const user: AuthUser = { email };
      localStorage.setItem('aggarwal-user', JSON.stringify(user));
      onLogin(user);
      setStep('done');
      setTimeout(onClose, 1500);
    } else {
      setOtpError('Incorrect OTP. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-primary/50 p-5 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-full bg-primary text-accent"><Sparkles className="size-4" /></div>
            <span className="font-display text-lg">Sign in</span>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        {step === 'done' ? (
          <div className="flex flex-col items-center gap-4 px-8 py-10 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
              <Check className="size-7" />
            </div>
            <p className="font-display text-2xl">Welcome back!</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        ) : step === 'email' ? (
          <form onSubmit={sendOtp} className="space-y-5 px-6 py-6">
            <div>
              <p className="font-display text-2xl">Hello there 👋</p>
              <p className="mt-1 text-sm text-muted-foreground">Enter your email to get a one-time code.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" htmlFor="auth-email">
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <input
                  id="auth-email" type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  data-testid="input-auth-email"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-sm font-bold text-secondary-foreground disabled:opacity-60"
              data-testid="button-send-otp"
            >
              {loading ? 'Sending…' : <><Send className="size-4" /> Send OTP</>}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              By continuing you agree to our Terms of Service.
            </p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-5 px-6 py-6">
            <div>
              <p className="font-display text-2xl">Check your inbox</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent a 6-digit code to <b>{email}</b>.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">(Demo: use <b>123456</b>)</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider" htmlFor="auth-otp">
                One-time code
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-ring">
                <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                <input
                  id="auth-otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                  required value={otp} onChange={e => { setOtp(e.target.value); setOtpError(''); }}
                  placeholder="123456"
                  className="min-w-0 flex-1 bg-transparent text-sm font-mono outline-none tracking-widest"
                  data-testid="input-auth-otp"
                />
              </div>
              {otpError && <p className="mt-1.5 text-xs text-destructive">{otpError}</p>}
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-sm font-bold text-secondary-foreground"
              data-testid="button-verify-otp"
            >
              <Check className="size-4" /> Verify & Sign in
            </button>
            <button
              type="button" onClick={() => { setStep('email'); setOtp(''); setOtpError(''); }}
              className="w-full text-center text-xs text-muted-foreground underline underline-offset-2"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Dropdown Nav ─────────────────────────────────────────────────────────────
function ShopDropdown({ onNavigate }: { onNavigate: (cat: Exclude<Category, 'All'>) => void }) {
  const [hoveredCat, setHoveredCat] = useState<NavCategory>(navCategories[0]);

  return (
    <div className="absolute left-0 top-full z-50 mt-1 flex overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      style={{ minWidth: 560 }}>
      {/* Left: category list */}
      <div className="w-52 border-r border-border bg-muted/40 py-3">
        {navCategories.map(cat => (
          <button
            key={cat.label}
            onMouseEnter={() => setHoveredCat(cat)}
            onClick={() => onNavigate(cat.subs[0].category)}
            className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold transition-colors ${hoveredCat.label === cat.label ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            data-testid={`nav-category-${cat.label.toLowerCase()}`}
          >
            {cat.label}
            <ChevronRightSmall className="size-4 opacity-60" />
          </button>
        ))}
      </div>
      {/* Right: subcategories */}
      <div className="flex-1 py-3">
        <p className="px-5 py-2 font-mono-ui text-[9px] uppercase tracking-widest text-muted-foreground">
          {hoveredCat.label}
        </p>
        {hoveredCat.subs.map(sub => (
          <button
            key={sub.label}
            onClick={() => onNavigate(sub.category)}
            className="flex w-full items-center px-5 py-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            data-testid={`nav-sub-${sub.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {sub.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Header ─────────────────────────────────────────────────────────────
function Header({
  itemCount, onCartOpen, user, onAuthOpen, onLogout, menuOpen, setMenuOpen,
}: {
  itemCount: number;
  onCartOpen: () => void;
  user: AuthUser | null;
  onAuthOpen: () => void;
  onLogout: () => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const shopRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavCategory = (cat: Exclude<Category, 'All'>) => {
    setShopOpen(false);
    setMenuOpen(false);
    navigate(`/shop/${cat.toLowerCase()}`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4 sm:px-8">
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" data-testid="button-open-menu">
          <Menu className="size-5" />
        </button>

        <Link href="/" className="group shrink-0" data-testid="link-home">
          <div className="flex items-center gap-2.5">
            <div className="relative grid size-10 place-items-center rounded-full border-2 border-accent bg-primary text-accent shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="font-display text-xl font-bold leading-none tracking-tight">Aggarwal</div>
              <div className="font-mono-ui mt-1 text-[9px] uppercase tracking-[.3em] text-secondary">Sweets · Sirsa</div>
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex" aria-label="Main navigation">
          {/* Shop All dropdown */}
          <div className="relative" ref={shopRef}>
            <button
              onMouseEnter={() => setShopOpen(true)}
              onClick={() => setShopOpen(v => !v)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 transition-colors hover:bg-muted"
              data-testid="nav-shop-all"
            >
              Shop All <ChevronDown className={`size-3.5 transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
            </button>
            {shopOpen && (
              <div onMouseLeave={() => setShopOpen(false)}>
                <ShopDropdown onNavigate={handleNavCategory} />
              </div>
            )}
          </div>

          <Link href="/shop/gifting" className="rounded-lg px-4 py-2.5 transition-colors hover:bg-muted" data-testid="nav-gifting" onClick={() => setShopOpen(false)}>
            Gifting
          </Link>
          <Link href="/blog" className="rounded-lg px-4 py-2.5 transition-colors hover:bg-muted" data-testid="nav-blog" onClick={() => setShopOpen(false)}>
            Blog
          </Link>
          <a href="/#story" className="rounded-lg px-4 py-2.5 transition-colors hover:bg-muted" data-testid="nav-story" onClick={() => setShopOpen(false)}>
            Our Story
          </a>
          <a href="/#visit" className="rounded-lg px-4 py-2.5 transition-colors hover:bg-muted" data-testid="nav-contact" onClick={() => setShopOpen(false)}>
            Contact
          </a>
        </nav>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="absolute left-0 top-full z-40 w-full border-b bg-background shadow-lg">
            <div className="mx-auto max-w-7xl px-5 py-4">
              <button
                className="flex w-full items-center justify-between py-2.5 text-sm font-semibold"
                onClick={() => setMobileShopOpen(v => !v)}
              >
                Shop All <ChevronDown className={`size-4 transition-transform ${mobileShopOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileShopOpen && (
                <div className="ml-3 border-l border-border pl-4">
                  {navCategories.map(cat => (
                    <div key={cat.label} className="mb-2">
                      <p className="py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat.label}</p>
                      {cat.subs.map(sub => (
                        <button
                          key={sub.label}
                          onClick={() => { handleNavCategory(sub.category); setMobileShopOpen(false); }}
                          className="block w-full py-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              <Link href="/shop/gifting" className="block py-2.5 text-sm font-semibold" onClick={() => setMenuOpen(false)}>Gifting</Link>
              <Link href="/blog" className="block py-2.5 text-sm font-semibold" onClick={() => setMenuOpen(false)}>Blog</Link>
              <a href="/#story" className="block py-2.5 text-sm font-semibold" onClick={() => setMenuOpen(false)}>Our Story</a>
              <a href="/#visit" className="block py-2.5 text-sm font-semibold" onClick={() => setMenuOpen(false)}>Contact</a>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Link href="/shop" className="hidden size-10 place-items-center rounded-full hover:bg-muted sm:grid" aria-label="Search products" data-testid="button-search">
            <Search className="size-[18px]" />
          </Link>
          {user ? (
            <div className="relative group">
              <button
                className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted sm:flex"
                data-testid="button-user-menu"
              >
                <UserRound className="size-4" />
                <span className="max-w-[80px] truncate">{user.email.split('@')[0]}</span>
              </button>
              <div className="absolute right-0 top-full z-50 mt-1 hidden w-44 rounded-2xl border border-border bg-background p-2 shadow-xl group-focus-within:block group-hover:block">
                <p className="truncate px-3 py-2 text-xs text-muted-foreground">{user.email}</p>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-muted"
                  data-testid="button-logout"
                >
                  <LogIn className="size-4" /> Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onAuthOpen}
              className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-bold transition-colors hover:bg-muted sm:flex"
              data-testid="button-sign-in"
            >
              <UserRound className="size-4" /> Sign in
            </button>
          )}
          <button
            className="relative grid size-10 place-items-center rounded-full hover:bg-muted"
            onClick={onCartOpen}
            aria-label={`Open cart, ${itemCount} items`}
            data-testid="button-open-cart"
          >
            <ShoppingBag className="size-[19px]" />
            {itemCount > 0 && (
              <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-secondary text-[9px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Marquees ─────────────────────────────────────────────────────────────────
function PromoMarquee() {
  return (
    <div className="promo-marquee border-b border-primary-foreground/10 bg-primary text-primary-foreground" aria-label="Store promotions">
      <div className="marquee-window">
        <div className="marquee-track promo-track">
          {[0, 1].map(copy => (
            <div className="flex items-center" key={copy} aria-hidden={copy === 1}>
              <span>Fresh batches packed daily in Sirsa</span><i />
              <span>Free local delivery over ₹799</span><i />
              <span>COD available across Sirsa</span><i />
              <span>Order before 4 PM for next-day delivery</span><i />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenefitMarquee() {
  return (
    <div className="benefit-marquee border-b border-primary-foreground/10 bg-secondary text-secondary-foreground" aria-label="Aggarwal Sweets service promises">
      <div className="marquee-window">
        <div className="marquee-track benefit-track">
          {[0, 1].map(copy => (
            <div className="flex items-center" key={copy} aria-hidden={copy === 1}>
              <span><PackageCheck /> Freshly prepared</span><i />
              <span><ShieldCheck /> Lab-tested ingredients</span><i />
              <span><Truck /> On-time local delivery</span><i />
              <span><BadgeCheck /> Easy returns on unopened boxes</span><i />
              <span><Heart /> Made with care in Sirsa</span><i />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
const heroSlides = [
  {
    id: 'mithai', eyebrow: 'Fresh from the counter · Since 1978',
    heading: 'A little', highlight: 'mithaas', ending: 'goes a long way.',
    description: 'Family recipes, fresh batches, and boxes made to be opened with a smile. Bringing Sirsa\'s favourite sweets to your doorstep.',
    image: '/hero-mithai.jpg', badge: ['Small', 'batch', 'joy'],
    cta: 'Shop the mithai', secondary: 'Find a gift',
  },
  {
    id: 'ladoo', eyebrow: 'Festive favourite · Made today',
    heading: 'Bring home', highlight: 'the celebration.', ending: '',
    description: 'Golden motichoor ladoos, made in small batches and rolled while they are still warm. The sweetest way to mark a special day.',
    image: '/ladoo-plate.jpg', badge: ['Made', 'fresh', 'today'],
    cta: 'See bestsellers', secondary: 'Gift a box',
  },
  {
    id: 'namkeen', eyebrow: 'For chai-time cravings · Sirsa',
    heading: 'Crunchy little', highlight: 'reasons to stay.', ending: '',
    description: 'From aloo bhujia to ajwain mathri, our savoury counter is full of old recipes, bright spices, and one-more-handful energy.',
    image: '/namkeen-bowl.jpg', badge: ['Tea-time', 'hero'],
    cta: 'Shop namkeen', secondary: 'Our story',
  },
] as const;

function Hero({ onShop }: { onShop: () => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = heroSlides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide(c => (c + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const moveSlide = (dir: number) =>
    setActiveSlide(c => (c + dir + heroSlides.length) % heroSlides.length);

  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute -right-36 -top-36 size-[460px] rounded-full border border-accent/20" />
      <div className="absolute -right-20 -top-20 size-[300px] rounded-full border border-accent/20" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
        <div className="relative z-10 animate-reveal" key={slide.id}>
          <div className="mb-5 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.28em] text-accent">
            <span className="h-px w-8 bg-accent" /> {slide.eyebrow}
          </div>
          <h1 className="max-w-xl font-display text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl">
            {slide.heading} <em className="font-normal text-accent">{slide.highlight}</em>
            {slide.ending && <><br />{slide.ending}</>}
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-primary-foreground/75">{slide.description}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onShop} className="group inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5" data-testid="button-shop-hero">
              {slide.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a href="/#gifting" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10">
              {slide.secondary} <Gift className="size-4 text-accent" />
            </a>
          </div>
          <div className="mt-12 flex items-center gap-7 text-xs text-primary-foreground/60">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> Hygienically packed</span>
            <span className="flex items-center gap-2"><Truck className="size-4 text-accent" /> Local delivery</span>
          </div>
        </div>
        <div className="relative min-h-[320px] animate-reveal sm:min-h-[470px]" key={`${slide.id}-img`}>
          <div className="absolute inset-5 rotate-3 rounded-[3rem] bg-accent/20 sm:inset-10" />
          <div className="absolute inset-2 -rotate-2 overflow-hidden rounded-[3rem] border border-accent/30 shadow-2xl sm:inset-5">
            <img src={slide.image} alt="Aggarwal Sweets festive selection" className="h-full w-full object-cover transition-opacity duration-500" />
          </div>
          <div className="animate-drift absolute -bottom-1 left-0 rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-xl sm:bottom-6 sm:left-4">
            <div className="flex items-center gap-1 text-accent">
              {[0,1,2,3,4].map(i => <Star key={i} className="size-3.5 fill-current" />)}
            </div>
            <div className="mt-1 font-mono-ui text-[10px] uppercase tracking-wider">Loved across Sirsa</div>
          </div>
          <div className="absolute right-0 top-5 grid size-20 place-items-center rounded-full border border-accent bg-secondary text-center text-[10px] font-bold uppercase leading-tight text-secondary-foreground shadow-lg sm:right-8 sm:top-10">
            {slide.badge.map(line => <span key={line}>{line}</span>)}
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 pb-8 sm:px-8 sm:pb-10">
        <div className="flex items-center gap-2" aria-label="Slide indicator">
          {heroSlides.map((item, i) => (
            <button key={item.id} onClick={() => setActiveSlide(i)}
              className={`hero-dot ${activeSlide === i ? 'is-active' : ''}`}
              aria-label={`Slide ${i + 1}`} data-testid={`button-hero-slide-${i + 1}`} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-2 font-mono-ui text-[10px] tracking-[.2em] text-primary-foreground/60">
            {String(activeSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
          </span>
          <button onClick={() => moveSlide(-1)} className="grid size-9 place-items-center rounded-full border border-primary-foreground/25 transition-colors hover:border-accent hover:text-accent" aria-label="Previous slide" data-testid="button-hero-previous">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => moveSlide(1)} className="grid size-9 place-items-center rounded-full border border-primary-foreground/25 transition-colors hover:border-accent hover:text-accent" aria-label="Next slide" data-testid="button-hero-next">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-2 w-full bg-accent" />
    </section>
  );
}

function TrustStrip() {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
        <div className="flex items-center gap-3 border-border sm:border-r">
          <PackageCheck className="size-5 text-secondary" />
          <div><p className="text-sm font-bold">Freshness, always</p><p className="text-xs text-muted-foreground">Made in small batches</p></div>
        </div>
        <div className="flex items-center gap-3 border-border sm:border-r sm:pl-5">
          <Banknote className="size-5 text-secondary" />
          <div><p className="text-sm font-bold">Pay your way</p><p className="text-xs text-muted-foreground">Secure COD at your doorstep</p></div>
        </div>
        <div className="flex items-center gap-3 sm:pl-5">
          <Phone className="size-5 text-secondary" />
          <div><p className="text-sm font-bold">Real people, real help</p><p className="text-xs text-muted-foreground">Call us on 01666 234 786</p></div>
        </div>
      </div>
    </div>
  );
}

// ─── Category Rail ────────────────────────────────────────────────────────────
function CategoryRail() {
  const [, navigate] = useLocation();
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">Something for every mood</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Browse by craving</h2>
        </div>
        <Link href="/shop" className="hidden items-center gap-2 text-sm font-bold text-secondary sm:flex" data-testid="link-browse-all">
          Browse all <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map(({ label, note, icon: Icon, image }, i) => (
          <button
            key={label}
            onClick={() => navigate(`/shop/${label.toLowerCase()}`)}
            className={`group relative min-h-[180px] overflow-hidden rounded-2xl border border-border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${i % 2 ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}
            data-testid={`button-category-${label.toLowerCase()}`}
          >
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/35 to-transparent" />
            <div className="relative z-10">
              <Icon className="mb-7 size-6 text-accent" />
              <p className="font-display text-2xl">{label}</p>
              <p className="mt-1 text-xs opacity-80">{note}</p>
            </div>
            <ArrowRight className="absolute bottom-5 right-5 z-10 size-4 opacity-80 transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </div>
      <div className="mt-6 sm:hidden">
        <Link href="/shop" className="flex items-center justify-center gap-2 rounded-full border border-border py-3 text-sm font-bold">
          Browse all products <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── Product Card (with weight chip selector) ─────────────────────────────────
function ProductCard({
  product, wished, onWishlist, onDetail, onAdd,
}: {
  product: Product; wished: boolean;
  onWishlist: (id: string) => void;
  onDetail: (p: Product) => void;
  onAdd: (p: Product, variant?: ProductVariant) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(defaultVariant(product));

  // Unique weights for this product
  const weights = Array.from(new Set(product.variants.map(v => v.weight)));

  const handleWeightClick = (e: React.MouseEvent, w: string) => {
    e.stopPropagation();
    const found = product.variants.find(v => v.weight === w);
    if (found) setSelectedVariant(found);
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:shadow-xl" data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-square cursor-pointer overflow-hidden bg-muted" onClick={() => onDetail(product)}>
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-accent-foreground">
            {product.badge}
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onWishlist(product.id); }}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/85 backdrop-blur transition-transform hover:scale-110"
          aria-label={`${wished ? 'Remove' : 'Add'} ${product.name} ${wished ? 'from' : 'to'} wishlist`}
          data-testid={`button-wishlist-${product.id}`}
        >
          <Heart className={`size-4 ${wished ? 'fill-secondary text-secondary' : ''}`} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-lg font-semibold leading-tight">{product.name}</p>
            <p className="mt-1 text-xs text-muted-foreground"><span className="text-accent-foreground">★ {product.rating}</span> · {product.reviews} reviews</p>
          </div>
          <p className="font-mono-ui text-sm font-bold whitespace-nowrap">{money(selectedVariant.price)}</p>
        </div>

        {/* Weight selector chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {weights.map(w => (
            <button
              key={w}
              onClick={e => handleWeightClick(e, w)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${selectedVariant.weight === w ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground hover:border-primary/40'}`}
              data-testid={`chip-weight-${product.id}-${w.replace(/\s/g, '-')}`}
            >
              {w}
            </button>
          ))}
        </div>

        <button
          onClick={() => onAdd(product, selectedVariant)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary/25 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          data-testid={`button-add-${product.id}`}
        >
          <Plus className="size-3.5" /> Add to box
        </button>
      </div>
    </article>
  );
}

// ─── Shop Section (used on home) ──────────────────────────────────────────────
function ShopSection({
  products: items, wishlist, onWishlist, onDetail, onAdd,
}: {
  products: Product[]; wishlist: string[];
  onWishlist: (id: string) => void;
  onDetail: (p: Product) => void;
  onAdd: (p: Product, variant?: ProductVariant) => void;
}) {
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [, navigate] = useLocation();

  const filtered = useMemo(() =>
    items
      .filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => sort === 'low' ? lowestPrice(a) - lowestPrice(b) : sort === 'high' ? lowestPrice(b) - lowestPrice(a) : 0),
    [items, category, query, sort]
  );

  return (
    <section id="shop" className="scroll-mt-20 border-y border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">The counter is open</p>
            <h2 className="mt-2 font-display text-4xl font-semibold">Made for sharing.</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">The things our regulars take home every week — and every time guests arrive unexpectedly.</p>
          </div>
          <div className="flex w-full items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-3 lg:max-w-xs">
              <Search className="size-4 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search kaju, ladoo..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search-products" />
            </div>
            <button onClick={() => navigate('/shop')} className="hidden items-center gap-2 rounded-full bg-primary px-4 py-3 text-xs font-bold text-primary-foreground sm:flex" data-testid="button-browse-all">
              Browse all <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex gap-1 overflow-auto">
            {(['All', 'Mithai', 'Namkeen', 'Snacks', 'Gifting'] as Category[]).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                data-testid={`button-filter-${cat.toLowerCase()}`}>{cat}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <SlidersHorizontal className="size-4" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent py-2 outline-none" aria-label="Sort products" data-testid="select-sort-products">
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
        {filtered.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)}
                onWishlist={onWishlist} onDetail={onDetail} onAdd={onAdd} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-20 text-center">
            <CircleAlert className="mx-auto size-8 text-secondary" />
            <h3 className="mt-4 font-display text-2xl">Nothing on this tray</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try another sweet name or clear your filters.</p>
            <button onClick={() => { setQuery(''); setCategory('All'); }} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-clear-filters">Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Full Shop Page ───────────────────────────────────────────────────────────
function ShopPage({
  catalog, wishlist, onWishlist, onDetail, onAdd,
}: {
  catalog: Product[]; wishlist: string[];
  onWishlist: (id: string) => void;
  onDetail: (p: Product) => void;
  onAdd: (p: Product, variant?: ProductVariant) => void;
}) {
  const params = useParams<{ category?: string }>();
  const rawCat = params.category;
  const initialCategory: Category = rawCat
    ? ((rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category)
    : 'All';

  const [category, setCategory] = useState<Category>(initialCategory);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  // Sync when URL param changes
  useEffect(() => {
    const cat = rawCat
      ? ((rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category)
      : 'All';
    setCategory(cat);
  }, [rawCat]);

  const filtered = useMemo(() =>
    catalog
      .filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => sort === 'low' ? lowestPrice(a) - lowestPrice(b) : sort === 'high' ? lowestPrice(b) - lowestPrice(a) : 0),
    [catalog, category, query, sort]
  );

  return (
    <div className="min-h-screen">
      {/* Category hero banner */}
      <div className="border-b border-border bg-primary px-5 py-10 text-primary-foreground sm:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">Aggarwal Sweets</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
            {category === 'All' ? 'All Products' : category}
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/70">
            {category === 'All'
              ? 'Browse our full counter — sweets, namkeen, snacks, and gift boxes.'
              : categories.find(c => c.label === category)?.note ?? ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {(['All', 'Mithai', 'Namkeen', 'Snacks', 'Gifting'] as Category[]).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted border border-border'}`}
                data-testid={`shoppage-filter-${cat.toLowerCase()}`}>{cat}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5">
              <Search className="size-4 text-muted-foreground" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-40 bg-transparent text-sm outline-none" data-testid="input-shoppage-search" />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground whitespace-nowrap">
              <SlidersHorizontal className="size-4" />
              <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent py-2 outline-none" aria-label="Sort" data-testid="shoppage-sort">
                <option value="featured">Featured</option>
                <option value="low">Price ↑</option>
                <option value="high">Price ↓</option>
              </select>
            </label>
          </div>
        </div>

        {/* Results count */}
        <p className="mt-5 text-xs text-muted-foreground">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>

        {filtered.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)}
                onWishlist={onWishlist} onDetail={onDetail} onAdd={onAdd} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-20 text-center">
            <CircleAlert className="mx-auto size-8 text-secondary" />
            <h3 className="mt-4 font-display text-2xl">Nothing on this tray</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try another name or clear your filters.</p>
            <button onClick={() => { setQuery(''); setCategory('All'); }} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-shoppage-clear">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Blog Page ────────────────────────────────────────────────────────────────
function BlogPage() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-primary px-5 py-10 text-primary-foreground sm:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">Aggarwal Sweets</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Stories & Recipes</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-primary-foreground/70">
            Heritage, craft, and the art of making sweets that carry meaning.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {blogPosts.map((post, i) => (
            <article key={post.id} className={`group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:shadow-xl ${i === 0 ? 'sm:col-span-2' : ''}`}>
              <div className={`relative overflow-hidden bg-muted ${i === 0 ? 'aspect-[2.5] sm:aspect-[3]' : 'aspect-[1.6]'}`}>
                <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                  {post.category}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><BookOpen className="size-3" /> {post.readTime} read</span>
                </div>
                <h2 className="mt-2 font-display text-xl font-semibold leading-snug">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.excerpt}</p>
                <button className="mt-4 flex items-center gap-1.5 text-xs font-bold text-secondary">
                  Read more <ArrowRight className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Gifting Section ──────────────────────────────────────────────────────────
function GiftingSection({ products: items, addToCart }: { products: Product[]; addToCart: (p: Product) => void }) {
  return (
    <section id="gifting" className="scroll-mt-20 bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">For the big little moments</p>
          <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight sm:text-5xl">Don't just send a gift.<br /><em className="font-normal text-accent">Send a feeling.</em></h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-secondary-foreground/75">From a first visit to a fiftieth anniversary, our boxes carry the warmth of your home — even when home is a few cities away.</p>
          <button onClick={() => { const shagun = items.find(p => p.id === 'shagun-box'); if (shagun) addToCart(shagun); }} className="mt-7 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground" data-testid="button-add-shagun">
            <Gift className="size-4" /> Add Shagun Box <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="relative aspect-[1.45] overflow-hidden rounded-[2rem] border border-accent/30">
          <img src="/hero-mithai.jpg" alt="Festive gift box" className="h-full w-full object-cover" />
          <div className="absolute bottom-4 left-4 rounded-xl bg-primary/90 px-4 py-3 text-primary-foreground backdrop-blur">
            <p className="font-display text-lg">The Golden Edit</p>
            <p className="mt-1 font-mono-ui text-[10px] uppercase tracking-wider text-accent">Wrapped with a note</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <section id="story" className="scroll-mt-20 mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <div className="relative mx-auto max-w-sm">
        <div className="absolute -inset-4 rounded-[2rem] border border-secondary/30" />
        <img src="/ladoo-plate.jpg" alt="Traditional sweets being prepared" className="relative aspect-[.85] w-full rounded-[2rem] object-cover" />
        <div className="absolute -bottom-5 -right-4 grid size-24 place-items-center rounded-full bg-accent text-center font-display text-lg leading-tight text-accent-foreground shadow-lg">
          45+<small className="block font-sans text-[9px] font-bold uppercase tracking-wide">years of<br />sweetness</small>
        </div>
      </div>
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">The Aggarwal way</p>
        <h2 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">Some recipes are measured in grams. Ours are measured in memories.</h2>
        <p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground">What started as a small counter in the heart of Sirsa in 1978 still begins the same way: good ingredients, patient hands, and a family member tasting the first batch.</p>
        <div className="mt-8 grid max-w-lg grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3">
          <div><p className="font-display text-2xl">1978</p><p className="mt-1 text-[11px] text-muted-foreground">Our first batch</p></div>
          <div><p className="font-display text-2xl">18</p><p className="mt-1 text-[11px] text-muted-foreground">Recipes we guard</p></div>
          <div><p className="font-display text-2xl">4.9<span className="text-base">/5</span></p><p className="mt-1 text-[11px] text-muted-foreground">Happy households</p></div>
        </div>
      </div>
    </section>
  );
}

function Newsletter({ value, setValue, done, onSubmit }: { value: string; setValue: (v: string) => void; done: boolean; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="border-y border-border bg-muted/60">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">A sweet note from us</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Festival dates. Fresh batches. No noise.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Join 1,200+ sweet tooths in the know.</p>
        </div>
        {done ? (
          <div className="flex items-center gap-3 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="status-newsletter-success">
            <Check className="size-4 text-accent" /> You're on the list. See you soon.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex w-full max-w-md rounded-full border border-border bg-background p-1.5" data-testid="form-newsletter">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" required value={value} onChange={e => setValue(e.target.value)} placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" data-testid="input-newsletter-email" />
            <button className="shrink-0 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-secondary-foreground" data-testid="button-newsletter-submit">Keep me posted</button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="visit" className="scroll-mt-20 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-full border-2 border-accent text-accent"><Sparkles className="size-4" /></div>
              <div className="font-display text-xl">Aggarwal</div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/60">Sweets that taste like the good news has just arrived.</p>
            <div className="mt-5 flex gap-3">
              <a href="https://instagram.com" className="grid size-8 place-items-center rounded-full border border-primary-foreground/20" aria-label="Instagram" data-testid="link-instagram"><Instagram className="size-4" /></a>
              <a href="mailto:hello@aggarwalsweets.in" className="grid size-8 place-items-center rounded-full border border-primary-foreground/20" aria-label="Email us" data-testid="link-email"><Mail className="size-4" /></a>
            </div>
          </div>
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Shop</p>
            <div className="mt-4 grid gap-3 text-sm text-primary-foreground/65">
              <Link href="/shop">All Products</Link>
              <Link href="/shop/mithai">Mithai</Link>
              <Link href="/shop/namkeen">Namkeen</Link>
              <Link href="/shop/gifting">Gifting</Link>
              <Link href="/blog">Blog</Link>
            </div>
          </div>
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Find us</p>
            <p className="mt-4 text-sm leading-6 text-primary-foreground/65">12, Hissar Road<br />Near Clock Tower, Sirsa<br />Haryana · 125055</p>
          </div>
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Come say hello</p>
            <p className="mt-4 text-sm leading-6 text-primary-foreground/65">Open daily · 9:00 AM – 9:30 PM<br />01666 234 786<br />orders@aggarwalsweets.in</p>
            <Link href="/admin" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-accent" data-testid="link-admin-footer">Owner portal <ArrowRight className="size-3" /></Link>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-primary-foreground/15 pt-5 text-[10px] uppercase tracking-widest text-primary-foreground/40 sm:flex-row">
          <span>© 2025 Aggarwal Sweets, Sirsa</span>
          <span>Made with mithaas</span>
        </div>
      </div>
    </footer>
  );
}

// ─── Product Drawer ───────────────────────────────────────────────────────────
function ProductDrawer({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (p: Product, v?: ProductVariant) => void }) {
  const [variant, setVariant] = useState<ProductVariant>(defaultVariant(product));
  const materials = Array.from(new Set(product.variants.map(v => v.material)));
  const weights = product.variants.filter(v => v.material === variant.material);
  const chooseMaterial = (m: string) => setVariant(product.variants.find(v => v.material === m) || defaultVariant(product));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col overflow-auto bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Product details</span>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Close product details" data-testid="button-close-product"><X className="size-5" /></button>
        </div>
        <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-3xl font-semibold">{product.name}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-accent-foreground">★ {product.rating}</span> · {product.reviews} reviews
              </div>
            </div>
            <p className="font-mono-ui text-xl font-bold">{money(variant.price)}</p>
          </div>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">{product.description}</p>
          <div className="mt-7 space-y-5">
            {materials.length > 1 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Choose material</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {materials.map(m => (
                    <button key={m} onClick={() => chooseMaterial(m)}
                      className={`rounded-full border px-4 py-2 text-xs font-bold ${variant.material === m ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
                      data-testid={`button-material-${m.replace(/\W/g, '-')}`}>{m}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Choose weight</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weights.map(item => (
                  <button key={`${item.material}-${item.weight}`} onClick={() => setVariant(item)}
                    className={`rounded-full border px-4 py-2 text-xs font-bold ${variant.weight === item.weight ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40'}`}
                    data-testid={`button-weight-${item.weight.replace(/\W/g, '-')}`}>
                    {item.weight} · {money(item.price)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-2xl bg-muted p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Clock3 className="size-4 text-secondary" /><span>Best enjoyed within 7 days · Packed fresh for you</span></div>
          </div>
          <button onClick={() => onAdd(product, variant)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-add-product-detail">
            <ShoppingBag className="size-4" /> Add to my box · {money(variant.price)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, subtotal, updateQty, onClose, onCheckout }: { cart: CartLine[]; subtotal: number; updateQty: (i: number, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-display text-2xl">Your sweet box</p>
            <p className="text-xs text-muted-foreground">{cart.reduce((s, l) => s + l.quantity, 0)} items · packed with care</p>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Close cart" data-testid="button-close-cart"><X className="size-5" /></button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-muted text-secondary"><ShoppingBag className="size-8" /></div>
            <h3 className="mt-5 font-display text-2xl">Your box is waiting</h3>
            <p className="mt-2 text-sm text-muted-foreground">Add something lovely from the counter.</p>
            <button onClick={onClose} className="mt-6 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground" data-testid="button-continue-shopping">Continue shopping</button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-auto p-5">
              {cart.map((line, i) => (
                <div key={`${line.product.id}-${line.variant.material}-${line.variant.weight}`} className="flex gap-3" data-testid={`row-cart-${line.product.id}`}>
                  <img src={line.product.image} alt="" className="size-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-display text-lg">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">{variantLabel(line.variant)}</p>
                      </div>
                      <p className="font-mono-ui text-xs font-bold whitespace-nowrap">{money(line.variant.price * line.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => updateQty(i, -1)} className="grid size-7 place-items-center" aria-label={`Decrease ${line.product.name}`} data-testid={`button-decrease-${line.product.id}`}><Minus className="size-3" /></button>
                        <span className="w-5 text-center text-xs font-bold">{line.quantity}</span>
                        <button onClick={() => updateQty(i, 1)} className="grid size-7 place-items-center" aria-label={`Increase ${line.product.name}`} data-testid={`button-increase-${line.product.id}`}><Plus className="size-3" /></button>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{money(line.variant.price)} each</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-card p-5">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono-ui font-bold">{money(subtotal)}</span></div>
              <p className="mt-2 text-xs text-muted-foreground">Delivery is free for orders over ₹799 in Sirsa.</p>
              <button onClick={onCheckout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-proceed-checkout">
                Proceed to checkout <ArrowRight className="size-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
function Checkout({ subtotal, onClose, onDone }: { subtotal: number; onClose: () => void; onDone: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-primary/50 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground"><Check className="size-8" /></div>
        <h2 className="mt-5 font-display text-3xl">We've got your order.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Our team will call you shortly to confirm delivery. Your sweets will leave our counter fresh.</p>
        <div className="mt-6 rounded-2xl bg-muted p-4 text-left text-xs">
          <div className="flex justify-between"><span>Order reference</span><b className="font-mono-ui">AGS-{Math.floor(1000 + Math.random() * 8999)}</b></div>
          <div className="mt-2 flex justify-between"><span>Payment</span><b>Cash on delivery</b></div>
        </div>
        <button onClick={onDone} className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-finish-order">Back to the counter</button>
      </div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-primary/40 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col overflow-auto bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-display text-2xl">Almost there</p>
            <p className="text-xs text-muted-foreground">We deliver across Sirsa and nearby areas</p>
          </div>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Close checkout" data-testid="button-close-checkout"><X className="size-5" /></button>
        </div>
        <form className="space-y-5 p-5 sm:p-8" onSubmit={e => { e.preventDefault(); setSubmitted(true); }} data-testid="form-checkout">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="customer-name">Your name</label>
            <input id="customer-name" required className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="The person opening the box" data-testid="input-customer-name" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="customer-phone">Phone number</label>
            <input id="customer-phone" required type="tel" pattern="[0-9]{10}" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="10 digit mobile number" data-testid="input-customer-phone" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="customer-address">Delivery address</label>
            <textarea id="customer-address" required rows={3} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="House number, street, landmark, Sirsa" data-testid="input-customer-address" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="delivery-date">Preferred delivery date</label>
            <input id="delivery-date" required type="date" min={new Date().toISOString().split('T')[0]} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-delivery-date" />
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <div className="flex justify-between text-sm"><span>Order total</span><b className="font-mono-ui">{money(subtotal)}</b></div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="size-4 text-secondary" /> Cash on delivery · no advance payment</div>
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-place-order">
            Place COD order <Check className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderConfirmation({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-primary/50 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground"><Gift className="size-8" /></div>
        <h2 className="mt-5 font-display text-3xl">See you at the door.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Your order has been noted. Thank you for keeping a local sweet tradition alive.</p>
        <button onClick={onClose} className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-close-confirmation">Keep browsing</button>
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[100dvh] bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" data-testid="link-admin-home">
            <div className="grid size-10 place-items-center rounded-full border-2 border-accent text-accent"><Sparkles className="size-5" /></div>
            <div><div className="font-display text-xl">Aggarwal</div><div className="font-mono-ui text-[9px] uppercase tracking-widest text-accent">Owner workspace</div></div>
          </Link>
          <button onClick={() => setLocation('/')} className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-4 py-2 text-xs font-bold" data-testid="button-exit-admin">
            <Store className="size-3.5" /> View storefront
          </button>
        </div>
        <div className="grid gap-10 py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">Owner portal</p>
            <h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Your sweet shop,<br /><em className="font-normal text-accent">at a glance.</em></h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-primary-foreground/65">A home for the people behind the counter. Track orders, keep the catalogue fresh, and see what Sirsa is loving today.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-full bg-accent px-5 py-3 text-xs font-bold text-accent-foreground" data-testid="button-admin-signin">Sign in to dashboard</button>
              <Link href="/" className="rounded-full border border-primary-foreground/25 px-5 py-3 text-xs font-bold" data-testid="link-admin-storefront">Explore storefront</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-primary-foreground/10 px-3 pb-4">
              <span className="font-display text-xl">Good morning, Aggarwal family</span>
              <span className="rounded-full bg-accent px-2 py-1 font-mono-ui text-[9px] font-bold text-accent-foreground">LIVE PREVIEW</span>
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-accent p-4 text-accent-foreground">
                <p className="text-[10px] font-bold uppercase tracking-wider">Today's orders</p>
                <p className="mt-4 font-display text-4xl">28</p>
                <p className="mt-1 text-xs opacity-70">+6 since yesterday</p>
              </div>
              <div className="rounded-2xl bg-primary-foreground/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">Counter sales</p>
                <p className="mt-4 font-display text-4xl">₹18.4k</p>
                <p className="mt-1 text-xs text-primary-foreground/50">This week</p>
              </div>
              <div className="rounded-2xl bg-primary-foreground/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">Top sweet</p>
                <p className="mt-4 font-display text-2xl">Kaju Katli</p>
                <p className="mt-1 text-xs text-primary-foreground/50">126 orders</p>
              </div>
            </div>
            <div className="rounded-2xl bg-primary-foreground/10 p-4">
              <div className="flex items-center justify-between text-xs"><span className="font-bold">Recent orders</span><span className="text-accent">View all</span></div>
              {['#AGS-2841 · Shagun Box', '#AGS-2840 · Motichoor Ladoo', '#AGS-2839 · Aloo Bhujia'].map((item, i) => (
                <div key={item} className="flex items-center justify-between border-b border-primary-foreground/10 py-3 text-xs last:border-0">
                  <span className="text-primary-foreground/70">{item}</span>
                  <span className="flex items-center gap-1.5 text-accent"><BadgeCheck className="size-3.5" /> {i === 0 ? 'Packing' : 'Confirmed'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shell prop types (defined before SharedShell) ────────────────────────────
type ShellChildProps = {
  catalog: Product[];
  wishlist: string[];
  onWishlist: (id: string) => void;
  onDetail: (p: Product) => void;
  onAdd: (p: Product, v?: ProductVariant) => void;
};
type ShellRenderProp = (props: ShellChildProps) => React.ReactNode;

// ─── Shared shell (shared cart, auth, overlays) ────────────────────────────────
function SharedShell({ children }: { children: ShellRenderProp }) {
  const [catalog, setCatalog] = useState<Product[]>(readCatalog);
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('aggarwal-cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('aggarwal-wishlist') || '[]'); } catch { return []; }
  });
  const [user, setUser] = useState<AuthUser | null>(readUser);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [newsletter, setNewsletter] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem('aggarwal-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('aggarwal-wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => {
    const refresh = () => setCatalog(readCatalog());
    window.addEventListener('aggarwal-catalog-updated', refresh);
    return () => window.removeEventListener('aggarwal-catalog-updated', refresh);
  }, []);

  const addToCart = (product: Product, variant = defaultVariant(product)) => {
    setCart(curr => {
      const existing = curr.find(l => l.product.id === product.id && l.variant.weight === variant.weight && l.variant.material === variant.material);
      if (existing) return curr.map(l => l === existing ? { ...l, quantity: l.quantity + 1 } : l);
      return [...curr, { product, variant, quantity: 1 }];
    });
    setDetail(null);
    setCartOpen(true);
  };
  const updateQty = (index: number, delta: number) =>
    setCart(curr => curr.map((l, i) => i === index ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l).filter(l => l.quantity > 0));
  const toggleWishlist = (id: string) =>
    setWishlist(curr => curr.includes(id) ? curr.filter(i => i !== id) : [...curr, id]);
  const itemCount = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cart.reduce((s, l) => s + l.variant.price * l.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem('aggarwal-user');
    setUser(null);
  };

  // Pass catalog and handlers down via context-like approach using cloneElement or just prop drill per route
  // Since routes each need catalog/wishlist/onDetail/onAdd, we render them as children with those props
  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <PromoMarquee />
      <Header
        itemCount={itemCount}
        onCartOpen={() => setCartOpen(true)}
        user={user}
        onAuthOpen={() => setAuthOpen(true)}
        onLogout={handleLogout}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />
      <BenefitMarquee />

      {children({ catalog, wishlist, onWishlist: toggleWishlist, onDetail: setDetail, onAdd: addToCart })}

      <Footer />

      {detail && <ProductDrawer product={detail} onClose={() => setDetail(null)} onAdd={addToCart} />}
      {cartOpen && <CartDrawer cart={cart} subtotal={subtotal} updateQty={updateQty} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckout(true); }} />}
      {checkout && <Checkout subtotal={subtotal} onClose={() => setCheckout(false)} onDone={() => { setCheckout(false); setOrdered(true); setCart([]); }} />}
      {ordered && <OrderConfirmation onClose={() => setOrdered(false)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={u => { setUser(u); }} />}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage(props: ShellChildProps) {
  const { catalog, wishlist, onWishlist, onDetail, onAdd } = props;
  const [newsletter, setNewsletter] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);

  return (
    <main>
      <Hero onShop={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} />
      <TrustStrip />
      <CategoryRail />
      <ShopSection products={catalog} wishlist={wishlist} onWishlist={onWishlist} onDetail={onDetail} onAdd={onAdd} />
      <GiftingSection products={catalog} addToCart={onAdd} />
      <Story />
      <Newsletter
        value={newsletter} setValue={setNewsletter} done={newsletterDone}
        onSubmit={e => { e.preventDefault(); if (newsletter.includes('@')) setNewsletterDone(true); }}
      />
    </main>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
function StoreRouter() {
  return (
    <Switch>
      <Route path="/admin" component={AdminPage} />
      <Route>
        <SharedShell>
          {(props: ShellChildProps) => (
            <Switch>
              <Route path="/shop/:category">
                {(params) => <ShopPage {...props} />}
              </Route>
              <Route path="/shop">
                <ShopPage {...props} />
              </Route>
              <Route path="/blog">
                <BlogPage />
              </Route>
              <Route path="/">
                <HomePage {...props} />
              </Route>
              <Route component={NotFound} />
            </Switch>
          )}
        </SharedShell>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <StoreRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
