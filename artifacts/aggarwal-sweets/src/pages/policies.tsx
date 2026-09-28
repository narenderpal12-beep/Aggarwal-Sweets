import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const policyLinks = [
  { href: "/policies/returns-cancellation", label: "Returns & Cancellation" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms & Conditions" },
];

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl text-primary">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-foreground/80">{children}</div>
    </section>
  );
}

function PolicyPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 lg:py-16">
      <header className="rounded-3xl border border-border bg-card px-6 py-8 shadow-sm sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.25em] text-secondary">
            Aggarwal Sweets Sirsa · Policies
          </p>
          <Link href="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Back to shop
          </Link>
        </div>
        <h1 className="mt-4 font-display text-4xl text-primary sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{intro}</p>
        <p className="mt-4 text-xs text-muted-foreground">Last updated: 27 September 2026</p>
      </header>

      <nav aria-label="Store policies" className="mt-6 flex flex-wrap gap-2">
        {policyLinks.map(policy => (
          <Link
            key={policy.href}
            href={policy.href}
            aria-current={location === policy.href ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              location === policy.href
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-primary/40"
            }`}
          >
            {policy.label}
          </Link>
        ))}
      </nav>

      <aside className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        These policies provide general information and are not legal advice. Nothing here removes consumer rights that cannot be limited by law. Please consult a qualified lawyer for advice about a specific legal matter.
      </aside>

      <article className="mt-10 space-y-9">{children}</article>

      <div className="mt-12 rounded-2xl bg-muted/60 p-6 text-sm leading-6 text-muted-foreground">
        Questions about these policies? Contact{" "}
        <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:Aggarwalsweetssirsa@gmail.com">
          Aggarwalsweetssirsa@gmail.com
        </a>{" "}
        or call{" "}
        <a className="font-semibold text-primary underline-offset-4 hover:underline" href="tel:+919671500121">
          +91 96715 00121
        </a>
        .
      </div>
    </main>
  );
}

export function ReturnsCancellationPage() {
  return (
    <PolicyPage
      title="Returns & Cancellation"
      intro="We prepare and pack food orders for freshness. This policy explains how to contact us about a cancellation, delivery problem, or product issue."
    >
      <PolicySection title="Order cancellations">
        <p>
          Orders are sent for processing promptly. Once an order is confirmed and preparation or dispatch has started, it generally cannot be cancelled. If you need to change or stop an order, contact us immediately with your order number. We will confirm whether it can still be stopped; a request is not cancelled until we confirm it.
        </p>
        <p>
          We may decline or cancel an order if a product is unavailable, delivery cannot be completed, payment is not confirmed, or we reasonably suspect fraud or misuse. If we cancel an order after an online payment has been taken, we will arrange an eligible refund to the original payment method, subject to applicable law and payment-provider processing times. Any alternative such as store credit will be offered only with your agreement and with its terms stated when issued.
        </p>
      </PolicySection>

      <PolicySection title="Returns and product concerns">
        <p>
          Unopened boxes in their original, undamaged packaging may be returned. Contact us with your order number before bringing or sending an item back so we can confirm the return arrangements. Opened food packages are not accepted for change-of-mind returns because our products are perishable.
        </p>
        <p>
          If an item is missing, incorrect, damaged, or appears spoiled or otherwise unsuitable, contact us as soon as possible. Include your order number and a clear description; photos can help us review the issue.
        </p>
        <p>
          We will review the order and, where appropriate, arrange a replacement or refund in line with applicable law. Please do not consume a product you believe may be unsafe, and keep its packaging where possible while we review your report. This policy does not limit any consumer or food-safety rights that cannot be waived.
        </p>
      </PolicySection>

      <PolicySection title="Delivery delays">
        <p>
          Delivery estimates may change because of weather, traffic, courier conditions, or other events outside our reasonable control. If your order is delayed after dispatch, contact us and we will help check its status. Nothing in this section removes rights available to you under applicable law.
        </p>
      </PolicySection>

      <PolicySection title="Contact us">
        <p>
          For a cancellation request or product concern, contact Aggarwal Sweets Sirsa at{" "}
          <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:Aggarwalsweetssirsa@gmail.com">
            Aggarwalsweetssirsa@gmail.com
          </a>{" "}
          or call{" "}
          <a className="font-semibold text-primary underline-offset-4 hover:underline" href="tel:+919671500121">
            +91 96715 00121
          </a>
          . Please include your order number.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="This policy explains how Aggarwal Sweets Sirsa collects, uses, and shares information when you browse the store, create an account, or place an order."
    >
      <PolicySection title="Who operates the store">
        <p>
          Aggarwal Sweets Sirsa is operated by Nirmal Kumar Kandoi, proprietor of Aggarwal Sweets, at Bhadra Bazar, Sirsa, Haryana 125055, India. For privacy questions or requests, use the contact details at the end of this policy.
        </p>
      </PolicySection>

      <PolicySection title="Information we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account and contact details you provide, such as your name, email address, and phone number.</li>
          <li>Delivery details, including the address and instructions needed to fulfil an order.</li>
          <li>Order information, such as products, quantities, prices, coupon use, delivery details, and order history.</li>
          <li>Payment-related records, such as payment method, amount, status, and transaction references. Online payments are processed by Razorpay; we do not ask you to send us your card number, security code, or UPI PIN.</li>
          <li>Reviews or other information you choose to submit, including the name, rating, and comments attached to a product review.</li>
          <li>Basic technical and diagnostic information generated when the site is used, which may be used to keep the service secure and troubleshoot errors.</li>
        </ul>
      </PolicySection>

      <PolicySection title="How we use information">
        <p>
          We use information to create and secure accounts, send one-time sign-in codes, confirm and fulfil orders, coordinate delivery, process payments and refunds, respond to customer requests, prevent fraud or misuse, maintain business and tax records, and operate and improve the store.
        </p>
      </PolicySection>

      <PolicySection title="Browser storage and cookies">
        <p>
          The store uses an essential signed session cookie to keep you signed in. Your browser may also store practical preferences such as your cart, wishlist, or a saved delivery address so they remain available when you return. These features are not used to build advertising profiles. You can clear browser storage in your browser settings, though doing so may remove saved cart or account-display information.
        </p>
      </PolicySection>

      <PolicySection title="When information is shared">
        <p>
          We do not sell your personal information. We share only what is reasonably needed to operate the store, including with:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Razorpay, to process online payments and payment-related updates.</li>
          <li>Google/Gmail and our email-delivery service, to send sign-in codes and order messages.</li>
          <li>Website hosting, database, and technical service providers that help run and secure the store.</li>
          <li>Our authorised staff and delivery personnel, where needed to prepare and deliver your order or assist you.</li>
          <li>Authorities or other parties where disclosure is required by law or reasonably necessary to protect people, the store, or legal rights.</li>
        </ul>
        <p>
          Service providers may process information under their own privacy terms and the arrangements applicable to their services. We do not currently use third-party advertising cookies or ad-network tracking on this website.
        </p>
      </PolicySection>

      <PolicySection title="Retention and security">
        <p>
          We keep information for as long as needed to provide the store, manage orders and customer requests, meet legal and accounting obligations, and address disputes. We use reasonable administrative and technical safeguards, but no online transmission or storage method can be guaranteed to be completely secure.
        </p>
      </PolicySection>

      <PolicySection title="Your choices and requests">
        <p>
          You can contact us to ask to access or correct your account details, or to request deletion of information that we are not required to retain. We may need to verify your identity and keep limited transaction records where required by law. You can also clear non-essential saved browser data through your browser settings.
        </p>
      </PolicySection>

      <PolicySection title="Children and policy updates">
        <p>
          The store is intended for people who can place an order under applicable law. If you are under 18, use the store with a parent or legal guardian, who should place or supervise the order. We do not knowingly seek personal information directly from children.
        </p>
        <p>
          We may update this policy when our practices or legal requirements change. The current version will be posted on this page with its update date.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}

export function TermsConditionsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro="These terms apply when you browse or shop with Aggarwal Sweets Sirsa. Please read them together with our Returns & Cancellation policy and Privacy Policy."
    >
      <PolicySection title="Business and acceptance">
        <p>
          The store is operated by Nirmal Kumar Kandoi, proprietor of Aggarwal Sweets, at Bhadra Bazar, Sirsa, Haryana 125055, India. By using the website or placing an order, you agree to these terms and the linked store policies. If you do not agree, please do not use the website.
        </p>
      </PolicySection>

      <PolicySection title="Eligibility and accounts">
        <p>
          You must be legally able to enter into a purchase under applicable law. If you are under 18, a parent or legal guardian must use or supervise the account and place the order. Keep your contact, phone, and delivery details accurate so we can verify and fulfil your order. One-time codes are for your use; do not share them with anyone.
        </p>
      </PolicySection>

      <PolicySection title="Products, prices, and orders">
        <p>
          Product availability, batch details, and presentation may vary. Product images are illustrative. Please read the product description and contact us before ordering if you need ingredient or allergen information.
        </p>
        <p>
          The prices, applicable taxes, discounts, delivery charges, and handling charges shown at checkout form the amount payable for that order. We may correct an obvious listing or pricing error before accepting an order. An order is subject to product availability, a serviceable delivery location, and successful payment where online payment is selected. If we cannot fulfil an order, we will contact you and arrange any eligible refund in accordance with applicable law.
        </p>
      </PolicySection>

      <PolicySection title="Payments and delivery">
        <p>
          Available payment methods are shown at checkout and may include Razorpay online payment and cash on delivery. Online payments are processed by Razorpay under its terms. Keep your delivery address and phone number correct and accessible. Delivery estimates are not guarantees and may be affected by circumstances outside our reasonable control; contact us if an order is delayed.
        </p>
      </PolicySection>

      <PolicySection title="Cancellations, returns, and refunds">
        <p>
          Orders are processed promptly and generally cannot be cancelled after confirmation and the start of preparation or dispatch. Contact us immediately if you need help. Unopened boxes in original packaging may be returned; opened food packages are not eligible for change-of-mind returns. Please tell us promptly about a missing, incorrect, damaged, or potentially unsafe item. Any cancellation, replacement, or refund will be handled under our{" "}
          <Link href="/policies/returns-cancellation" className="font-semibold text-primary underline-offset-4 hover:underline">
            Returns & Cancellation policy
          </Link>{" "}
          and applicable law.
        </p>
      </PolicySection>

      <PolicySection title="Acceptable use and website content">
        <p>
          Use the website only for lawful shopping and communication. Do not attempt to interfere with the site, access another person’s account, submit false or abusive material, or use automated tools to copy listings or disrupt the service.
        </p>
        <p>
          The store’s name, logo, product photographs, descriptions, and website design belong to or are licensed to Aggarwal Sweets Sirsa. You may use the site for personal, non-commercial shopping, but may not reproduce or commercially exploit its content without permission. If you submit a review, you allow us to display and moderate it in connection with the store; you keep ownership of your review.
        </p>
      </PolicySection>

      <PolicySection title="Availability and liability">
        <p>
          We work to keep the website and listings accurate, but do not promise uninterrupted access or that every listing will always be available. To the extent allowed by law, Aggarwal Sweets Sirsa is not responsible for indirect losses arising from temporary site interruption or events outside our reasonable control. Nothing in these terms excludes liability or consumer protections that cannot legally be excluded or limited.
        </p>
      </PolicySection>

      <PolicySection title="Changes and governing law">
        <p>
          We may update these terms by posting a revised version here. The updated date will be shown at the top of the page. These terms are governed by the laws of India. To the extent permitted by applicable law, disputes arising from these terms, the website, or an order shall be subject to the exclusive jurisdiction of the competent courts in Sirsa District, Haryana. This does not restrict access to any consumer forum or other remedy whose jurisdiction cannot be limited by agreement.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}