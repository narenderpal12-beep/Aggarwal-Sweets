import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, Link, useLocation } from 'wouter';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Gift, Heart, Instagram, Menu, Minus, PackageCheck, Phone, Plus, Search,
  ShoppingBag, Sparkles, Star, Store, Truck, UserRound, X, ShieldCheck, SlidersHorizontal,
  LayoutDashboard, Mail, MapPin, Trash2, Wheat, CircleAlert
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Category = 'All' | 'Mithai' | 'Namkeen' | 'Snacks' | 'Gifting';
type Product = {
  id: string; name: string; category: Exclude<Category, 'All'>; price: number; unit: string;
  rating: number; reviews: number; description: string; image: string; badge?: string; variants: string[];
};
type CartLine = { product: Product; variant: string; quantity: number };

const products: Product[] = [
  { id: 'kaju-katli', name: 'Kaju Katli', category: 'Mithai', price: 680, unit: '500 g', rating: 4.9, reviews: 126, badge: 'Best seller', image: '/hero-mithai.jpg', description: 'Silky cashew fudge finished with a whisper of silver leaf. Made in small batches for the perfect melt.', variants: ['250 g', '500 g', '1 kg'] },
  { id: 'motichoor-ladoo', name: 'Motichoor Ladoo', category: 'Mithai', price: 420, unit: '500 g', rating: 4.8, reviews: 89, badge: 'Festive favourite', image: '/ladoo-plate.jpg', description: 'Tiny saffron-hued boondi pearls, slow-cooked and hand-rolled with melon seeds.', variants: ['250 g', '500 g', '1 kg'] },
  { id: 'pista-barfi', name: 'Pista Barfi', category: 'Mithai', price: 560, unit: '500 g', rating: 4.7, reviews: 54, image: '/hero-mithai.jpg', description: 'Pistachio, khoya and cardamom layered into a delicate, nutty barfi.', variants: ['250 g', '500 g', '1 kg'] },
  { id: 'desi-ghee-jalebi', name: 'Desi Ghee Jalebi', category: 'Mithai', price: 290, unit: '500 g', rating: 4.9, reviews: 72, badge: 'Made today', image: '/ladoo-plate.jpg', description: 'Crisp spirals soaked in warm saffron syrup. Best enjoyed the same day.', variants: ['250 g', '500 g'] },
  { id: 'aloo-bhujia', name: 'Aloo Bhujia', category: 'Namkeen', price: 180, unit: '400 g', rating: 4.8, reviews: 108, badge: 'Tea-time hero', image: '/namkeen-bowl.jpg', description: 'Crunchy potato sev with a bright, savoury masala blend — impossible to stop at one handful.', variants: ['200 g', '400 g', '800 g'] },
  { id: 'masala-kaju', name: 'Masala Kaju', category: 'Namkeen', price: 360, unit: '250 g', rating: 4.7, reviews: 43, image: '/namkeen-bowl.jpg', description: 'Roasted cashews tossed in our house chilli, pepper and amchur seasoning.', variants: ['250 g', '500 g'] },
  { id: 'mathri', name: 'Ajwain Mathri', category: 'Snacks', price: 220, unit: '500 g', rating: 4.6, reviews: 38, image: '/namkeen-bowl.jpg', description: 'Flaky, savoury and gently spiced with ajwain. A Sirsa afternoon ritual.', variants: ['250 g', '500 g'] },
  { id: 'shagun-box', name: 'Shagun Box · Golden Edit', category: 'Gifting', price: 1290, unit: '1 box', rating: 4.9, reviews: 31, badge: 'Gift ready', image: '/hero-mithai.jpg', description: 'A celebration-ready assortment of kaju katli, ladoo, pista barfi and premium namkeen.', variants: ['Small · 750 g', 'Large · 1.25 kg'] },
];

const categories: { label: Category; note: string; icon: typeof Gift }[] = [
  { label: 'Mithai', note: 'Soft, fragrant, handmade', icon: Sparkles },
  { label: 'Namkeen', note: 'Crunch for every chai', icon: Wheat },
  { label: 'Snacks', note: 'Old recipes, new cravings', icon: Star },
  { label: 'Gifting', note: 'Send a little celebration', icon: Gift },
];

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

