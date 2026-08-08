--
-- PostgreSQL database dump
--

\restrict 9jud591fXIRMrc1THTsd1B7fgu0LA4ovg9u6tccU1maR2nSB6et61BlgwJtrqdY

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text DEFAULT ''::text NOT NULL,
    date text NOT NULL,
    read_time text DEFAULT '3 min'::text NOT NULL,
    category text DEFAULT 'General'::text NOT NULL,
    image text DEFAULT '/hero-mithai.jpg'::text NOT NULL,
    body jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: coupon_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_codes (
    code text NOT NULL,
    type text DEFAULT 'percent'::text NOT NULL,
    value integer NOT NULL,
    min_order integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text DEFAULT ''::text NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    email text NOT NULL,
    name text,
    joined_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text NOT NULL,
    date text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL,
    subtotal integer NOT NULL,
    status text DEFAULT 'Confirmed'::text NOT NULL,
    customer_email text,
    items jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otp_codes (
    id text NOT NULL,
    email text NOT NULL,
    code text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_reviews (
    id text NOT NULL,
    product_id text NOT NULL,
    customer_name text NOT NULL,
    rating integer DEFAULT 5 NOT NULL,
    comment text DEFAULT ''::text NOT NULL,
    approved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    price integer NOT NULL,
    unit text NOT NULL,
    badge text,
    description text DEFAULT ''::text NOT NULL,
    image text DEFAULT '/hero-mithai.jpg'::text NOT NULL,
    rating real DEFAULT 4.5 NOT NULL,
    reviews integer DEFAULT 0 NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    variants jsonb DEFAULT '[]'::jsonb NOT NULL
);


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_settings (key, value) FROM stdin;
craving_categories	[{"label":"Mithai","note":"Soft, fragrant, handmade","image":"/hero-mithai.jpg"},{"label":"Namkeen","note":"Crunch for every chai","image":"/namkeen-bowl.jpg"},{"label":"Snacks","note":"Old recipes, new cravings","image":"/ladoo-plate.jpg"},{"label":"Gifting","note":"Send a little celebration","image":"/hero-mithai.jpg"}]
categories_master	[{"id":"mithai","label":"Mithai","note":"Soft, fragrant, handmade","image":"/hero-mithai.jpg","inMenu":true,"inCraving":true},{"id":"namkeen","label":"Namkeen","note":"Crunch for every chai","image":"/namkeen-bowl.jpg","inMenu":true,"inCraving":true},{"id":"snacks","label":"Snacks","note":"Old recipes, new cravings","image":"/ladoo-plate.jpg","inMenu":true,"inCraving":true},{"id":"gifting","label":"Gifting","note":"Send a little celebration","image":"/hero-mithai.jpg","inMenu":true,"inCraving":true}]
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (id, slug, title, excerpt, date, read_time, category, image, body) FROM stdin;
history-of-kaju-katli	history-of-kaju-katli	The Silver Story: How Kaju Katli Became India's Favourite Mithai	From royal kitchens to neighbourhood sweet shops — tracing the journey of the most gifted sweet in India.	July 2025	4 min	Heritage	/hero-mithai.jpg	["Kaju Katli is not just a sweet — it is a cultural shorthand for celebration.", "The origins are traced to the royal kitchens of Rajasthan.", "At Aggarwal Sweets, we have been making kaju katli the same way since 1978."]
ghee-vs-oil	ghee-vs-oil	Desi Ghee vs Oil in Sweets: What Actually Changes the Flavour?	Our head mithai maker breaks down why ghee isn't just a tradition — it's the reason the barfi melts just right.	June 2025	3 min	Craft	/ladoo-plate.jpg	["We get asked this question at least once a week: Do you use real ghee, or is it oil?", "Ghee has a higher smoke point than most cooking oils.", "Switching to oil would shave about 15% off our raw material cost. We never tried again."]
festive-gifting-guide	festive-gifting-guide	2025 Festive Gifting Guide: What to Send, How Much, and When	A practical guide from the Aggarwal family — how to pick a box that says exactly the right thing.	May 2025	5 min	Guide	/hero-mithai.jpg	["Gifting sweets sounds straightforward until you are standing in front of a counter.", "Too little means sending a 250g box for an occasion that warrants 500g or more.", "One final note: the box matters."]
tea-time-namkeen	tea-time-namkeen	Five Namkeens That Belong Next to Your Evening Chai	From bhujia to mathri, we rank the snacks that have earned a permanent spot on the tea tray.	April 2025	3 min	Food	/namkeen-bowl.jpg	["Evening chai is non-negotiable in most North Indian homes.", "1. Aloo Bhujia. The undisputed king.", "2. Mathri. Flaky, ghee-rich, and sturdy enough to scoop pickle."]
motichoor-ladoo-story	motichoor-ladoo-story	Motichoor Ladoo: The Sweet That Crosses Every Occasion	Why this small, grainy orange ball shows up at births, weddings, and temple offerings alike.	March 2025	4 min	Heritage	/ladoo-plate.jpg	["Ask any North Indian family to name one sweet and the answer is almost always motichoor ladoo.", "The name comes from the tiny boondi pearls: moti (pearl) + choor (crumbled).", "At temples across Haryana and Rajasthan, motichoor ladoo is the prasad of choice."]
store-mithai-at-home	store-mithai-at-home	How to Store Mithai at Home Without Losing Freshness	The five most common mistakes people make after bringing home a box of sweets.	February 2025	3 min	Tips	/hero-mithai.jpg	["You have bought a beautiful box of sweets.", "Mistake 1: Refrigerating everything.", "Mistake 5: Waiting too long. Eat mithai fresh."]
\.


--
-- Data for Name: coupon_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupon_codes (code, type, value, min_order, active, description) FROM stdin;
SWEET10	percent	10	599	t	
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (email, name, joined_at) FROM stdin;
nareninsa1@gmail.com	\N	2026-08-08 22:38:11.646444
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, date, phone, address, subtotal, status, customer_email, items) FROM stdin;
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otp_codes (id, email, code, expires_at, used, created_at) FROM stdin;
49780a43-6f97-4cc7-b97b-f96929719e47	narenderpalsachdeva@gmail.com	443260	2026-08-08 22:39:02.701	f	2026-08-08 22:29:02.71661
37f3d470-2dd4-407b-a0ac-0348e14a4a86	narenderpalsachdeva@gmail.com	670369	2026-08-08 22:40:54.445	f	2026-08-08 22:30:54.460686
bca154ab-2989-43db-8701-fae1736022b8	narenderpalsachdeva@gmail.com	531919	2026-08-08 22:42:39.142	f	2026-08-08 22:32:39.159188
f84d973c-1b69-4b1b-a62f-56df54c3e3fc	narenderpalsachdeva@gmail.com	319071	2026-08-08 22:45:02.045	f	2026-08-08 22:35:02.063256
c1e3002f-64c0-456e-9e8c-bedb4dc89dc8	nareninsa1@gmail.com	282322	2026-08-08 22:47:39.734	t	2026-08-08 22:37:39.751622
\.


--
-- Data for Name: product_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_reviews (id, product_id, customer_name, rating, comment, approved, created_at) FROM stdin;
kr-01	kaju-katli	Priya Sharma	5	Absolutely melt-in-the-mouth quality. The silver varq on top makes it so elegant. Ordered for Diwali and everyone loved it!	t	2026-07-25 22:52:30.942969
kr-02	kaju-katli	Ramesh Agarwal	5	Best kaju katli in Sirsa. Perfectly thin, not too sweet, and the ghee flavour is just right.	t	2026-07-28 22:52:34.553182
kr-03	kaju-katli	Sunita Verma	4	Very fresh and tasty. I bought 500g and it was gone in two days! Will definitely order again.	t	2026-07-21 22:52:37.752925
kr-04	kaju-katli	Vikram Singh	5	Gifted this to my in-laws and they called immediately to ask where I bought it from. Top quality.	t	2026-07-19 22:52:41.170951
kr-05	kaju-katli	Neha Gupta	5	Smooth texture, perfect sweetness. Our go-to mithai for every celebration now.	t	2026-08-08 22:52:44.335988
kr-06	kaju-katli	Deepak Bansal	4	Genuinely good quality cashew katli. Not overly sweet which I really appreciate.	t	2026-08-04 22:52:48.85495
kr-07	kaju-katli	Kavita Joshi	5	The katli was perfect for my son's birthday. Beautiful packaging, even better taste.	t	2026-07-19 22:52:52.03883
kr-08	kaju-katli	Mohan Lal	5	Pure desi ghee taste is clearly there. No artificial flavour at all. Will keep coming back.	t	2026-08-04 22:52:55.464756
kr-09	kaju-katli	Anita Mittal	4	A little pricey but worth every rupee for the quality. Very good mithai.	t	2026-07-20 22:52:58.62854
kr-10	kaju-katli	Rajesh Kumar	5	Freshness is unmatched. Aggarwal Sweets kaju katli is on another level compared to others.	t	2026-07-26 22:53:02.034165
kr-11	kaju-katli	Pooja Rani	5	Ordered 1 kg for a puja function. Guests kept asking for more. Simply outstanding.	t	2026-07-19 22:53:05.191019
kr-12	kaju-katli	Suresh Tyagi	4	Good quality and proper weight given. Delivery was on time. No complaints.	t	2026-08-01 22:53:08.580496
kr-13	kaju-katli	Meena Chauhan	5	Perfect diamond cut, beautiful silver coating. Tastes as good as it looks.	t	2026-07-17 22:53:11.757066
kr-14	kaju-katli	Arun Yadav	5	My children absolutely love this. We buy it almost every week now!	t	2026-07-23 22:53:15.159303
kr-15	kaju-katli	Shanti Devi	4	Very nice kaju katli. Fresh and soft. Exactly what I expected from such a reputed shop.	t	2026-08-02 22:53:18.31763
ml-01	motichoor-ladoo	Savita Rao	5	Finest motichoor ladoo I have tasted. Tiny boondi pearls, perfectly soft with a hint of saffron. Outstanding.	t	2026-07-28 22:53:21.757121
ml-02	motichoor-ladoo	Harish Patel	5	Ordered for Ganesh Chaturthi. Everyone appreciated the quality. Melts in the mouth instantly.	t	2026-07-11 22:53:24.916236
ml-03	motichoor-ladoo	Pushpa Devi	4	Very fresh. Not too sweet. The saffron flavour is subtle and lovely.	t	2026-07-13 22:53:28.356778
ml-04	motichoor-ladoo	Sanjay Mehta	5	My mother said these remind her of the ladoos from her childhood. Highest compliment possible!	t	2026-07-11 22:53:31.54786
ml-05	motichoor-ladoo	Rekha Sharma	5	Soft, fragrant, perfectly round. Gift-ready quality without even asking. Love it.	t	2026-07-29 22:53:35.013197
ml-06	motichoor-ladoo	Manoj Kumar	4	Very tasty and fresh. Bought 500g and wished I had bought 1 kg. Next time for sure.	t	2026-07-16 22:53:38.213762
ml-07	motichoor-ladoo	Lata Singh	5	Absolutely delightful. The texture is so delicate — clearly made by skilled hands.	t	2026-08-05 22:53:41.632043
ml-08	motichoor-ladoo	Gopal Das	4	Good ladoo with proper ghee. I could taste the quality of ingredients clearly.	t	2026-08-03 22:53:44.831072
ml-09	motichoor-ladoo	Indira Batra	5	Been a customer here for years. The motichoor ladoo is always consistent and delicious.	t	2026-07-24 22:53:48.251
ml-10	motichoor-ladoo	Ravi Shankar	5	Brought for my daughter's mundan ceremony. Guests were very impressed. Highly recommend.	t	2026-07-21 22:53:51.427833
pb-01	pista-barfi	Kamla Soni	5	Beautiful green colour and rich pistachio flavour. Perfect for gifting.	t	2026-07-15 22:53:54.868586
pb-02	pista-barfi	Naresh Arora	4	Very nice barfi. Good amount of pistachios on top. Not too sweet which I like.	t	2026-08-02 22:53:58.0585
pb-03	pista-barfi	Usha Goel	5	Bought for a family function. The layering of pista and khoya is done perfectly. Loved it.	t	2026-07-17 22:54:01.491015
pb-04	pista-barfi	Dinesh Khatri	4	Good flavour. The cardamom is subtle and not overpowering. Fresh batch confirmed.	t	2026-07-15 22:54:04.660858
pb-05	pista-barfi	Ritu Malhotra	5	Simply beautiful barfi. My guests thought it was from a fancy store!	t	2026-07-19 22:54:08.122774
pb-06	pista-barfi	Amit Jain	5	Rich pista flavour with soft khoya base. Top-tier mithai. Worth every paisa.	t	2026-07-19 22:54:11.622316
pb-07	pista-barfi	Geeta Nanda	4	Fresh and tasty. Proper pistachio taste — not just colour. Good portion size too.	t	2026-07-15 22:54:15.042761
pb-08	pista-barfi	Bharat Chopra	5	My family's new favourite. We order pista barfi every time we visit Aggarwal Sweets.	t	2026-08-07 22:54:18.323341
jl-01	desi-ghee-jalebi	Champa Devi	5	Crispy outside, soft inside, perfectly soaked in saffron syrup. Best jalebi in all of Sirsa!	t	2026-07-29 22:54:21.865772
jl-02	desi-ghee-jalebi	Surender Pal	5	Made today and it shows — incredibly fresh and crunchy. The desi ghee aroma is wonderful.	t	2026-07-18 22:54:25.058272
jl-03	desi-ghee-jalebi	Bimla Rani	4	Very good jalebi. The right amount of syrup — not dripping but nicely soaked.	t	2026-08-03 22:54:28.488444
jl-04	desi-ghee-jalebi	Prakash Walia	5	Hot jalebi with cold rabri is a dream. The quality here is truly authentic.	t	2026-07-10 22:54:31.655409
jl-05	desi-ghee-jalebi	Saroj Kumari	5	My husband is very particular about jalebi and said this is the best in years. High praise!	t	2026-07-19 22:54:35.143688
jl-06	desi-ghee-jalebi	Tilak Raj	4	Good crispy jalebi. Properly made with desi ghee. You can definitely tell the difference.	t	2026-08-04 22:54:38.310584
jl-07	desi-ghee-jalebi	Pushpa Lata	5	Ordered fresh batch for morning breakfast. Arrived still warm. Absolutely delightful.	t	2026-07-13 22:54:42.87804
jl-08	desi-ghee-jalebi	Om Prakash	5	The saffron colour is natural and the taste is divine. This is what real jalebi tastes like.	t	2026-08-04 22:54:46.052835
jl-09	desi-ghee-jalebi	Vimla Sharma	4	Nice and crunchy. Good sweetness level. Perfect with a cup of chai.	t	2026-07-24 22:54:49.50197
ab-01	aloo-bhujia	Balvinder Kaur	5	Perfect tea-time snack. Crispy, spicy, and you simply cannot stop eating. Already ordered a second pack.	t	2026-07-10 22:54:52.665442
ab-02	aloo-bhujia	Kuldeep Sethi	4	Very tasty bhujia. Good spice level — not too hot. My whole family loves it with evening chai.	t	2026-07-10 22:54:56.076209
ab-03	aloo-bhujia	Santosh Bedi	5	Fresh and crunchy. The masala blend is spot on — tangy and savoury. 10 out of 10.	t	2026-07-23 22:54:59.282816
ab-04	aloo-bhujia	Jagdish Lal	4	Good quality namkeen. Proper potato taste. Not overly oily which is a plus.	t	2026-07-12 22:55:02.699206
ab-05	aloo-bhujia	Manjit Kaur	5	Best bhujia I have had outside of Bikaner. Seriously impressive for a local sweet shop.	t	2026-07-19 22:55:05.868431
ab-06	aloo-bhujia	Roshan Lal	5	Addictive! Light crunch and perfect seasoning. Dangerous to have around — in the best way.	t	2026-07-18 22:55:09.297791
mk-01	masala-kaju	Harpreet Gill	5	Perfectly roasted with the right amount of chilli. The amchur gives a lovely tang. Outstanding.	t	2026-07-13 22:55:12.465201
mk-02	masala-kaju	Seema Kapoor	4	Good quality cashews with nice spice coating. Great for guests and parties.	t	2026-07-10 22:55:16.651382
mk-03	masala-kaju	Vinod Khanna	5	These disappear from the bowl within minutes at any gathering. Always buy extra now.	t	2026-07-25 22:55:19.854482
mk-04	masala-kaju	Paramjit Singh	4	Nice crunch and good spice. Cashews are fresh and large. Will order again.	t	2026-07-30 22:55:23.285376
mk-05	masala-kaju	Annapurna Devi	5	My son loves these with his evening tea. The pepper and chilli balance is really well done.	t	2026-07-27 22:55:26.475838
am-01	mathri	Kiran Bala	5	Flaky, crispy and beautifully spiced with ajwain. Proper homestyle mathri, just like my grandmother made.	t	2026-08-08 22:55:29.942003
am-02	mathri	Tarsem Lal	4	Good mathri. The ajwain flavour is authentic and not overpowering. Perfect with chai.	t	2026-08-02 22:55:33.102875
am-03	mathri	Sudha Aggarwal	5	Ordered 500g and finished it in two days. The flaky layers are perfect. Will always keep these at home.	t	2026-07-29 22:55:36.535198
am-04	mathri	Gurnam Singh	4	Tasty mathri. Good crunch and nice savoury flavour. Not too oily which is a plus.	t	2026-08-01 22:55:39.767391
am-05	mathri	Vidya Sagar	5	The best mathri in Sirsa hands down. Fresh, crunchy, and perfectly seasoned. A must buy.	t	2026-08-03 22:55:43.21139
am-06	mathri	Asha Rani	4	Nice traditional mathri. Good shelf life too — stayed crunchy for over a week.	t	2026-07-23 22:55:46.389656
am-07	mathri	Rajinder Kumar	5	Authentic recipe with great texture. The ajwain seeds are clearly visible and add wonderful flavour.	t	2026-07-21 22:55:49.817546
sb-01	shagun-box	Tanvir Ahmed	5	Gifted to my neighbour on their housewarming. They were absolutely delighted. Box presentation is stunning.	t	2026-07-28 22:55:52.974741
sb-02	shagun-box	Nirmala Choudhary	5	Perfect festive gift. Beautiful packaging with an assortment of the finest mithai. Will order every season.	t	2026-07-13 22:55:56.637744
sb-03	shagun-box	Surjit Sandhu	4	Great gift box. Good variety of sweets inside, all fresh. The golden box is quite elegant.	t	2026-07-21 22:55:59.813417
sb-04	shagun-box	Geeta Arora	5	Bought for my sister's wedding anniversary. She loved it. Perfect combination of quality and presentation.	t	2026-08-05 22:56:03.47984
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, category, price, unit, badge, description, image, rating, reviews, tags, variants) FROM stdin;
kaju-katli	Kaju Katli	Mithai	340	250 gm	Best seller	Silky cashew fudge finished with a whisper of silver leaf.	/product-kaju-katli.jpg	4.9	15	["kaju-sweets", "barfi-halwa", "festive-specials"]	[{"price": 340, "weight": "250 gm", "material": "Pure desi ghee"}, {"price": 680, "weight": "500 gm", "material": "Pure desi ghee"}, {"price": 1320, "weight": "1 kg", "material": "Pure desi ghee"}]
motichoor-ladoo	Motichoor Ladoo	Mithai	220	250 gm	Festive favourite	Tiny saffron-hued boondi pearls, slow-cooked and hand-rolled.	/product-motichoor-ladoo.jpg	4.8	10	["ladoo-laddus", "festive-specials"]	[{"price": 220, "weight": "250 gm", "material": "Desi ghee"}, {"price": 420, "weight": "500 gm", "material": "Desi ghee"}, {"price": 800, "weight": "1 kg", "material": "Desi ghee"}]
pista-barfi	Pista Barfi	Mithai	280	250 gm	\N	Pistachio, khoya and cardamom layered into a delicate barfi.	/product-pista-barfi.jpg	4.7	8	["barfi-halwa", "milk-sweets"]	[{"price": 280, "weight": "250 gm", "material": "Pure desi ghee"}, {"price": 560, "weight": "500 gm", "material": "Pure desi ghee"}, {"price": 1080, "weight": "1 kg", "material": "Pure desi ghee"}]
desi-ghee-jalebi	Desi Ghee Jalebi	Mithai	150	250 gm	Made today	Crisp spirals soaked in warm saffron syrup.	/product-jalebi.jpg	4.9	9	["ghee-sweets", "festive-specials"]	[{"price": 150, "weight": "250 gm", "material": "Desi ghee"}, {"price": 290, "weight": "500 gm", "material": "Desi ghee"}]
aloo-bhujia	Aloo Bhujia	Namkeen	95	200 gm	Tea-time hero	Crunchy potato sev with a bright, savoury masala blend.	/product-aloo-bhujia.jpg	4.8	6	["bhujia-sev"]	[{"price": 95, "weight": "200 gm", "material": "Groundnut oil"}, {"price": 180, "weight": "400 gm", "material": "Groundnut oil"}, {"price": 340, "weight": "800 gm", "material": "Groundnut oil"}]
masala-kaju	Masala Kaju	Namkeen	190	150 gm	\N	Roasted cashews tossed in house chilli, pepper and amchur.	/product-masala-kaju.jpg	4.7	5	["roasted-nuts"]	[{"price": 190, "weight": "150 gm", "material": "Roasted & spiced"}, {"price": 360, "weight": "250 gm", "material": "Roasted & spiced"}, {"price": 700, "weight": "500 gm", "material": "Roasted & spiced"}]
mathri	Ajwain Mathri	Snacks	120	250 gm	\N	Flaky, savoury and gently spiced with ajwain.	/product-mathri.jpg	4.6	7	["mathri-crackers", "tea-time-snacks", "spiced-snacks"]	[{"price": 120, "weight": "250 gm", "material": "Traditional"}, {"price": 220, "weight": "500 gm", "material": "Traditional"}, {"price": 420, "weight": "1 kg", "material": "Traditional"}]
shagun-box	Shagun Box · Golden Edit	Gifting	690	750 gm	Gift ready	A celebration-ready assortment of kaju katli, ladoo, pista barfi.	/product-shagun-box.jpg	4.9	4	["festival-boxes", "corporate-gifts", "personal-gifts"]	[{"price": 690, "weight": "750 gm", "material": "Classic assortment"}, {"price": 1290, "weight": "1.25 kg", "material": "Classic assortment"}, {"price": 1980, "weight": "2 kg", "material": "Classic assortment"}]
\.


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (key);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: coupon_codes coupon_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_pkey PRIMARY KEY (code);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (email);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9jud591fXIRMrc1THTsd1B7fgu0LA4ovg9u6tccU1maR2nSB6et61BlgwJtrqdY

