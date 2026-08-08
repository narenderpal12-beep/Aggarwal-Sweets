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
  Trash2, Wheat, CircleAlert, LogIn, KeyRound, BookOpen, Send, MessageCircle,
  Package, ListOrdered, Settings, Home, ChevronRight as Chevron, Lock, RotateCcw, FlaskConical
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = 'All' | 'Mithai' | 'Namkeen' | 'Snacks' | 'Gifting';
type ProductVariant = { material: string; weight: string; price: number };
type Product = {
  id: string; name: string; category: Exclude<Category, 'All'>; price: number; unit: string;
  rating: number; reviews: number; description: string; image: string; badge?: string;
  variants: ProductVariant[]; tags?: string[];
};
type CartLine = { product: Product; variant: ProductVariant; quantity: number };
type AuthUser = { email: string; name?: string };
type OrderStatus = 'Confirmed' | 'Packing' | 'Out for delivery' | 'Delivered';
type OrderRecord = {
  id: string; date: string; items: CartLine[]; subtotal: number;
  status: OrderStatus; address: string; phone: string;
};
type BlogPost = {
  id: string; slug: string; title: string; excerpt: string;
  date: string; readTime: string; category: string; image: string;
  body: string[];
};

// ─── Nav structure ────────────────────────────────────────────────────────────
type NavSubItem = { label: string; slug: string; subtitle: string; category: Exclude<Category, 'All'> };
type NavCategory = { label: string; subs: NavSubItem[] };

const navCategories: NavCategory[] = [
  {
    label: 'Mithai',
    subs: [
      { label: 'Kaju Sweets',     slug: 'kaju-sweets',     subtitle: 'Our finest cashew delicacies',           category: 'Mithai' },
      { label: 'Ghee Sweets',     slug: 'ghee-sweets',     subtitle: 'Pure desi ghee, traditional recipes',    category: 'Mithai' },
      { label: 'Milk Sweets',     slug: 'milk-sweets',     subtitle: 'Khoya, milk and cream-based mithai',     category: 'Mithai' },
      { label: 'Ladoo & Laddus', slug: 'ladoo-laddus',    subtitle: 'Hand-rolled and auspicious',             category: 'Mithai' },
      { label: 'Barfi & Halwa',  slug: 'barfi-halwa',     subtitle: 'Firm, fudgy and festival-ready',         category: 'Mithai' },
      { label: 'Festive Specials',slug: 'festive-specials',subtitle: 'Made for the big occasions',             category: 'Mithai' },
    ],
  },
  {
    label: 'Namkeen',
    subs: [
      { label: 'Bhujia & Sev',      slug: 'bhujia-sev',      subtitle: 'The best of the savoury counter',      category: 'Namkeen' },
      { label: 'Roasted Nuts',      slug: 'roasted-nuts',    subtitle: 'Spiced, crunchy, hand-roasted',        category: 'Namkeen' },
      { label: 'Mathri & Crackers', slug: 'mathri-crackers', subtitle: 'Flaky bites for every chai break',     category: 'Namkeen' },
    ],
  },
  {
    label: 'Snacks',
    subs: [
      { label: 'Tea-time Snacks', slug: 'tea-time-snacks', subtitle: 'Perfect companions for chai',          category: 'Snacks' },
      { label: 'Spiced Snacks',   slug: 'spiced-snacks',   subtitle: 'A little heat, a lot of flavour',      category: 'Snacks' },
    ],
  },
  {
    label: 'Gifting',
    subs: [
      { label: 'Festival Boxes',  slug: 'festival-boxes',  subtitle: 'Boxes built for celebrations',         category: 'Gifting' },
      { label: 'Corporate Gifts', slug: 'corporate-gifts', subtitle: 'Thoughtful, premium and branded',      category: 'Gifting' },
      { label: 'Personal Gifts',  slug: 'personal-gifts',  subtitle: 'From one heart to another',            category: 'Gifting' },
    ],
  },
];

// Flat lookup: slug → sub-item
const allSubItems: NavSubItem[] = navCategories.flatMap(c => c.subs);