function AppShell() {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try { return JSON.parse(localStorage.getItem('aggarwal-cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('aggarwal-wishlist') || '[]'); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [newsletter, setNewsletter] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { localStorage.setItem('aggarwal-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('aggarwal-wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (product: Product, variant = product.variants[1] || product.variants[0]) => {
    setCart(current => {
      const existing = current.find(line => line.product.id === product.id && line.variant === variant);
      if (existing) return current.map(line => line === existing ? { ...line, quantity: line.quantity + 1 } : line);
      return [...current, { product, variant, quantity: 1 }];
    });
    setDetail(null);
    setCartOpen(true);
  };
  const updateQty = (index: number, delta: number) => setCart(current => current.map((line, i) => i === index ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line).filter(line => line.quantity));
  const toggleWishlist = (id: string) => setWishlist(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <div className="promo-marquee border-b border-primary-foreground/10 bg-primary text-primary-foreground" aria-label="Store promotions">
        <div className="marquee-window">
          <div className="marquee-track promo-track">
            {[0, 1].map(copy => <div className="flex items-center" key={copy} aria-hidden={copy === 1}>
              <span>Fresh batches packed daily in Sirsa</span><i />
              <span>Free local delivery over ₹799</span><i />
              <span>COD available across Sirsa</span><i />
              <span>Order before 4 PM for next-day delivery</span><i />
            </div>)}
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 sm:px-8">
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" data-testid="button-open-menu"><Menu className="size-5" /></button>
          <Link href="/" className="group shrink-0" data-testid="link-home">
            <div className="flex items-center gap-2.5">
              <div className="relative grid size-10 place-items-center rounded-full border-2 border-accent bg-primary text-accent shadow-sm"><Sparkles className="size-5" /></div>
              <div><div className="font-display text-xl font-bold leading-none tracking-tight">Aggarwal</div><div className="font-mono-ui mt-1 text-[9px] uppercase tracking-[.3em] text-secondary">Sweets · Sirsa</div></div>
            </div>
          </Link>
          <nav className={`${menuOpen ? 'absolute left-0 top-full flex w-full flex-col border-b bg-background p-5 shadow-lg' : 'hidden'} gap-5 text-sm font-semibold md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Main navigation">
            <a href="#shop" onClick={() => setMenuOpen(false)} data-testid="link-shop">Shop all</a>
            <a href="#shop" onClick={() => setMenuOpen(false)} data-testid="link-sweets">Sweets</a>
            <a href="#shop" onClick={() => setMenuOpen(false)} data-testid="link-namkeen">Namkeen</a>
            <a href="#gifting" onClick={() => setMenuOpen(false)} data-testid="link-gifting">Gifting</a>
            <a href="#story" onClick={() => setMenuOpen(false)} data-testid="link-story">Our story</a>
            <a href="#visit" onClick={() => setMenuOpen(false)} data-testid="link-visit">Visit us</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href="#shop" className="hidden size-10 place-items-center rounded-full hover:bg-muted sm:grid" aria-label="Search products" data-testid="button-search"><Search className="size-[18px]" /></a>
            <button className="relative grid size-10 place-items-center rounded-full hover:bg-muted" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${itemCount} items`} data-testid="button-open-cart"><ShoppingBag className="size-[19px]" />{itemCount > 0 && <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-secondary text-[9px] font-bold text-white">{itemCount}</span>}</button>
          </div>
        </div>
      </header>
      <div className="benefit-marquee border-b border-primary-foreground/10 bg-secondary text-secondary-foreground" aria-label="Aggarwal Sweets service promises">
        <div className="marquee-window">
          <div className="marquee-track benefit-track">
            {[0, 1].map(copy => <div className="flex items-center" key={copy} aria-hidden={copy === 1}>
              <span><PackageCheck /> Freshly prepared</span><i />
              <span><ShieldCheck /> Lab-tested ingredients</span><i />
              <span><Truck /> On-time local delivery</span><i />
              <span><BadgeCheck /> Easy returns on unopened boxes</span><i />
              <span><Heart /> Made with care in Sirsa</span><i />
            </div>)}
          </div>
        </div>
      </div>

      <main>
        <Hero onShop={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} />
        <TrustStrip />
        <CategoryRail onSelect={(cat) => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} />
        <Shop products={products} wishlist={wishlist} onWishlist={toggleWishlist} onDetail={setDetail} onAdd={addToCart} />
        <Gifting addToCart={addToCart} />
        <Story />
        <Newsletter value={newsletter} setValue={setNewsletter} done={newsletterDone} onSubmit={(event) => { event.preventDefault(); if (newsletter.includes('@')) setNewsletterDone(true); }} />
      </main>
      <Footer />
      {detail && <ProductDrawer product={detail} onClose={() => setDetail(null)} onAdd={addToCart} />}
      {cartOpen && <CartDrawer cart={cart} subtotal={subtotal} updateQty={updateQty} onClose={() => setCartOpen(false)} onCheckout={() => { setCartOpen(false); setCheckout(true); }} />}
      {checkout && <Checkout subtotal={subtotal} onClose={() => setCheckout(false)} onDone={() => { setCheckout(false); setOrdered(true); setCart([]); }} />}
      {ordered && <OrderConfirmation onClose={() => setOrdered(false)} />}
    </div>
  );
}

const heroSlides = [
  {
    id: 'mithai',
    eyebrow: 'Fresh from the counter · Since 1978',
    heading: 'A little',
    highlight: 'mithaas',
    ending: 'goes a long way.',
    description: 'Family recipes, fresh batches, and boxes made to be opened with a smile. Bringing Sirsa’s favourite sweets to your doorstep.',
    image: '/hero-mithai.jpg',
    badge: ['Small', 'batch', 'joy'],
    cta: 'Shop the mithai',
    secondary: 'Find a gift',
  },
  {
    id: 'ladoo',
    eyebrow: 'Festive favourite · Made today',
    heading: 'Bring home',
    highlight: 'the celebration.',
    ending: '',
    description: 'Golden motichoor ladoos, made in small batches and rolled while they are still warm. The sweetest way to mark a special day.',
    image: '/ladoo-plate.jpg',
    badge: ['Made', 'fresh', 'today'],
    cta: 'See bestsellers',
    secondary: 'Gift a box',
  },
  {
    id: 'namkeen',
    eyebrow: 'For chai-time cravings · Sirsa',
    heading: 'Crunchy little',
    highlight: 'reasons to stay.',
    ending: '',
    description: 'From aloo bhujia to ajwain mathri, our savoury counter is full of old recipes, bright spices, and one-more-handful energy.',
    image: '/namkeen-bowl.jpg',
    badge: ['Tea-time', 'hero'],
    cta: 'Shop namkeen',
    secondary: 'Our story',
  },
] as const;

function Hero({ onShop }: { onShop: () => void }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = heroSlides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  const moveSlide = (direction: number) => {
    setActiveSlide(current => (current + direction + heroSlides.length) % heroSlides.length);
  };

  return <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
    <div className="absolute -right-36 -top-36 size-[460px] rounded-full border border-accent/20" /><div className="absolute -right-20 -top-20 size-[300px] rounded-full border border-accent/20" />
    <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:py-24">
      <div className="relative z-10 animate-reveal" key={slide.id}>
        <div className="mb-5 flex items-center gap-3 font-mono-ui text-[10px] uppercase tracking-[.28em] text-accent"><span className="h-px w-8 bg-accent" /> {slide.eyebrow}</div>
        <h1 className="max-w-xl font-display text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl">{slide.heading} <em className="font-normal text-accent">{slide.highlight}</em>{slide.ending && <><br />{slide.ending}</>}</h1>
        <p className="mt-6 max-w-md text-[15px] leading-7 text-primary-foreground/75">{slide.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3"><button onClick={onShop} className="group inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5" data-testid="button-shop-mithai">{slide.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button><a href={slide.id === 'namkeen' ? '#story' : '#gifting'} className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-semibold hover:bg-primary-foreground/10" data-testid="link-gift-guide">{slide.secondary} <Gift className="size-4 text-accent" /></a></div>
        <div className="mt-12 flex items-center gap-7 text-xs text-primary-foreground/60"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> Hygienically packed</span><span className="flex items-center gap-2"><Truck className="size-4 text-accent" /> Local delivery</span></div>
      </div>
      <div className="relative min-h-[320px] animate-reveal delay-2 sm:min-h-[470px]" key={`${slide.id}-image`}>
        <div className="absolute inset-5 rotate-3 rounded-[3rem] bg-accent/20 sm:inset-10" /><div className="absolute inset-2 -rotate-2 overflow-hidden rounded-[3rem] border border-accent/30 shadow-2xl sm:inset-5"><img src={slide.image} alt="Aggarwal Sweets festive selection" className="h-full w-full object-cover transition-opacity duration-500" /></div>
        <div className="animate-drift absolute -bottom-1 left-0 rounded-2xl bg-card px-4 py-3 text-card-foreground shadow-xl sm:bottom-6 sm:left-4"><div className="flex items-center gap-1 text-accent"><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /><Star className="size-3.5 fill-current" /></div><div className="mt-1 font-mono-ui text-[10px] uppercase tracking-wider">Loved across Sirsa</div></div>
        <div className="absolute right-0 top-5 grid size-20 place-items-center rounded-full border border-accent bg-secondary text-center text-[10px] font-bold uppercase leading-tight text-secondary-foreground shadow-lg sm:right-8 sm:top-10">{slide.badge.map(line => <span key={line}>{line}</span>)}</div>
      </div>
    </div>
    <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 pb-8 sm:px-8 sm:pb-10">
      <div className="flex items-center gap-2" aria-label="Choose hero slide">
        {heroSlides.map((item, index) => <button key={item.id} onClick={() => setActiveSlide(index)} className={`hero-dot ${activeSlide === index ? 'is-active' : ''}`} aria-label={`Show slide ${index + 1}: ${item.id}`} aria-current={activeSlide === index ? 'true' : undefined} data-testid={`button-hero-slide-${index + 1}`} />)}
      </div>
      <div className="flex items-center gap-2">
        <span className="mr-2 font-mono-ui text-[10px] tracking-[.2em] text-primary-foreground/60">{String(activeSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}</span>
        <button onClick={() => moveSlide(-1)} className="grid size-9 place-items-center rounded-full border border-primary-foreground/25 transition-colors hover:border-accent hover:text-accent" aria-label="Previous hero slide" data-testid="button-hero-previous"><ChevronLeft className="size-4" /></button>
        <button onClick={() => moveSlide(1)} className="grid size-9 place-items-center rounded-full border border-primary-foreground/25 transition-colors hover:border-accent hover:text-accent" aria-label="Next hero slide" data-testid="button-hero-next"><ChevronRight className="size-4" /></button>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 h-2 w-full bg-accent" />
  </section>;
}

function TrustStrip() {
  return <div className="border-b border-border bg-card"><div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8"><div className="flex items-center gap-3 border-border sm:border-r"><PackageCheck className="size-5 text-secondary" /><div><p className="text-sm font-bold">Freshness, always</p><p className="text-xs text-muted-foreground">Made in small batches</p></div></div><div className="flex items-center gap-3 border-border sm:border-r sm:pl-5"><Banknote className="size-5 text-secondary" /><div><p className="text-sm font-bold">Pay your way</p><p className="text-xs text-muted-foreground">Secure COD at your doorstep</p></div></div><div className="flex items-center gap-3 sm:pl-5"><Phone className="size-5 text-secondary" /><div><p className="text-sm font-bold">Real people, real help</p><p className="text-xs text-muted-foreground">Call us on 01666 234 786</p></div></div></div></div>;
}

function CategoryRail({ onSelect }: { onSelect: (category: Category) => void }) {
  return <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"><div className="mb-8 flex items-end justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">Something for every mood</p><h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Browse by craving</h2></div><a href="#shop" className="hidden items-center gap-2 text-sm font-bold text-secondary sm:flex" data-testid="link-browse-all">Browse all <ArrowRight className="size-4" /></a></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{categories.map(({ label, note, icon: Icon }, i) => <button key={label} onClick={() => onSelect(label)} className={`group relative min-h-[148px] overflow-hidden rounded-2xl border border-border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${i % 2 ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`} data-testid={`button-category-${label.toLowerCase()}`}><div className="absolute -right-5 -top-5 size-28 rounded-full border border-current opacity-20" /><Icon className={`mb-8 size-6 ${i % 2 ? 'text-white' : 'text-accent'}`} /><p className="font-display text-2xl">{label}</p><p className="mt-1 text-xs opacity-70">{note}</p><ArrowRight className="absolute bottom-5 right-5 size-4 opacity-60 transition-transform group-hover:translate-x-1" /></button>)}</div></section>;
}

function Shop({ products: items, wishlist, onWishlist, onDetail, onAdd }: { products: Product[]; wishlist: string[]; onWishlist: (id: string) => void; onDetail: (p: Product) => void; onAdd: (p: Product) => void }) {
  const [category, setCategory] = useState<Category>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const filtered = useMemo(() => items.filter(p => (category === 'All' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0), [items, category, query, sort]);
  return <section id="shop" className="scroll-mt-20 border-y border-border bg-card/50"><div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">The counter is open</p><h2 className="mt-2 font-display text-4xl font-semibold">Made for sharing.</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">The things our regulars take home every week — and every time guests arrive unexpectedly.</p></div><div className="flex w-full items-center gap-2 rounded-full border border-border bg-background px-4 py-3 lg:max-w-xs"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search kaju, ladoo..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search-products" /></div></div><div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><div className="flex gap-1 overflow-auto">{(['All', 'Mithai', 'Namkeen', 'Snacks', 'Gifting'] as Category[]).map(cat => <button key={cat} onClick={() => setCategory(cat)} className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${category === cat ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`} data-testid={`button-filter-${cat.toLowerCase()}`}>{cat}</button>)}</div><label className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><SlidersHorizontal className="size-4" /><select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent py-2 outline-none" aria-label="Sort products" data-testid="select-sort-products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>{filtered.length ? <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{filtered.map(product => <ProductCard key={product.id} product={product} wished={wishlist.includes(product.id)} onWishlist={onWishlist} onDetail={onDetail} onAdd={onAdd} />)}</div> : <div className="mx-auto max-w-md py-20 text-center"><CircleAlert className="mx-auto size-8 text-secondary" /><h3 className="mt-4 font-display text-2xl">Nothing on this tray</h3><p className="mt-2 text-sm text-muted-foreground">Try another sweet name or clear your filters.</p><button onClick={() => { setQuery(''); setCategory('All'); }} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-clear-filters">Clear filters</button></div>}</div></section>;
}

function ProductCard({ product, wished, onWishlist, onDetail, onAdd }: { product: Product; wished: boolean; onWishlist: (id: string) => void; onDetail: (p: Product) => void; onAdd: (p: Product) => void }) {
  return <article className="group relative overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-1 hover:shadow-xl" data-testid={`card-product-${product.id}`}><div className="relative aspect-square cursor-pointer overflow-hidden bg-muted" onClick={() => onDetail(product)}><img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />{product.badge && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 font-mono-ui text-[9px] font-bold uppercase tracking-wider text-accent-foreground">{product.badge}</span>}<button onClick={(e) => { e.stopPropagation(); onWishlist(product.id); }} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/85 backdrop-blur transition-transform hover:scale-110" aria-label={`${wished ? 'Remove' : 'Add'} ${product.name} ${wished ? 'from' : 'to'} wishlist`} data-testid={`button-wishlist-${product.id}`}><Heart className={`size-4 ${wished ? 'fill-secondary text-secondary' : ''}`} /></button></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-display text-lg font-semibold leading-tight">{product.name}</p><p className="mt-1 text-xs text-muted-foreground">{product.unit} · <span className="text-accent-foreground">★ {product.rating}</span></p></div><p className="font-mono-ui text-sm font-bold">{money(product.price)}</p></div><button onClick={() => onAdd(product)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-primary/25 py-2.5 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground" data-testid={`button-add-${product.id}`}><Plus className="size-3.5" /> Add to box</button></div></article>;
}

function Gifting({ addToCart }: { addToCart: (p: Product) => void }) {
  return <section id="gifting" className="scroll-mt-20 bg-secondary text-secondary-foreground"><div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr]"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">For the big little moments</p><h2 className="mt-3 max-w-lg font-display text-4xl leading-tight sm:text-5xl">Don’t just send a gift.<br /><em className="font-normal text-accent">Send a feeling.</em></h2><p className="mt-5 max-w-md text-sm leading-7 text-secondary-foreground/75">From a first visit to a fiftieth anniversary, our boxes carry the warmth of your home — even when home is a few cities away.</p><button onClick={() => addToCart(products.find(p => p.id === 'shagun-box')!)} className="mt-7 inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground" data-testid="button-add-shagun"><Gift className="size-4" /> Add Shagun Box <ArrowRight className="size-4" /></button></div><div className="relative aspect-[1.45] overflow-hidden rounded-[2rem] border border-accent/30"><img src="/hero-mithai.jpg" alt="Festive gift box" className="h-full w-full object-cover" /><div className="absolute bottom-4 left-4 rounded-xl bg-primary/90 px-4 py-3 text-primary-foreground backdrop-blur"><p className="font-display text-lg">The Golden Edit</p><p className="mt-1 font-mono-ui text-[10px] uppercase tracking-wider text-accent">Wrapped with a note</p></div></div></div></section>;
}

function Story() {
  return <section id="story" className="scroll-mt-20 mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div className="relative mx-auto max-w-sm"><div className="absolute -inset-4 rounded-[2rem] border border-secondary/30" /><img src="/ladoo-plate.jpg" alt="Traditional sweets being prepared" className="relative aspect-[.85] w-full rounded-[2rem] object-cover" /><div className="absolute -bottom-5 -right-4 grid size-24 place-items-center rounded-full bg-accent text-center font-display text-lg leading-tight text-accent-foreground shadow-lg">45+<small className="block font-sans text-[9px] font-bold uppercase tracking-wide">years of<br />sweetness</small></div></div><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">The Aggarwal way</p><h2 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-tight sm:text-5xl">Some recipes are measured in grams. Ours are measured in memories.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-muted-foreground">What started as a small counter in the heart of Sirsa in 1978 still begins the same way: good ingredients, patient hands, and a family member tasting the first batch.</p><div className="mt-8 grid max-w-lg grid-cols-2 gap-5 border-t border-border pt-6 sm:grid-cols-3"><div><p className="font-display text-2xl">1978</p><p className="mt-1 text-[11px] text-muted-foreground">Our first batch</p></div><div><p className="font-display text-2xl">18</p><p className="mt-1 text-[11px] text-muted-foreground">Recipes we guard</p></div><div><p className="font-display text-2xl">4.9<span className="text-base">/5</span></p><p className="mt-1 text-[11px] text-muted-foreground">Happy households</p></div></div></div></section>;
}

function Newsletter({ value, setValue, done, onSubmit }: { value: string; setValue: (value: string) => void; done: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <section className="border-y border-border bg-muted/60"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">A sweet note from us</p><h2 className="mt-2 font-display text-3xl font-semibold">Festival dates. Fresh batches. No noise.</h2><p className="mt-2 text-sm text-muted-foreground">Join 1,200+ sweet tooths in the know.</p></div>{done ? <div className="flex items-center gap-3 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="status-newsletter-success"><Check className="size-4 text-accent" /> You’re on the list. See you soon.</div> : <form onSubmit={onSubmit} className="flex w-full max-w-md rounded-full border border-border bg-background p-1.5" data-testid="form-newsletter"><label htmlFor="newsletter-email" className="sr-only">Email address</label><input id="newsletter-email" type="email" required value={value} onChange={e => setValue(e.target.value)} placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" data-testid="input-newsletter-email" /><button className="shrink-0 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-secondary-foreground" data-testid="button-newsletter-submit">Keep me posted</button></form>}</div></section>;
}

function Footer() {
  return <footer id="visit" className="scroll-mt-20 bg-primary text-primary-foreground"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-8"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]"><div><div className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-full border-2 border-accent text-accent"><Sparkles className="size-4" /></div><div className="font-display text-xl">Aggarwal</div></div><p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/60">Sweets that taste like the good news has just arrived.</p><div className="mt-5 flex gap-3"><a href="https://instagram.com" className="grid size-8 place-items-center rounded-full border border-primary-foreground/20" aria-label="Instagram" data-testid="link-instagram"><Instagram className="size-4" /></a><a href="mailto:hello@aggarwalsweets.in" className="grid size-8 place-items-center rounded-full border border-primary-foreground/20" aria-label="Email us" data-testid="link-email"><Mail className="size-4" /></a></div></div><div><p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Shop</p><div className="mt-4 grid gap-3 text-sm text-primary-foreground/65"><a href="#shop">Mithai</a><a href="#shop">Namkeen</a><a href="#gifting">Gifting</a></div></div><div><p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Find us</p><p className="mt-4 text-sm leading-6 text-primary-foreground/65">12, Hissar Road<br />Near Clock Tower, Sirsa<br />Haryana · 125055</p></div><div><p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Come say hello</p><p className="mt-4 text-sm leading-6 text-primary-foreground/65">Open daily · 9:00 AM – 9:30 PM<br />01666 234 786<br />orders@aggarwalsweets.in</p><Link href="/admin" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-accent" data-testid="link-admin-footer">Owner portal <ArrowRight className="size-3" /></Link></div></div><div className="mt-12 flex flex-col justify-between gap-3 border-t border-primary-foreground/15 pt-5 text-[10px] uppercase tracking-widest text-primary-foreground/40 sm:flex-row"><span>© 2024 Aggarwal Sweets, Sirsa</span><span>Made with mithaas</span></div></div></footer>;
}

function ProductDrawer({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (product: Product, variant?: string) => void }) {
  const [variant, setVariant] = useState(product.variants[1] || product.variants[0]);
  return <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm" onMouseDown={onClose}><div className="flex h-full w-full max-w-lg flex-col overflow-auto bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-border px-5 py-4"><span className="font-mono-ui text-[10px] uppercase tracking-widest text-muted-foreground">Product details</span><button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Close product details" data-testid="button-close-product"><X className="size-5" /></button></div><img src={product.image} alt={product.name} className="aspect-square w-full object-cover" /><div className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="font-display text-3xl font-semibold">{product.name}</p><div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><span className="text-accent-foreground">★ {product.rating}</span> · {product.reviews} reviews</div></div><p className="font-mono-ui text-xl font-bold">{money(product.price)}</p></div><p className="mt-5 text-sm leading-7 text-muted-foreground">{product.description}</p><div className="mt-7"><p className="text-xs font-bold uppercase tracking-wider">Choose your box</p><div className="mt-3 flex flex-wrap gap-2">{product.variants.map(item => <button key={item} onClick={() => setVariant(item)} className={`rounded-full border px-4 py-2 text-xs font-bold ${variant === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`} data-testid={`button-variant-${item.replace(/\W/g, '-')}`}>{item}</button>)}</div></div><div className="mt-8 rounded-2xl bg-muted p-4 text-xs text-muted-foreground"><div className="flex items-center gap-2"><Clock3 className="size-4 text-secondary" /><span>Best enjoyed within 7 days · Packed fresh for you</span></div></div><button onClick={() => onAdd(product, variant)} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-add-product-detail"><ShoppingBag className="size-4" /> Add to my box · {money(product.price)}</button></div></div></div>;
}

function CartDrawer({ cart, subtotal, updateQty, onClose, onCheckout }: { cart: CartLine[]; subtotal: number; updateQty: (index: number, delta: number) => void; onClose: () => void; onCheckout: () => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-primary/40 backdrop-blur-sm" onMouseDown={onClose}><div className="flex h-full w-full max-w-md flex-col bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="font-display text-2xl">Your sweet box</p><p className="text-xs text-muted-foreground">{cart.reduce((s, l) => s + l.quantity, 0)} items · packed with care</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Close cart" data-testid="button-close-cart"><X className="size-5" /></button></div>{cart.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><div className="grid size-20 place-items-center rounded-full bg-muted text-secondary"><ShoppingBag className="size-8" /></div><h3 className="mt-5 font-display text-2xl">Your box is waiting</h3><p className="mt-2 text-sm text-muted-foreground">Add something lovely from the counter and it will appear here.</p><button onClick={onClose} className="mt-6 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground" data-testid="button-continue-shopping">Continue shopping</button></div> : <><div className="flex-1 space-y-4 overflow-auto p-5">{cart.map((line, i) => <div key={`${line.product.id}-${line.variant}`} className="flex gap-3" data-testid={`row-cart-${line.product.id}`}><img src={line.product.image} alt="" className="size-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><p className="font-display text-lg">{line.product.name}</p><p className="text-xs text-muted-foreground">{line.variant}</p></div><p className="font-mono-ui text-xs font-bold">{money(line.product.price * line.quantity)}</p></div><div className="mt-3 flex items-center gap-3"><div className="flex items-center rounded-full border border-border"><button onClick={() => updateQty(i, -1)} className="grid size-7 place-items-center" aria-label={`Decrease ${line.product.name}`} data-testid={`button-decrease-${line.product.id}`}><Minus className="size-3" /></button><span className="w-5 text-center text-xs font-bold">{line.quantity}</span><button onClick={() => updateQty(i, 1)} className="grid size-7 place-items-center" aria-label={`Increase ${line.product.name}`} data-testid={`button-increase-${line.product.id}`}><Plus className="size-3" /></button></div><span className="text-[10px] text-muted-foreground">₹{line.product.price} each</span></div></div></div>)}</div><div className="border-t border-border bg-card p-5"><div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-mono-ui font-bold">{money(subtotal)}</span></div><p className="mt-2 text-xs text-muted-foreground">Delivery is free for orders over ₹799 in Sirsa.</p><button onClick={onCheckout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-proceed-checkout">Proceed to checkout <ArrowRight className="size-4" /></button></div></>}</div></div>;
}

function Checkout({ subtotal, onClose, onDone }: { subtotal: number; onClose: () => void; onDone: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) return <div className="fixed inset-0 z-[60] grid place-items-center bg-primary/50 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl"><div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground"><Check className="size-8" /></div><h2 className="mt-5 font-display text-3xl">We’ve got your order.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Our team will call you shortly to confirm delivery. Your sweets will leave our counter fresh.</p><div className="mt-6 rounded-2xl bg-muted p-4 text-left text-xs"><div className="flex justify-between"><span>Order reference</span><b className="font-mono-ui">AGS-{Math.floor(1000 + Math.random() * 8999)}</b></div><div className="mt-2 flex justify-between"><span>Payment</span><b>Cash on delivery</b></div></div><button onClick={onDone} className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-finish-order">Back to the counter</button></div></div>;
  return <div className="fixed inset-0 z-[60] flex justify-end bg-primary/40 backdrop-blur-sm" onMouseDown={onClose}><div className="flex h-full w-full max-w-lg flex-col overflow-auto bg-background shadow-2xl" onMouseDown={e => e.stopPropagation()}><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="font-display text-2xl">Almost there</p><p className="text-xs text-muted-foreground">We deliver across Sirsa and nearby areas</p></div><button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-muted" aria-label="Close checkout" data-testid="button-close-checkout"><X className="size-5" /></button></div><form className="space-y-5 p-5 sm:p-8" onSubmit={e => { e.preventDefault(); setSubmitted(true); }} data-testid="form-checkout"><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="customer-name">Your name</label><input id="customer-name" required className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="The person opening the box" data-testid="input-customer-name" /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="customer-phone">Phone number</label><input id="customer-phone" required type="tel" pattern="[0-9]{10}" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="10 digit mobile number" data-testid="input-customer-phone" /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="customer-address">Delivery address</label><textarea id="customer-address" required rows={3} className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="House number, street, landmark, Sirsa" data-testid="input-customer-address" /></div><div><label className="mb-2 block text-xs font-bold uppercase tracking-wider" htmlFor="delivery-date">Preferred delivery date</label><input id="delivery-date" required type="date" min={new Date().toISOString().split('T')[0]} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-delivery-date" /></div><div className="rounded-2xl bg-muted p-4"><div className="flex justify-between text-sm"><span>Order total</span><b className="font-mono-ui">{money(subtotal)}</b></div><div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Banknote className="size-4 text-secondary" /> Cash on delivery · no advance payment</div></div><button className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-4 text-sm font-bold text-secondary-foreground" data-testid="button-place-order">Place COD order <Check className="size-4" /></button></form></div></div>;
}

function OrderConfirmation({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-primary/50 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-background p-8 text-center shadow-2xl"><div className="mx-auto grid size-16 place-items-center rounded-full bg-accent text-accent-foreground"><Gift className="size-8" /></div><h2 className="mt-5 font-display text-3xl">See you at the door.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Your order has been noted. Thank you for keeping a local sweet tradition alive.</p><button onClick={onClose} className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground" data-testid="button-close-confirmation">Keep browsing</button></div></div>;
}

function AdminPage() {
  const [location, setLocation] = useLocation();
  return <div className="min-h-[100dvh] bg-primary text-primary-foreground"><div className="mx-auto max-w-7xl px-5 py-6 sm:px-8"><div className="flex items-center justify-between"><Link href="/" className="flex items-center gap-3" data-testid="link-admin-home"><div className="grid size-10 place-items-center rounded-full border-2 border-accent text-accent"><Sparkles className="size-5" /></div><div><div className="font-display text-xl">Aggarwal</div><div className="font-mono-ui text-[9px] uppercase tracking-widest text-accent">Owner workspace</div></div></Link><button onClick={() => setLocation('/')} className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-4 py-2 text-xs font-bold" data-testid="button-exit-admin"><Store className="size-3.5" /> View storefront</button></div><div className="grid gap-10 py-16 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-accent">Owner portal preview</p><h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">Your sweet shop,<br /><em className="font-normal text-accent">at a glance.</em></h1><p className="mt-6 max-w-md text-sm leading-7 text-primary-foreground/65">A home for the people behind the counter. Track orders, keep the catalogue fresh, and see what Sirsa is loving today.</p><div className="mt-8 flex flex-wrap gap-3"><button className="rounded-full bg-accent px-5 py-3 text-xs font-bold text-accent-foreground" data-testid="button-admin-signin">Sign in to dashboard</button><Link href="/" className="rounded-full border border-primary-foreground/25 px-5 py-3 text-xs font-bold" data-testid="link-admin-storefront">Explore storefront</Link></div></div><div className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 shadow-2xl"><div className="flex items-center justify-between border-b border-primary-foreground/10 px-3 pb-4"><span className="font-display text-xl">Good morning, Aggarwal family</span><span className="rounded-full bg-accent px-2 py-1 font-mono-ui text-[9px] font-bold text-accent-foreground">LIVE PREVIEW</span></div><div className="grid gap-3 py-4 sm:grid-cols-3"><div className="rounded-2xl bg-accent p-4 text-accent-foreground"><p className="text-[10px] font-bold uppercase tracking-wider">Today’s orders</p><p className="mt-4 font-display text-4xl">28</p><p className="mt-1 text-xs opacity-70">+6 since yesterday</p></div><div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">Counter sales</p><p className="mt-4 font-display text-4xl">₹18.4k</p><p className="mt-1 text-xs text-primary-foreground/50">This week</p></div><div className="rounded-2xl bg-primary-foreground/10 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/50">Top sweet</p><p className="mt-4 font-display text-2xl">Kaju Katli</p><p className="mt-1 text-xs text-primary-foreground/50">126 orders</p></div></div><div className="rounded-2xl bg-primary-foreground/10 p-4"><div className="flex items-center justify-between text-xs"><span className="font-bold">Recent orders</span><span className="text-accent">View all</span></div>{['#AGS-2841 · Shagun Box', '#AGS-2840 · Motichoor Ladoo', '#AGS-2839 · Aloo Bhujia'].map((item, i) => <div key={item} className="flex items-center justify-between border-b border-primary-foreground/10 py-3 text-xs last:border-0"><span className="text-primary-foreground/70">{item}</span><span className="flex items-center gap-1.5 text-accent"><BadgeCheck className="size-3.5" /> {i === 0 ? 'Packing' : 'Confirmed'}</span></div>)}</div></div></div></div></div>;
}

function Router() {
  return <Switch><Route path="/admin" component={AdminPage} /><Route path="/" component={AppShell} /><Route component={NotFound} /></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;