// ─── Data ─────────────────────────────────────────────────────────────────────
const products: Product[] = [
  {
    id: 'kaju-katli', name: 'Kaju Katli', category: 'Mithai', price: 340, unit: '250 gm',
    rating: 4.9, reviews: 126, badge: 'Best seller', image: '/hero-mithai.jpg',
    description: 'Silky cashew fudge finished with a whisper of silver leaf. Made in small batches for the perfect melt.',
    tags: ['kaju-sweets', 'barfi-halwa', 'festive-specials'],
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
    tags: ['ladoo-laddus', 'festive-specials'],
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
    tags: ['barfi-halwa', 'milk-sweets'],
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
    tags: ['ghee-sweets', 'festive-specials'],
    variants: [
      { material: 'Desi ghee', weight: '250 gm', price: 150 },
      { material: 'Desi ghee', weight: '500 gm', price: 290 },
    ],
  },
  {
    id: 'aloo-bhujia', name: 'Aloo Bhujia', category: 'Namkeen', price: 95, unit: '200 gm',
    rating: 4.8, reviews: 108, badge: 'Tea-time hero', image: '/namkeen-bowl.jpg',
    description: 'Crunchy potato sev with a bright, savoury masala blend — impossible to stop at one handful.',
    tags: ['bhujia-sev'],
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
    tags: ['roasted-nuts'],
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
    tags: ['mathri-crackers', 'tea-time-snacks', 'spiced-snacks'],
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
    tags: ['festival-boxes', 'corporate-gifts', 'personal-gifts'],
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
const blogPosts: BlogPost[] = [
  {
    id: 'history-of-kaju-katli', slug: 'history-of-kaju-katli',
    title: "The Silver Story: How Kaju Katli Became India's Favourite Mithai",
    excerpt: "From royal kitchens to neighbourhood sweet shops — tracing the journey of the most gifted sweet in India.",
    date: 'July 2025', readTime: '4 min', category: 'Heritage', image: '/hero-mithai.jpg',
    body: [
      "Kaju Katli is not just a sweet — it is a cultural shorthand for celebration. The thin diamond-shaped slice of cashew fudge, wrapped in a whisper of edible silver, arrives at weddings, festivals, promotions, and first visits. Yet very few people pause to ask: where did it come from?",
      "The origins are traced to the royal kitchens of Rajasthan and parts of present-day Uttar Pradesh, where halwais serving Mughal-era courts experimented with imported cashews (kaju) and fine sugar syrup. The one-string consistency of the sugar — cooked until a single thread forms between thumb and forefinger — became the defining test of a skilled mithai maker.",
      "What sets kaju katli apart from other barfi is the absence of milk or ghee in the base. The cashew paste itself provides the fat, giving it that distinctly clean, almost buttery melt. The silver vark on top was originally functional — a preservative — before it became purely ceremonial.",
      "At Aggarwal Sweets, we have been making kaju katli the same way since 1978: raw cashews soaked overnight, ground fresh each morning, and cooked in open brass kadais over a slow flame. The silver is applied by hand, one sheet at a time. No machine can replicate the even pressure required. It is tedious work, and we would not have it any other way.",
      "The next time someone hands you a box of kaju katli at a wedding, take a moment before you eat it. You are holding several centuries of culinary refinement in one diamond-shaped bite.",
    ],
  },
  {
    id: 'ghee-vs-oil', slug: 'ghee-vs-oil',
    title: 'Desi Ghee vs Oil in Sweets: What Actually Changes the Flavour?',
    excerpt: "Our head mithai maker breaks down why ghee isn't just a tradition — it's the reason the barfi melts just right.",
    date: 'June 2025', readTime: '3 min', category: 'Craft', image: '/ladoo-plate.jpg',
    body: [
      "We get asked this question at least once a week: 'Do you use real ghee, or is it oil?' The honest answer is: always pure desi ghee — and here is why it matters far more than most people realise.",
      "Ghee has a higher smoke point than most cooking oils, which means it can carry the heat required to properly roast besan or suji without burning. But the real difference is flavour. Ghee contains diacetyl and short-chain fatty acids that create the warm, nutty, unmistakably 'mithai' aroma. Oil simply cannot replicate this chemistry.",
      "When you eat a besan ladoo made with ghee, it dissolves slowly and evenly on the tongue. The same ladoo made with oil feels greasy and exits quickly — there is no lingering, no finish. In food science terms, ghee acts as a flavour carrier, binding fat-soluble aromatic compounds and releasing them gradually as the sweet melts.",
      "There is also texture. Ghee-based barfi sets firmer at room temperature and softens precisely when it hits body heat. That controlled melt is not an accident — it is the fat crystallisation behaviour of clarified butter, something refined oils cannot match.",
      "Switching to oil would shave about 15% off our raw material cost. We tried it once, in 2003, on a single batch of motichoor ladoo. Nobody complained because they did not know. But we knew. The batch went in the family kitchen. We never tried again.",
    ],
  },
  {
    id: 'festive-gifting-guide', slug: 'festive-gifting-guide',
    title: '2025 Festive Gifting Guide: What to Send, How Much, and When',
    excerpt: 'A practical guide from the Aggarwal family — how to pick a box that says exactly the right thing.',
    date: 'May 2025', readTime: '5 min', category: 'Guide', image: '/hero-mithai.jpg',
    body: [
      "Gifting sweets sounds straightforward until you are standing in front of a counter with seventeen varieties and a cousin's wedding in three hours. Over forty-seven years of selling mithai in Sirsa, we have noticed that most gifting mistakes fall into three categories: too little, too safe, or too late.",
      "Too little means sending a 250g box for an occasion that warrants 500g or more. As a general rule: casual visits → 250–500g. Wedding functions → 1kg+. Corporate gifting → standardised boxes of 500g per recipient. Diwali hampers → combine sweets with namkeen for variety at any weight.",
      "Too safe means sending kaju katli when you could send something that actually reflects the occasion. For a new baby, motichoor ladoo — round, golden, auspicious. For a business deal closed, a premium dry fruit box communicates more than a standard assortment. For a Punjabi household's Lohri, gajak and rewri belong alongside the mithai.",
      "Too late is the silent killer of sweet gifting. Mithai made fresh lasts 3–7 days without refrigeration depending on the variety. Order at least 48 hours in advance for anything above 2kg. For large weddings, we recommend a 7-day lead time so we can pack in batches and ensure each box is equally fresh.",
      "One final note: the box matters. A plain cardboard box says function. A foil-lined decorative box with a hand-tied ribbon says occasion. We offer both — ask our counter staff which box suits your event and we will pack it right.",
    ],
  },
  {
    id: 'tea-time-namkeen', slug: 'tea-time-namkeen',
    title: 'Five Namkeens That Belong Next to Your Evening Chai',
    excerpt: 'From bhujia to mathri, we rank the snacks that have earned a permanent spot on the tea tray.',
    date: 'April 2025', readTime: '3 min', category: 'Food', image: '/namkeen-bowl.jpg',
    body: [
      "Evening chai is non-negotiable in most North Indian homes. What sits next to it is a matter of fierce personal conviction. We have sold namkeen in Sirsa since before most of our customers were born, and after much internal debate, here is our definitive tea-time ranking.",
      "1. Aloo Bhujia. The undisputed king. The thin, spiced potato-and-besan strands are engineered for chai — crunchy without being loud, salty without being aggressive. Bikaner claims to have invented it; we just do it well.",
      "2. Mathri. Flaky, ghee-rich, and sturdy enough to scoop pickle if the mood strikes. The short pastry texture makes it the most satisfying bite on this list. Best eaten the day it is made.",
      "3. Moong Dal. Light and addictive in a way that is difficult to explain until you have eaten a handful. The slow-fried split green gram has a clean protein flavour that holds up against masala chai without competing.",
      "4. Mixture. A democratic option — a little of everything. Not the most refined choice, but the most crowd-pleasing. Ideal for large gatherings where you cannot predict anyone's preference.",
      "5. Chakli. The South Indian ringed spiral has earned a permanent place on North Indian tea trays. Sesame, ajwain, and rice flour in a crunch that is deeply satisfying.",
    ],
  },
  {
    id: 'motichoor-ladoo-story', slug: 'motichoor-ladoo-story',
    title: 'Motichoor Ladoo: The Sweet That Crosses Every Occasion',
    excerpt: 'Why this small, grainy orange ball shows up at births, weddings, and temple offerings alike — and how it is made.',
    date: 'March 2025', readTime: '4 min', category: 'Heritage', image: '/ladoo-plate.jpg',
    body: [
      "Ask any North Indian family to name one sweet that has been present at every major moment of their lives, and the answer is almost always motichoor ladoo. Not kaju katli (too expensive for daily rituals), not gulab jamun (too messy to travel), but the humble, grainy, saffron-orange ladoo — reliable, auspicious, and universally loved.",
      "The name comes from the tiny boondi pearls it is made from: moti (pearl) + choor (crumbled/crushed). The boondi are fried in ghee, soaked in sugar syrup spiced with cardamom and a few strands of saffron, then pressed together while still warm into balls. The technique sounds simple. The execution is demanding.",
      "The syrup must be at precisely the right consistency — not so thin that the boondi stay separate, not so thick that the ladoo becomes hard. The pressing must happen quickly, while the mixture is warm enough to bind but not so hot it burns the hands. An experienced ladoo maker does this entirely by feel, producing dozens of identical spheres in minutes.",
      "At temples across Haryana and Rajasthan, motichoor ladoo is the prasad of choice — perhaps because its roundness echoes the chakra, or perhaps simply because it is delicious and travels well without refrigeration.",
      "We make our motichoor in the traditional orange, but also in a pale cream variety (sans saffron) for families who prefer a more subtle colour for certain pujas. Both use the same syrup ratio, the same ghee, the same unhurried press. Some things should not be rushed.",
    ],
  },
  {
    id: 'store-mithai-at-home', slug: 'store-mithai-at-home',
    title: 'How to Store Mithai at Home Without Losing Freshness',
    excerpt: 'The five most common mistakes people make after bringing home a box of sweets — and how to avoid every one of them.',
    date: 'February 2025', readTime: '3 min', category: 'Tips', image: '/hero-mithai.jpg',
    body: [
      "You have bought a beautiful box of sweets. The counter was fragrant, the packaging pristine, the drive home made you seriously consider eating one in the car. Then, three days later, the barfi has dried out, the ladoos have cracked, and something in the corner smells faintly of the fridge. Here is where it went wrong.",
      "Mistake 1: Refrigerating everything. The refrigerator is not the default home for mithai. Cold, dry refrigerator air draws out moisture and hardens the texture. Kaju katli, besan ladoo, and barfi are best stored at room temperature in an airtight container for up to 5 days. Only milk-based sweets like rasgulla or rabri need refrigeration.",
      "Mistake 2: Keeping sweets in the original packaging. Decorative boxes are not airtight. Transfer sweets to a steel or glass container with a tight lid within a few hours of purchase, especially in summer.",
      "Mistake 3: Mixing wet and dry sweets. Rasgulla next to mathri is a recipe for soggy namkeen. Store wet and dry items in completely separate containers.",
      "Mistake 4: Leaving them in sunlight or near the stove. Heat and light accelerate oxidation of the ghee. A cool, dark kitchen cabinet is ideal.",
      "Mistake 5: Waiting too long. The best storage advice we can give is: eat mithai fresh. Share it with the neighbourhood, send some to a relative, offer it at the temple. Mithai made with care is meant to be given and eaten — not hoarded.",
    ],
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
function readOrders(): OrderRecord[] {
  try { return JSON.parse(localStorage.getItem('aggarwal-orders') || '[]'); } catch { return []; }
}
function saveOrder(order: OrderRecord) {
  const orders = readOrders();
  localStorage.setItem('aggarwal-orders', JSON.stringify([order, ...orders]));
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
function ShopDropdown({ onNavigate }: { onNavigate: (cat: Exclude<Category, 'All'>, slug?: string) => void }) {
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
            onClick={() => onNavigate(sub.category, sub.slug)}
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

  const handleNavCategory = (cat: Exclude<Category, 'All'>, slug?: string) => {
    setShopOpen(false);
    setMenuOpen(false);
    navigate(`/shop/${cat.toLowerCase()}${slug ? `?sub=${slug}` : ''}`);
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
          <Link href="/our-story" className="rounded-lg px-4 py-2.5 transition-colors hover:bg-muted" data-testid="nav-story" onClick={() => setShopOpen(false)}>
            Our Story
          </Link>
          <Link href="/contact" className="rounded-lg px-4 py-2.5 transition-colors hover:bg-muted" data-testid="nav-contact" onClick={() => setShopOpen(false)}>
            Contact
          </Link>
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
                          onClick={() => { handleNavCategory(sub.category, sub.slug); setMobileShopOpen(false); setMenuOpen(false); }}
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
              <Link href="/our-story" className="block py-2.5 text-sm font-semibold" onClick={() => setMenuOpen(false)}>Our Story</Link>
              <Link href="/contact" className="block py-2.5 text-sm font-semibold" onClick={() => setMenuOpen(false)}>Contact</Link>
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
              <div className="absolute right-0 top-full z-50 mt-1 hidden w-52 rounded-2xl border border-border bg-background p-2 shadow-xl group-focus-within:block group-hover:block">
                <p className="truncate px-3 py-2 text-xs text-muted-foreground">{user.email}</p>
                <Link href="/account" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted" data-testid="link-my-account">
                  <UserRound className="size-4" /> My Account
                </Link>
                <Link href="/account?tab=orders" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted" data-testid="link-my-orders">
                  <ListOrdered className="size-4" /> My Orders
                </Link>
                <Link href="/account?tab=wishlist" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted" data-testid="link-my-wishlist">
                  <Heart className="size-4" /> Wishlist
                </Link>
                <div className="my-1 border-t border-border" />
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
// ─── Page Hero (photo + trust strip) ─────────────────────────────────────────
const CATEGORY_IMAGES: Partial<Record<Category | 'Blog' | 'Account' | 'Default', string>> = {
  All:      '/hero-mithai.jpg',
  Mithai:   '/hero-mithai.jpg',
  Namkeen:  '/namkeen-bowl.jpg',
  Snacks:   '/ladoo-plate.jpg',
  Gifting:  '/hero-mithai.jpg',
  Blog:     '/ladoo-plate.jpg',
  Account:  '/hero-mithai.jpg',
  Default:  '/hero-mithai.jpg',
};

const PAGE_TRUST_ITEMS = [
  { icon: PackageCheck, label: 'Freshly prepared' },
  { icon: FlaskConical, label: 'Lab-tested ingredients' },
  { icon: Truck,        label: 'On-time delivery' },
  { icon: RotateCcw,   label: 'Easy returns' },
];

function PageHero({ image, label, title, subtitle }: {
  image: string; label?: string; title: string; subtitle?: string;
}) {
  return (
    <div>
      {/* Photo with overlay */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56 md:h-64">
        <img src={image} alt={title} className="h-full w-full object-cover object-center" />
        {/* Gradient: dark left-bottom, transparent right-top */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {/* Text bottom-left */}
        <div className="absolute bottom-0 left-0 px-5 py-5 sm:px-8 sm:py-7">
          {label && (
            <p className="mb-1 font-mono-ui text-[9px] uppercase tracking-[.3em] text-white/70">{label}</p>
          )}
          <h1 className="font-display text-3xl font-semibold text-white drop-shadow-md sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 max-w-md text-sm text-white/80 drop-shadow sm:text-base">{subtitle}</p>
          )}
        </div>
      </div>
      {/* Trust strip */}
      <div className="bg-secondary">
        <div className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto px-5 sm:px-8">
          {PAGE_TRUST_ITEMS.map(({ icon: Icon, label: lbl }, i) => (
            <div key={lbl} className="flex items-center">
              <div className="flex shrink-0 items-center gap-2 py-3 text-secondary-foreground">
                <Icon className="size-4 shrink-0 opacity-80" />
                <span className="whitespace-nowrap text-xs font-semibold">{lbl}</span>
              </div>
              {i < PAGE_TRUST_ITEMS.length - 1 && (
                <span className="mx-4 text-secondary-foreground/30 select-none">|</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [subSlug, setSubSlug] = useState(() => new URLSearchParams(window.location.search).get('sub') ?? '');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');

  // Sync when URL params change
  useEffect(() => {
    const cat = rawCat
      ? ((rawCat.charAt(0).toUpperCase() + rawCat.slice(1)) as Category)
      : 'All';
    setCategory(cat);
    setSubSlug(new URLSearchParams(window.location.search).get('sub') ?? '');
    setQuery('');
  }, [rawCat, window.location.search]);

  const activeSubItem = subSlug ? allSubItems.find(s => s.slug === subSlug) : null;

  const filtered = useMemo(() =>
    catalog
      .filter(p => {
        const catMatch = category === 'All' || p.category === category;
        const subMatch = !subSlug || (p.tags ?? []).includes(subSlug);
        const queryMatch = p.name.toLowerCase().includes(query.toLowerCase());
        return catMatch && subMatch && queryMatch;
      })
      .sort((a, b) => sort === 'low' ? lowestPrice(a) - lowestPrice(b) : sort === 'high' ? lowestPrice(b) - lowestPrice(a) : 0),
    [catalog, category, subSlug, query, sort]
  );

  const categoryImage = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES['Default']!;
  const heroTitle = activeSubItem ? activeSubItem.label : (category === 'All' ? 'All Products' : category);
  const heroSubtitle = activeSubItem
    ? activeSubItem.subtitle
    : (category === 'All'
        ? 'Browse our full counter — sweets, namkeen, snacks, and gift boxes.'
        : (categories.find(c => c.label === category)?.note ?? ''));

  return (
    <div className="min-h-screen">
      <PageHero
        image={categoryImage}
        label="Aggarwal Sweets · Sirsa"
        title={heroTitle}
        subtitle={heroSubtitle}
      />

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
            {(['All', 'Mithai', 'Namkeen', 'Snacks', 'Gifting'] as Category[]).map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); setSubSlug(''); }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === cat && !subSlug ? 'bg-primary text-primary-foreground' : 'hover:bg-muted border border-border'}`}
                data-testid={`shoppage-filter-${cat.toLowerCase()}`}>{cat}</button>
            ))}
            {activeSubItem && (
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground">
                {activeSubItem.label}
                <button onClick={() => setSubSlug('')} className="ml-1 opacity-70 hover:opacity-100" aria-label="Clear subcategory">×</button>
              </span>
            )}
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
            <button onClick={() => { setQuery(''); setCategory('All'); setSubSlug(''); }} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-shoppage-clear">Clear filters</button>
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
      <PageHero
        image={CATEGORY_IMAGES['Blog']!}
        label="Aggarwal Sweets · Sirsa"
        title="Stories & Recipes"
        subtitle="Heritage, craft, and the art of making sweets that carry meaning."
      />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {blogPosts.map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`}
              className={`group overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:shadow-xl ${i === 0 ? 'sm:col-span-2' : ''}`}
              data-testid={`blog-card-${post.slug}`}>
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
                <span className="mt-4 flex items-center gap-1.5 text-xs font-bold text-secondary">
                  Read more <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
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
function CartDrawer({ cart, subtotal, updateQty, onClose, onCheckout, user, onAuthOpen }: {
  cart: CartLine[]; subtotal: number; updateQty: (i: number, delta: number) => void;
  onClose: () => void; onCheckout: () => void; user: AuthUser | null; onAuthOpen: () => void;
}) {
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
              {user ? (
                <button onClick={onCheckout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-proceed-checkout">
                  Proceed to checkout <ArrowRight className="size-4" />
                </button>
              ) : (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <Lock className="size-4 shrink-0" />
                    <span>Sign in to place your order securely.</span>
                  </div>
                  <button onClick={() => { onClose(); onAuthOpen(); }} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground" data-testid="button-cart-signin">
                    <UserRound className="size-4" /> Sign in to checkout
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Checkout ─────────────────────────────────────────────────────────────────
function Checkout({ subtotal, cart, onClose, onDone }: { subtotal: number; cart: CartLine[]; onClose: () => void; onDone: (order: OrderRecord) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [orderId] = useState(() => `AGS-${Math.floor(1000 + Math.random() * 8999)}`);
  const [orderRef, setOrderRef] = useState<OrderRecord | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const address = (form.querySelector('#customer-address') as HTMLTextAreaElement)?.value ?? '';
    const phone = (form.querySelector('#customer-phone') as HTMLInputElement)?.value ?? '';
    const order: OrderRecord = {
      id: orderId,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: cart,
      subtotal,
      status: 'Confirmed',
      address,
      phone,
    };
    saveOrder(order);
    setOrderRef(order);
    setSubmitted(true);
  };

  if (submitted && orderRef) return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-primary/50 p-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground"><Check className="size-8" /></div>
        <h2 className="mt-5 font-display text-3xl">We've got your order.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Our team will call you shortly to confirm delivery. Your sweets will leave our counter fresh.</p>
        <div className="mt-6 rounded-2xl bg-muted p-4 text-left text-xs space-y-2">
          <div className="flex justify-between"><span>Order reference</span><b className="font-mono-ui">{orderRef.id}</b></div>
          <div className="flex justify-between"><span>Payment</span><b>Cash on delivery</b></div>
          <div className="flex justify-between"><span>Items</span><b>{orderRef.items.reduce((s, l) => s + l.quantity, 0)} packs</b></div>
        </div>
        <Link href="/account" onClick={() => onDone(orderRef)} className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-secondary underline underline-offset-2">
          <ListOrdered className="size-3.5" /> View in My Orders
        </Link>
        <button onClick={() => onDone(orderRef)} className="mt-4 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-finish-order">Back to the counter</button>
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
        <form className="space-y-5 p-5 sm:p-8" onSubmit={handleSubmit} data-testid="form-checkout">
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
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-place-order">
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

// ─── Floating Contact Buttons ─────────────────────────────────────────────────
function FloatingButtons() {
  const PHONE = '01666234786';
  const WA_NUMBER = '911666234786';
  const WA_MSG = encodeURIComponent('Hello! I would like to order sweets from Aggarwal Sweets Sirsa.');
  return (
    <div className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-3" aria-label="Quick contact">
      {/* WhatsApp */}
      <a
        href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
        target="_blank" rel="noreferrer"
        aria-label="Chat on WhatsApp"
        data-testid="button-whatsapp"
        className="group flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
      >
        <MessageCircle className="size-5 fill-white" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-xs">WhatsApp us</span>
      </a>
      {/* Call */}
      <a
        href={`tel:${PHONE}`}
        aria-label="Call us"
        data-testid="button-call"
        className="group flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
      >
        <Phone className="size-5" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-xs">{PHONE}</span>
      </a>
    </div>
  );
}

// ─── Account Page ─────────────────────────────────────────────────────────────
const ORDER_STATUSES: Record<OrderStatus, { label: string; color: string }> = {
  Confirmed:         { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  Packing:           { label: 'Being packed', color: 'bg-amber-100 text-amber-700' },
  'Out for delivery':{ label: 'Out for delivery', color: 'bg-orange-100 text-orange-700' },
  Delivered:         { label: 'Delivered', color: 'bg-green-100 text-green-700' },
};

function AccountPage({ user, wishlist, catalog, onAuthOpen, onLogout, onDetail }: {
  user: AuthUser | null;
  wishlist: string[];
  catalog: Product[];
  onAuthOpen: () => void;
  onLogout: () => void;
  onDetail: (p: Product) => void;
}) {
  const [, navigate] = useLocation();
  const searchStr = typeof window !== 'undefined' ? window.location.search : '';
  const urlTab = new URLSearchParams(searchStr).get('tab') ?? 'orders';
  const [tab, setTab] = useState<'orders' | 'wishlist' | 'profile' | 'addresses'>(
    (['orders', 'wishlist', 'profile', 'addresses'] as const).includes(urlTab as 'orders') ? urlTab as 'orders' : 'orders'
  );
  const [orders, setOrders] = useState<OrderRecord[]>(readOrders);
  const [name, setName] = useState(user?.name ?? '');
  const [nameSaved, setNameSaved] = useState(false);
  const [address, setAddress] = useState(() => {
    try { return localStorage.getItem('aggarwal-saved-address') ?? ''; } catch { return ''; }
  });
  const [addrSaved, setAddrSaved] = useState(false);

  const wishlisted = catalog.filter(p => wishlist.includes(p.id));

  if (!user) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <div className="grid size-20 place-items-center rounded-full bg-muted text-secondary"><UserRound className="size-10" /></div>
      <div>
        <h1 className="font-display text-3xl">My Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to view your orders, wishlist, and profile.</p>
      </div>
      <button onClick={onAuthOpen} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-account-signin">
        <UserRound className="size-4" /> Sign in / Register
      </button>
    </div>
  );

  const tabs: { key: typeof tab; label: string; icon: typeof UserRound }[] = [
    { key: 'orders', label: 'My Orders', icon: ListOrdered },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <PageHero
        image={CATEGORY_IMAGES['Account']!}
        label="Your account"
        title={user.name ? `Hello, ${user.name}` : 'Hello there'}
        subtitle={user.email}
      />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex gap-8 lg:items-start">
          {/* Sidebar */}
          <aside className="hidden w-52 shrink-0 lg:block">
            <nav className="space-y-1 rounded-2xl border border-border bg-background p-2 shadow-sm">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${tab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  data-testid={`tab-${key}`}>
                  <Icon className="size-4" /> {label}
                </button>
              ))}
              <div className="border-t border-border pt-1 mt-1">
                <button onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-destructive hover:bg-muted">
                  <LogIn className="size-4" /> Sign out
                </button>
              </div>
            </nav>
          </aside>

          {/* Mobile tab bar */}
          <div className="lg:hidden w-full mb-6">
            <div className="flex gap-1 overflow-auto rounded-2xl border border-border bg-background p-2 shadow-sm">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${tab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Orders Tab */}
            {tab === 'orders' && (
              <div>
                <h2 className="mb-5 font-display text-2xl">My Orders</h2>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background p-12 text-center">
                    <Package className="mx-auto size-12 text-muted-foreground/40" />
                    <p className="mt-4 font-display text-xl">No orders yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">Your placed orders will appear here.</p>
                    <Link href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">
                      Start shopping <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono-ui text-xs text-muted-foreground">{order.date}</p>
                            <p className="mt-1 font-display text-lg font-semibold">{order.id}</p>
                            <p className="text-xs text-muted-foreground">{order.items.reduce((s, l) => s + l.quantity, 0)} items · {money(order.subtotal)}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUSES[order.status].color}`}>
                            {ORDER_STATUSES[order.status].label}
                          </span>
                        </div>
                        {/* Items */}
                        <div className="mt-4 flex flex-wrap gap-3">
                          {order.items.map((line, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <img src={line.product.image} alt={line.product.name} className="size-12 rounded-xl object-cover" />
                              <div>
                                <p className="text-xs font-semibold">{line.product.name}</p>
                                <p className="text-[10px] text-muted-foreground">{line.variant.weight} × {line.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.address && (
                          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            {order.address}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Wishlist Tab */}
            {tab === 'wishlist' && (
              <div>
                <h2 className="mb-5 font-display text-2xl">Wishlist</h2>
                {wishlisted.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-background p-12 text-center">
                    <Heart className="mx-auto size-12 text-muted-foreground/40" />
                    <p className="mt-4 font-display text-xl">Nothing saved yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">Tap the ♥ on any product to save it here.</p>
                    <Link href="/shop" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">
                      Browse products <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                    {wishlisted.map(product => (
                      <button key={product.id} onClick={() => onDetail(product)}
                        className="group overflow-hidden rounded-2xl border border-border bg-background text-left transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                        <div className="p-3">
                          <p className="font-display text-base font-semibold">{product.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">From {money(lowestPrice(product))}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="max-w-md">
                <h2 className="mb-5 font-display text-2xl">Profile</h2>
                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider">Email</label>
                    <div className="flex items-center gap-2 rounded-xl border border-input bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                      <Mail className="size-4 shrink-0" /> {user.email}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Email cannot be changed after registration.</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="account-name">Display name</label>
                    <input id="account-name" value={name} onChange={e => { setName(e.target.value); setNameSaved(false); }}
                      placeholder="Your name" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <button
                    onClick={() => {
                      const updated: AuthUser = { ...user, name };
                      localStorage.setItem('aggarwal-user', JSON.stringify(updated));
                      setNameSaved(true);
                    }}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground"
                    data-testid="button-save-profile">
                    {nameSaved ? <><Check className="size-4" /> Saved!</> : 'Save profile'}
                  </button>
                </div>
                <div className="mt-6 rounded-2xl border border-destructive/30 bg-background p-6 shadow-sm">
                  <p className="text-sm font-bold text-destructive">Danger zone</p>
                  <p className="mt-1 text-xs text-muted-foreground">Signing out will remove your session from this device.</p>
                  <button onClick={onLogout} className="mt-4 flex items-center gap-2 rounded-full border border-destructive px-5 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/5" data-testid="button-account-logout">
                    <LogIn className="size-4" /> Sign out
                  </button>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {tab === 'addresses' && (
              <div className="max-w-md">
                <h2 className="mb-5 font-display text-2xl">Saved Address</h2>
                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="saved-address">Delivery address</label>
                    <textarea id="saved-address" rows={4} value={address}
                      onChange={e => { setAddress(e.target.value); setAddrSaved(false); }}
                      placeholder="House number, street, landmark, city, PIN"
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <button
                    onClick={() => { localStorage.setItem('aggarwal-saved-address', address); setAddrSaved(true); }}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground"
                    data-testid="button-save-address">
                    {addrSaved ? <><Check className="size-4" /> Saved!</> : <><MapPin className="size-4" /> Save address</>}
                  </button>
                </div>
              </div>
            )}
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
  user: AuthUser | null;
  onWishlist: (id: string) => void;
  onDetail: (p: Product) => void;
  onAdd: (p: Product, v?: ProductVariant) => void;
  onAuthOpen: () => void;
  onLogout: () => void;
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
  const [pendingCheckout, setPendingCheckout] = useState(false);
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

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    if (pendingCheckout) {
      setPendingCheckout(false);
      setAuthOpen(false);
      setCheckout(true);
    }
  };

  const handleProceedCheckout = () => {
    setCartOpen(false);
    if (!user) {
      setPendingCheckout(true);
      setAuthOpen(true);
    } else {
      setCheckout(true);
    }
  };

  const shellProps: ShellChildProps = {
    catalog, wishlist, user,
    onWishlist: toggleWishlist,
    onDetail: setDetail,
    onAdd: addToCart,
    onAuthOpen: () => setAuthOpen(true),
    onLogout: handleLogout,
  };

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

      {children(shellProps)}

      <Footer />
      <FloatingButtons />

      {detail && <ProductDrawer product={detail} onClose={() => setDetail(null)} onAdd={addToCart} />}
      {cartOpen && (
        <CartDrawer
          cart={cart} subtotal={subtotal} updateQty={updateQty}
          onClose={() => setCartOpen(false)}
          onCheckout={handleProceedCheckout}
          user={user}
          onAuthOpen={() => { setCartOpen(false); setPendingCheckout(true); setAuthOpen(true); }}
        />
      )}
      {checkout && (
        <Checkout
          subtotal={subtotal} cart={cart}
          onClose={() => setCheckout(false)}
          onDone={(_order) => { setCheckout(false); setOrdered(true); setCart([]); }}
        />
      )}
      {ordered && <OrderConfirmation onClose={() => setOrdered(false)} />}
      {authOpen && <AuthModal onClose={() => { setAuthOpen(false); setPendingCheckout(false); }} onLogin={handleLogin} />}
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage(props: ShellChildProps) {
  const { catalog, wishlist, onWishlist, onDetail, onAdd, user } = props;
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

// ─── Blog Post Page ───────────────────────────────────────────────────────────
function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === params.slug);
  const [, navigate] = useLocation();
  if (!post) return <NotFound />;
  return (
    <div className="min-h-screen">
      <PageHero image={post.image} label={post.category} title={post.title} subtitle={post.date + ' · ' + post.readTime + ' read'} />
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <button onClick={() => navigate('/blog')} className="mb-8 flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline">
          <ChevronLeft className="size-3.5" /> All stories
        </button>
        <p className="mb-8 border-l-2 border-secondary pl-4 text-sm font-medium italic leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="space-y-5">
          {post.body.map((para, i) => (
            <p key={i} className="text-sm leading-8 text-foreground">{para}</p>
          ))}
        </div>
        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <div className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">Aggarwal Sweets</span> · Sirsa since 1978
          </div>
          <button onClick={() => navigate('/blog')} className="rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">
            Back to stories
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Our Story Page ───────────────────────────────────────────────────────────
function OurStoryPage() {
  return (
    <div className="min-h-screen">
      <PageHero
        image="/ladoo-plate.jpg"
        label="Aggarwal Sweets · Sirsa"
        title="Our Story"
        subtitle="A family recipe for keeping traditions alive since 1978."
      />
      {/* Main story */}
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div className="relative mx-auto max-w-sm w-full">
            <div className="absolute -inset-4 rounded-[2rem] border border-secondary/30" />
            <img src="/ladoo-plate.jpg" alt="Traditional sweets" className="relative aspect-[.85] w-full rounded-[2rem] object-cover" />
            <div className="absolute -bottom-5 -right-4 grid size-24 place-items-center rounded-full bg-accent text-center font-display text-lg leading-tight text-accent-foreground shadow-lg">
              45+<small className="block font-sans text-[9px] font-bold uppercase tracking-wide">years of<br/>sweetness</small>
            </div>
          </div>
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">The Aggarwal way</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Some recipes are measured in grams.<br /><em className="font-normal text-secondary">Ours are measured in memories.</em>
            </h2>
            <p className="mt-6 text-sm leading-7 text-muted-foreground">What started as a small counter in the heart of Sirsa in 1978 still begins the same way: good ingredients, patient hands, and a family member tasting the first batch before anything reaches the customer.</p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Three generations later, the kadais are the same. The recipes haven't been written down — they live in the hands of the people who make them. That is not a romantic notion. It is the reason no machine can replace what we do.</p>
            <div className="mt-8 grid grid-cols-3 gap-5 border-t border-border pt-6">
              <div><p className="font-display text-2xl">1978</p><p className="mt-1 text-[11px] text-muted-foreground">Our first batch</p></div>
              <div><p className="font-display text-2xl">18</p><p className="mt-1 text-[11px] text-muted-foreground">Recipes we guard</p></div>
              <div><p className="font-display text-2xl">4.9<span className="text-base">/5</span></p><p className="mt-1 text-[11px] text-muted-foreground">Happy households</p></div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mt-20">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">What we believe</p>
          <h3 className="mt-2 font-display text-3xl">The principles behind every batch</h3>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Only pure desi ghee', body: 'We have never substituted oil for ghee. The fat in ghee carries flavour that refined oil cannot. This one decision costs more and tastes incomparably better.' },
              { title: 'Small batches, every day', body: 'We make less so we can sell it fresh. Leftover mithai doesn\'t leave our kitchen in a box with your name on it — it goes to the family or is donated.' },
              { title: 'No artificial colour', body: 'The orange in our motichoor comes from saffron. The green in our pista barfi comes from real pistachios. Colours should taste like something.' },
              { title: 'Family tasting ritual', body: 'Every new batch must pass a single test: is it good enough to serve at our own table? If any family member says no, the batch doesn\'t go out.' },
              { title: 'Open counters', body: 'Our kitchen is visible from the shop floor. You can watch the barfi being poured, the ladoos being rolled. We have nothing to hide and several things to show.' },
              { title: 'Fair to farmers', body: 'Our cashews come from a cooperative in coastal Karnataka. Our milk from a dairy collective in Fatehabad. Good ingredients require good relationships.' },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-background p-6">
                <h4 className="font-display text-lg font-semibold">{title}</h4>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.3em] text-accent">Come say hello</p>
          <h3 className="mt-3 font-display text-3xl sm:text-4xl">12, Hissar Road, Sirsa</h3>
          <p className="mt-3 text-sm text-primary-foreground/70">Open daily · 9:00 AM – 9:30 PM</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/shop" className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground">Browse our sweets</Link>
            <Link href="/contact" className="rounded-full border border-primary-foreground/25 px-6 py-3 text-sm font-bold text-primary-foreground">Get in touch</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen">
      <PageHero
        image="/hero-mithai.jpg"
        label="Aggarwal Sweets · Sirsa"
        title="Get in Touch"
        subtitle="We're at the counter six days a week. Come visit, call, or send us a message."
      />
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">

          {/* Info column */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-secondary">Visit us</p>
              <h3 className="mt-2 font-display text-2xl">Our counter</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                12, Hissar Road<br />Near Clock Tower, Sirsa<br />Haryana · 125 055
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                <span className="font-bold text-foreground">Open daily</span> — 9:00 AM to 9:30 PM<br />
                Closed on national holidays
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-secondary">Call or WhatsApp</p>
              <h3 className="mt-2 font-display text-2xl">Direct line</h3>
              <a href="tel:01666234786" className="mt-3 flex items-center gap-3 text-sm font-bold hover:text-secondary" data-testid="contact-phone">
                <Phone className="size-4 text-secondary" /> 01666 234 786
              </a>
              <a href="https://wa.me/911666234786?text=Hello%2C%20I%20would%20like%20to%20order%20sweets" target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-3 text-sm font-bold hover:text-secondary" data-testid="contact-whatsapp">
                <MessageCircle className="size-4 fill-[#25D366] text-[#25D366]" /> WhatsApp us
              </a>
              <a href="mailto:orders@aggarwalsweets.in" className="mt-3 flex items-center gap-3 text-sm font-bold hover:text-secondary" data-testid="contact-email">
                <Mail className="size-4 text-secondary" /> orders@aggarwalsweets.in
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="font-mono-ui text-[10px] uppercase tracking-widest text-secondary">Bulk & corporate orders</p>
              <h3 className="mt-2 font-display text-2xl">Large quantities?</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">For orders above 5 kg or corporate gifting requirements, contact us at least 72 hours in advance. We'll confirm availability and arrange fresh production for your date.</p>
            </div>
          </div>

          {/* Message form */}
          <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
            <p className="font-mono-ui text-[10px] uppercase tracking-widest text-secondary">Send a message</p>
            <h3 className="mt-2 font-display text-2xl">We read every note</h3>
            {sent ? (
              <div className="mt-6 flex flex-col items-center gap-4 py-8 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-8" />
                </div>
                <h4 className="font-display text-2xl">Message received!</h4>
                <p className="text-sm text-muted-foreground">We usually respond within a few hours during shop hours (9 AM – 9:30 PM).</p>
                <button onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }); }}
                  className="rounded-full border border-border px-5 py-2.5 text-xs font-bold">Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" data-testid="form-contact">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="contact-name">Your name</label>
                  <input id="contact-name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="How should we address you?" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-contact-name" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="contact-phone">Phone number</label>
                  <input id="contact-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Optional — for a quicker reply" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-contact-phone" />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="contact-message">Your message</label>
                  <textarea id="contact-message" required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Order enquiry, feedback, bulk request…" className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-contact-message" />
                </div>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-contact-send">
                  <Send className="size-4" /> Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
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
                {() => <ShopPage {...props} />}
              </Route>
              <Route path="/shop">
                <ShopPage {...props} />
              </Route>
              <Route path="/blog/:slug">
                {() => <BlogPostPage />}
              </Route>
              <Route path="/blog">
                <BlogPage />
              </Route>
              <Route path="/our-story">
                <OurStoryPage />
              </Route>
              <Route path="/contact">
                <ContactPage />
              </Route>
              <Route path="/account">
                <AccountPage
                  user={props.user}
                  wishlist={props.wishlist}
                  catalog={props.catalog}
                  onAuthOpen={props.onAuthOpen}
                  onLogout={props.onLogout}
                  onDetail={props.onDetail}
                />
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
