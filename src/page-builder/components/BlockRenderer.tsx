import { useState } from "react";
import { Button, Card, Accordion } from "@heroui/react";
import clsx from "clsx";
import { Menu as MenuIcon, X as XIcon, ChevronDown } from "lucide-react";

import type { BlockInstance, BlockStyleOverrides, DesignSettings } from "../types";
import { RADIUS_TOKENS } from "../tokens";

/** Convert radius token to CSS value */
function radiusValue(token: string): string {
  const t = RADIUS_TOKENS[token as keyof typeof RADIUS_TOKENS];
  return t ? t.value : "0.5rem";
}

/** Check if preview is mobile-sized (mobile or tablet) */
function isMobile(previewMode?: string): boolean {
  return previewMode === "mobile";
}
function isTabletOrMobile(previewMode?: string): boolean {
  return previewMode === "mobile" || previewMode === "tablet";
}

/** Shared renderer props */
interface RendererProps {
  props: Record<string, unknown>;
  design: DesignSettings;
  previewMode?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Navbar
// ═══════════════════════════════════════════════════════════════════════════════

function NavbarBlock({ props, design, previewMode }: RendererProps) {
  const logo = (props.logo as string) || "Acme";
  const links: Array<{ label: string; url: string }> = ((props.links as unknown[]) || [
    "Products",
    "Solutions",
    "Pricing",
    "Docs",
  ]).map((link) =>
    typeof link === "string" ? { label: link, url: "#" } : (link as { label: string; url: string }),
  );
  const mobile = isMobile(previewMode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-separator/50">
      <div className={clsx(
        "flex items-center justify-between",
        mobile ? "px-4 py-3" : "px-4 sm:px-8 py-4",
      )}>
        {/* Logo */}
        <span
          className={clsx("font-bold tracking-tight", mobile ? "text-base" : "text-xl")}
          style={{ color: `#${design.mainColor}` }}
        >
          ◆ {logo}
        </span>

        {/* Desktop links */}
        {!mobile && (
          <div className="flex items-center gap-4 md:gap-8">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url || "#"}
                className="text-sm text-muted hover:text-foreground cursor-pointer transition-colors font-medium"
                onClick={(e) => e.preventDefault()}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {!mobile && (
            <span className="text-sm text-muted hover:text-foreground cursor-pointer transition-colors font-medium">
              Log in
            </span>
          )}
          {!mobile && (
            <Button
              size="sm"
              style={{
                backgroundColor: `#${design.mainColor}`,
                color: "#fff",
                borderRadius: radiusValue(design.radius),
              }}
            >
              Get Started
            </Button>
          )}
          {/* Hamburger toggle on mobile */}
          {mobile && (
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-surface transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobile && mobileMenuOpen && (
        <div className="border-t border-separator/30 px-4 py-3 flex flex-col gap-2 bg-surface/50">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url || "#"}
              className="text-sm text-muted hover:text-foreground cursor-pointer transition-colors font-medium py-1.5 border-b border-separator/20 last:border-0"
              onClick={(e) => e.preventDefault()}
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-sm text-muted hover:text-foreground cursor-pointer transition-colors font-medium">
              Log in
            </span>
            <Button
              size="sm"
              style={{
                backgroundColor: `#${design.mainColor}`,
                color: "#fff",
                borderRadius: radiusValue(design.radius),
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hero
// ═══════════════════════════════════════════════════════════════════════════════

function HeroBlock({ props, design }: RendererProps) {
  const headline =
    (props.headline as string) || "Build products faster than ever";
  const subtitle =
    (props.subtitle as string) ||
    "The modern platform for teams who ship. Streamline your workflow, collaborate in real-time, and deploy with confidence.";
  const ctaText = (props.ctaText as string) || "Start for free";

  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #${design.mainColor} 0%, transparent 50%), radial-gradient(circle at 75% 75%, #${design.mainColor} 0%, transparent 50%)`,
        }}
      />
      <div className="relative px-4 sm:px-8 py-16 sm:py-24 md:py-32 max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center gap-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full border border-separator"
            style={{ borderRadius: "9999px" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: `#${design.mainColor}` }}
            />
            Now in public beta — See what&apos;s new
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight text-foreground max-w-3xl">
            {headline}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <Button
              size="lg"
              style={{
                backgroundColor: `#${design.mainColor}`,
                color: "#fff",
                borderRadius: radiusValue(design.radius),
                padding: "0 2rem",
                fontWeight: 600,
              }}
            >
              {ctaText}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              style={{ borderRadius: radiusValue(design.radius) }}
            >
              View demo →
            </Button>
          </div>
          <div className="mt-12 w-full max-w-4xl">
            <div
              className="relative overflow-hidden border border-separator/60 shadow-lg"
              style={{ borderRadius: radiusValue(design.radius) }}
            >
              <img
                src="https://img.heroui.chat/image/ai?w=800&h=400&u=1"
                alt="Product screenshot"
                className="w-full h-auto object-cover"
              />
              <div
                className="absolute inset-0 ring-1 ring-inset ring-black/5"
                style={{ borderRadius: radiusValue(design.radius) }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Features
// ═══════════════════════════════════════════════════════════════════════════════

function FeaturesBlock({ props, design, previewMode }: RendererProps) {
  const title = (props.title as string) || "Everything you need to ship fast";
  const mobile = isMobile(previewMode);
  const subtitle =
    (props.subtitle as string) ||
    "Powerful features designed for modern teams. No compromises.";
  const items = (props.items as Array<{
    icon: string;
    title: string;
    description: string;
  }>) || [
    {
      icon: "⚡",
      title: "Lightning Fast",
      description:
        "Built on edge infrastructure for sub-50ms response times globally. Your users will feel the difference.",
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      description:
        "SOC 2 Type II certified with end-to-end encryption, SSO, and granular role-based access controls.",
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description:
        "Track every metric that matters with customizable dashboards and automated reporting.",
    },
    {
      icon: "🔄",
      title: "Seamless Integrations",
      description:
        "Connect with 200+ tools your team already uses. Slack, GitHub, Jira, and more.",
    },
  ];

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">{subtitle}</p>
      </div>
      <div className={clsx(
        "grid gap-6",
        mobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}>
        {items.map((item, i) => (
          <Card
            key={i}
            className="p-8 hover:shadow-md transition-shadow"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            <div
              className="w-12 h-12 flex items-center justify-center text-2xl rounded-xl mb-5"
              style={{
                backgroundColor: `#${design.mainColor}12`,
                borderRadius: radiusValue(design.radius),
              }}
            >
              {item.icon}
            </div>
            <Card.Header className="p-0">
              <Card.Title className="text-lg font-semibold">
                {item.title}
              </Card.Title>
              <Card.Description className="text-sm text-muted mt-2 leading-relaxed">
                {item.description}
              </Card.Description>
            </Card.Header>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Content (rich text area)
// ═══════════════════════════════════════════════════════════════════════════════

function ContentBlock({ props }: RendererProps) {
  const heading = (props.heading as string) || "Why teams choose us";
  const body = (props.body as string) || "We started with a simple observation: building great software shouldn't require fighting your tools.";
  const body2 = (props.body2 as string) || "";

  const renderText = (text: string) => {
    if (text.includes("<")) {
      return (
        <div
          className="text-base text-muted leading-relaxed [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:mb-1 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-separator [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#634CF8] [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      );
    }
    return <p className="text-base text-muted leading-relaxed">{text}</p>;
  };

  return (
    <div className="px-4 sm:px-8 py-12 sm:py-16 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-foreground tracking-tight mb-6">
        {heading}
      </h2>
      <div className="space-y-4">
        {renderText(body)}
        {body2 && renderText(body2)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Testimonials
// ═══════════════════════════════════════════════════════════════════════════════

function TestimonialsBlock({ props, design, previewMode }: RendererProps) {
  const title = (props.title as string) || "Loved by teams worldwide";
  const mobile = isMobile(previewMode);
  const tablet = isTabletOrMobile(previewMode);
  const testimonials = [
    {
      quote:
        "We migrated our entire infrastructure in a weekend. The developer experience is unmatched — it's like the tool reads your mind.",
      name: "Sarah Chen",
      role: "CTO at Raycast",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=1",
    },
    {
      quote:
        "Our deployment frequency went from weekly to multiple times per day. The team has never been more productive.",
      name: "Marcus Johnson",
      role: "VP Engineering at Vercel",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=2",
    },
    {
      quote:
        "Finally, a platform that doesn't make you choose between speed and reliability. It's become essential to how we build.",
      name: "Elena Rodriguez",
      role: "Lead Developer at Linear",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=3",
    },
  ];

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      <div className={clsx(
        "grid gap-6",
        mobile ? "grid-cols-1" : tablet ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}>
        {testimonials.map((t, i) => (
          <Card
            key={i}
            className="p-8 flex flex-col justify-between"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            <div>
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, s) => (
                  <span key={s} className="text-amber-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="text-xs text-muted">{t.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Pricing
// ═══════════════════════════════════════════════════════════════════════════════

function PricingBlock({ props, design, previewMode }: RendererProps) {
  const title = (props.title as string) || "Simple, transparent pricing";
  const mobile = isMobile(previewMode);
  const tablet = isTabletOrMobile(previewMode);
  const subtitle =
    (props.subtitle as string) || "No hidden fees. Cancel anytime.";

  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "For individuals and small projects",
      features: [
        "Up to 3 projects",
        "1 GB storage",
        "Community support",
        "Basic analytics",
      ],
      cta: "Get started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For growing teams that need more",
      features: [
        "Unlimited projects",
        "100 GB storage",
        "Priority support",
        "Advanced analytics",
        "Custom domains",
        "Team collaboration",
      ],
      cta: "Start free trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For organizations at scale",
      features: [
        "Everything in Pro",
        "Unlimited storage",
        "24/7 dedicated support",
        "SSO & SAML",
        "Audit logs",
        "Custom SLA",
      ],
      cta: "Contact sales",
      highlighted: false,
    },
  ];

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-lg text-muted">{subtitle}</p>
      </div>
      <div className={clsx(
        "grid gap-6 items-start",
        mobile ? "grid-cols-1" : tablet ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      )}>
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={clsx(
              "p-8 flex flex-col relative overflow-visible",
              tier.highlighted && "border-2 shadow-lg mt-4",
            )}
            style={{
              borderRadius: radiusValue(design.radius),
              borderColor: tier.highlighted
                ? `#${design.mainColor}`
                : undefined,
            }}
          >
            {tier.highlighted && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-semibold text-white rounded-full"
                style={{ backgroundColor: `#${design.mainColor}` }}
              >
                Most popular
              </div>
            )}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {tier.name}
              </h3>
              <p className="text-sm text-muted mt-1">{tier.description}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  {tier.price}
                </span>
                <span className="text-sm text-muted">{tier.period}</span>
              </div>
            </div>
            <ul className="flex-1 space-y-3 mb-8">
              {tier.features.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-muted"
                >
                  <span style={{ color: `#${design.mainColor}` }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              style={
                tier.highlighted
                  ? {
                      backgroundColor: `#${design.mainColor}`,
                      color: "#fff",
                      borderRadius: radiusValue(design.radius),
                      fontWeight: 600,
                    }
                  : { borderRadius: radiusValue(design.radius) }
              }
              variant={tier.highlighted ? "primary" : "secondary"}
            >
              {tier.cta}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════════════════════════════════════

function StatsBlock({ props, design, previewMode }: RendererProps) {
  const items = (props.items as Array<{ value: string; label: string }>) || [
    { value: "50K+", label: "Active developers" },
    { value: "99.99%", label: "Uptime SLA" },
    { value: "150ms", label: "Avg. response time" },
    { value: "2M+", label: "Deployments per month" },
  ];
  const mobile = isMobile(previewMode);

  return (
    <div
      className="px-4 sm:px-8 py-16 sm:py-20"
      style={{ backgroundColor: `#${design.mainColor}06` }}
    >
      <div className={clsx(
        "grid gap-6 sm:gap-8 max-w-5xl mx-auto text-center",
        mobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4",
      )}>
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            <span
              className={clsx(
                "font-bold tracking-tight",
                mobile ? "text-2xl" : "text-4xl md:text-5xl",
              )}
              style={{ color: `#${design.mainColor}` }}
            >
              {item.value}
            </span>
            <span className="text-sm text-muted mt-2 font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Team
// ═══════════════════════════════════════════════════════════════════════════════

function TeamBlock({ props, design, previewMode }: RendererProps) {
  const title = (props.title as string) || "Meet the team";
  const mobile = isMobile(previewMode);
  const subtitle =
    (props.subtitle as string) ||
    "The people behind the product. We're a small, focused team passionate about developer tools.";

  const members = [
    {
      name: "Alex Rivera",
      role: "CEO & Co-founder",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=4",
    },
    {
      name: "Jordan Lee",
      role: "CTO & Co-founder",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5",
    },
    {
      name: "Priya Sharma",
      role: "Head of Design",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=6",
    },
    {
      name: "David Kim",
      role: "Lead Engineer",
      avatar: "https://img.heroui.chat/image/avatar?w=200&h=200&u=7",
    },
  ];

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-5xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">{subtitle}</p>
      </div>
      <div className={clsx(
        "grid gap-8",
        mobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4",
      )}>
        {members.map((m, i) => (
          <div key={i} className="text-center group">
            <div
              className="relative overflow-hidden mx-auto mb-4 w-32 h-32"
              style={{ borderRadius: radiusValue(design.radius) }}
            >
              <img
                src={m.avatar}
                alt={m.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <p className="text-sm font-semibold text-foreground">{m.name}</p>
            <p className="text-xs text-muted mt-0.5">{m.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════════

function FAQBlock({ props }: RendererProps) {
  const title = (props.title as string) || "Frequently asked questions";
  const subtitle =
    (props.subtitle as string) ||
    "Everything you need to know. Can't find what you're looking for? Reach out to our team.";

  const items = (props.items as Array<{ q: string; a: string }>) || [
    {
      q: "How does the free trial work?",
      a: "You get full access to all Pro features for 14 days. No credit card required. At the end of your trial, you can choose to upgrade or continue with the free plan.",
    },
    {
      q: "Can I change my plan later?",
      a: "Absolutely. You can upgrade, downgrade, or cancel your plan at any time from your account settings. Changes take effect at the start of your next billing cycle.",
    },
    {
      q: "What kind of support do you offer?",
      a: "Free plans get community support. Pro plans include priority email support with a 4-hour response time. Enterprise plans get 24/7 dedicated support with a named account manager.",
    },
    {
      q: "Is my data secure?",
      a: "Yes. We're SOC 2 Type II certified and all data is encrypted at rest and in transit. We also support SSO, SAML, and custom data residency requirements for Enterprise plans.",
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund — no questions asked.",
    },
  ];

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-3xl mx-auto">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-lg text-muted">{subtitle}</p>
      </div>
      <Accordion className="w-full" variant="surface">
        {items.map((item, i) => (
          <Accordion.Item key={i}>
            <Accordion.Heading>
              <Accordion.Trigger>
                {item.q}
                <Accordion.Indicator>
                  <ChevronDown size={16} />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body>
                <p className="text-sm text-muted leading-relaxed">{item.a}</p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Gallery
// ═══════════════════════════════════════════════════════════════════════════════

function GalleryBlock({ props, design, previewMode }: RendererProps) {
  const title = (props.title as string) || "Gallery";
  const mobile = isMobile(previewMode);
  const images = [
    "https://img.heroui.chat/image/ai?w=800&h=400&u=10",
    "https://img.heroui.chat/image/ai?w=800&h=400&u=11",
    "https://img.heroui.chat/image/ai?w=800&h=400&u=12",
    "https://img.heroui.chat/image/ai?w=800&h=400&u=13",
    "https://img.heroui.chat/image/ai?w=800&h=400&u=14",
    "https://img.heroui.chat/image/ai?w=800&h=400&u=15",
  ];

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-6xl mx-auto">
      {title && (
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight text-center mb-8 sm:mb-12">
          {title}
        </h2>
      )}
      <div className={clsx(
        "grid gap-4",
        mobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      )}>
        {images.map((src, i) => (
          <div
            key={i}
            className="relative overflow-hidden group aspect-[4/3]"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            <img
              src={src}
              alt={`Gallery image ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CTA
// ═══════════════════════════════════════════════════════════════════════════════

function CTABlock({ props, design }: RendererProps) {
  const headline =
    (props.headline as string) || "Ready to accelerate your workflow?";
  const subtitle =
    (props.subtitle as string) ||
    "Join 50,000+ developers who ship faster with our platform. Start your free trial today.";
  const ctaText = (props.ctaText as string) || "Get started for free";

  return (
    <div
      className="relative overflow-hidden px-4 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20"
      style={{ backgroundColor: `#${design.mainColor}` }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)",
        }}
      />
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {headline}
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Button
            size="lg"
            style={{
              backgroundColor: "#fff",
              color: `#${design.mainColor}`,
              borderRadius: radiusValue(design.radius),
              fontWeight: 600,
            }}
          >
            {ctaText}
          </Button>
          <Button
            size="lg"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              color: "#fff",
              borderRadius: radiusValue(design.radius),
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            Talk to sales
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Contact
// ═══════════════════════════════════════════════════════════════════════════════

function ContactBlock({ props, design, previewMode }: RendererProps) {
  const title = (props.title as string) || "Get in touch";
  const mobile = isMobile(previewMode);
  const subtitle =
    (props.subtitle as string) ||
    "Have a question or want to work together? Drop us a message.";

  return (
    <div className="px-4 sm:px-8 py-16 sm:py-20 max-w-5xl mx-auto">
      <div className={clsx(
        "grid gap-10",
        mobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 md:gap-16",
      )}>
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h2>
          <p className="mt-4 text-muted leading-relaxed">{subtitle}</p>
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center text-sm rounded-lg"
                style={{
                  backgroundColor: `#${design.mainColor}12`,
                  borderRadius: radiusValue(design.radius),
                }}
              >
                ✉
              </div>
              <div>
                <p className="text-xs text-muted">Email</p>
                <p className="text-sm text-foreground font-medium">
                  hello@acme.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center text-sm rounded-lg"
                style={{
                  backgroundColor: `#${design.mainColor}12`,
                  borderRadius: radiusValue(design.radius),
                }}
              >
                📍
              </div>
              <div>
                <p className="text-xs text-muted">Office</p>
                <p className="text-sm text-foreground font-medium">
                  San Francisco, CA
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="h-11 border border-separator bg-surface px-4 flex items-center"
              style={{ borderRadius: radiusValue(design.radius) }}
            >
              <span className="text-sm text-muted">First name</span>
            </div>
            <div
              className="h-11 border border-separator bg-surface px-4 flex items-center"
              style={{ borderRadius: radiusValue(design.radius) }}
            >
              <span className="text-sm text-muted">Last name</span>
            </div>
          </div>
          <div
            className="h-11 border border-separator bg-surface px-4 flex items-center"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            <span className="text-sm text-muted">Email address</span>
          </div>
          <div
            className="h-11 border border-separator bg-surface px-4 flex items-center"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            <span className="text-sm text-muted">Subject</span>
          </div>
          <div
            className="h-28 border border-separator bg-surface px-4 pt-3 flex items-start"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            <span className="text-sm text-muted">Your message...</span>
          </div>
          <Button
            className="w-full mt-1"
            style={{
              backgroundColor: `#${design.mainColor}`,
              color: "#fff",
              borderRadius: radiusValue(design.radius),
              fontWeight: 600,
            }}
          >
            Send message
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Logos
// ═══════════════════════════════════════════════════════════════════════════════

function LogosBlock({ props }: RendererProps) {
  const title =
    (props.title as string) || "Trusted by industry-leading companies";
  const logos = ["Vercel", "Stripe", "Linear", "Notion", "Figma", "GitHub"];

  return (
    <div className="px-4 sm:px-8 py-12 sm:py-16">
      <p className="text-center text-xs uppercase tracking-widest text-muted font-medium mb-8 sm:mb-10">
        {title}
      </p>
      <div className="flex items-center justify-center gap-6 sm:gap-12 flex-wrap max-w-4xl mx-auto">
        {logos.map((name, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-muted/40 hover:text-muted/70 transition-colors"
          >
            <div className="w-6 h-6 rounded bg-muted/15" />
            <span className="text-sm font-semibold tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Banner
// ═══════════════════════════════════════════════════════════════════════════════

function BannerBlock({ props, design }: RendererProps) {
  const text =
    (props.text as string) ||
    "🚀 We just raised $20M Series A — Read the announcement";

  return (
    <div
      className="px-6 py-2.5 text-center"
      style={{ backgroundColor: `#${design.mainColor}` }}
    >
      <p className="text-sm text-white font-medium flex items-center justify-center gap-2">
        {text}
        <span className="text-white/70 text-xs">→</span>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════════════════════════

function FooterBlock({ props, design, previewMode }: RendererProps) {
  const copyright =
    (props.copyright as string) || "© 2026 Acme Inc. All rights reserved.";
  const logo = (props.logo as string) || "Acme";
  const tagline = (props.tagline as string) || "Build better products, faster. The modern platform for ambitious teams.";
  const mobile = isMobile(previewMode);

  const columns = (props.columns as Array<{ title: string; links: string[] }>) || [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Docs", "API"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press", "Partners"] },
    { title: "Resources", links: ["Community", "Help Center", "Status", "Tutorials"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
  ];

  const socials = (props.socials as string[]) || ["Twitter", "GitHub", "Discord", "LinkedIn"];

  return (
    <footer className="px-4 sm:px-8 py-12 sm:py-16 border-t border-separator/50">
      <div className="max-w-6xl mx-auto">
        <div className={clsx(
          "grid gap-8",
          mobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        )}>
          <div className={mobile ? "col-span-2" : "col-span-2 sm:col-span-3 lg:col-span-1"}>
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: `#${design.mainColor}` }}
            >
              ◆ {logo}
            </span>
            <p className="text-sm text-muted mt-3 leading-relaxed">
              {tagline}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-foreground mb-3">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted hover:text-foreground cursor-pointer transition-colors">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={clsx(
          "mt-12 pt-8 border-t border-separator/50 flex items-center justify-between gap-4",
          mobile ? "flex-col text-center" : "flex-col md:flex-row",
        )}>
          <p className="text-xs text-muted whitespace-nowrap">{copyright}</p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {socials.map((social) => (
              <span
                key={social}
                className="text-xs text-muted hover:text-foreground cursor-pointer transition-colors"
              >
                {social}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Text
// ═══════════════════════════════════════════════════════════════════════════════

function TextBlock({ props }: RendererProps) {
  const content = (props.content as string) || "Start typing your content here...";
  const isHtml = content.includes("<");

  return (
    <div className="px-4 sm:px-8 py-8 sm:py-10 max-w-3xl mx-auto">
      {isHtml ? (
        <div
          className="text-base text-foreground leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:mb-1 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-separator [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#634CF8] [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-base text-foreground leading-relaxed">{content}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Image
// ═══════════════════════════════════════════════════════════════════════════════

function ImageBlock({ props, design }: RendererProps) {
  const src =
    (props.src as string) ||
    "https://img.heroui.chat/image/ai?w=800&h=400&u=20";
  const alt = (props.alt as string) || "Image";
  const caption = props.caption as string | undefined;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-4xl mx-auto">
      <div
        className="overflow-hidden border border-separator/40"
        style={{ borderRadius: radiusValue(design.radius) }}
      >
        <img src={src} alt={alt} className="w-full h-auto object-cover" />
      </div>
      {caption && (
        <p className="text-center text-xs text-muted mt-3">{caption}</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Video
// ═══════════════════════════════════════════════════════════════════════════════

function VideoBlock({ props, design }: RendererProps) {
  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div
        className="relative aspect-video w-full bg-black/5 flex items-center justify-center border border-separator/40 overflow-hidden"
        style={{ borderRadius: radiusValue(design.radius) }}
      >
        <img
          src="https://img.heroui.chat/image/ai?w=800&h=400&u=21"
          alt="Video thumbnail"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div
          className="relative z-10 w-16 h-16 flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg cursor-pointer hover:scale-105 transition-transform"
          style={{ borderRadius: "9999px" }}
        >
          <span
            className="text-xl ml-1"
            style={{ color: `#${design.mainColor}` }}
          >
            ▶
          </span>
        </div>
        {(props.duration as string) && (
          <span className="absolute bottom-3 right-3 text-xs text-white bg-black/60 px-2 py-0.5 rounded">
            {props.duration as string}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Button Group
// ═══════════════════════════════════════════════════════════════════════════════

function ButtonGroupBlock({ props, design }: RendererProps) {
  const primaryText = (props.primaryText as string) || "Get started";
  const secondaryText = (props.secondaryText as string) || "Learn more";

  return (
    <div className="px-8 py-8 flex items-center justify-center gap-4">
      <Button
        size="lg"
        style={{
          backgroundColor: `#${design.mainColor}`,
          color: "#fff",
          borderRadius: radiusValue(design.radius),
          fontWeight: 600,
        }}
      >
        {primaryText}
      </Button>
      <Button
        size="lg"
        variant="secondary"
        style={{ borderRadius: radiusValue(design.radius) }}
      >
        {secondaryText}
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Container
// ═══════════════════════════════════════════════════════════════════════════════

function ContainerBlock({ props }: RendererProps) {
  const maxWidth = (props.maxWidth as string) || "1200px";

  return (
    <div style={{ maxWidth, margin: "0 auto" }} className="min-h-[1rem]" />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Grid
// ═══════════════════════════════════════════════════════════════════════════════

function GridBlock() {
  return <div className="min-h-[1rem]" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Flex Container
// ═══════════════════════════════════════════════════════════════════════════════

function FlexContainerBlock() {
  return <div className="min-h-[1rem]" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Flex Row
// ═══════════════════════════════════════════════════════════════════════════════

function FlexRowBlock() {
  return <div className="min-h-[1rem]" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Flex Column
// ═══════════════════════════════════════════════════════════════════════════════

function FlexColBlock() {
  return <div className="min-h-[1rem]" />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Columns
// ═══════════════════════════════════════════════════════════════════════════════

function ColumnsBlock({ props, design }: RendererProps) {
  const count = (props.columns as number) || 2;
  const cols = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="px-4 sm:px-8 py-8">
      <div
        className={clsx(
          "grid gap-6",
          "grid-cols-1",
          count === 2 && "md:grid-cols-2",
          count === 3 && "md:grid-cols-3",
          count >= 4 && "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          count >= 5 && "lg:grid-cols-5",
          count >= 6 && "lg:grid-cols-6",
        )}
      >
        {cols.map((col) => (
          <div
            key={col}
            className="min-h-[8rem] border-2 border-dashed border-separator/50 flex items-center justify-center text-sm text-muted"
            style={{ borderRadius: radiusValue(design.radius) }}
          >
            Column {col}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Spacer
// ═══════════════════════════════════════════════════════════════════════════════

function SpacerBlock({ props }: RendererProps) {
  const height = (props.height as number) || 64;

  return (
    <div className="relative group" style={{ height: `${height}px` }}>
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-separator/30 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Divider
// ═══════════════════════════════════════════════════════════════════════════════

function DividerBlock({ props }: RendererProps) {
  const label = props.label as string | undefined;

  return (
    <div className="px-8 py-6">
      {label ? (
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-separator" />
          <span className="text-xs text-muted font-medium uppercase tracking-wider">
            {label}
          </span>
          <div className="flex-1 border-t border-separator" />
        </div>
      ) : (
        <hr className="border-separator" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Code
// ═══════════════════════════════════════════════════════════════════════════════

function CodeBlock({ props, design }: RendererProps) {
  const code =
    (props.code as string) ||
    `import { deploy } from '@acme/sdk'

const app = await deploy({
  name: 'my-app',
  region: 'us-east-1',
  env: { NODE_ENV: 'production' },
})

console.log(\`Deployed to \${app.url}\`)`;
  const language = (props.language as string) || "typescript";
  const filename = (props.filename as string) || "deploy.ts";

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div
        className="overflow-hidden border border-separator/30"
        style={{ borderRadius: radiusValue(design.radius) }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a2e] border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <span className="text-xs text-white/40 ml-2 font-mono">
              {filename}
            </span>
          </div>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            {language}
          </span>
        </div>
        <pre className="bg-[#0f0f1a] text-green-400/90 p-5 text-sm font-mono overflow-x-auto leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HTML Embed
// ═══════════════════════════════════════════════════════════════════════════════

function HTMLBlock({ props, design }: RendererProps) {
  const html = (props.html as string) || "<div>Custom HTML</div>";

  return (
    <div className="px-8 py-8">
      <div
        className="border border-dashed border-separator bg-surface/50 p-6"
        style={{ borderRadius: radiusValue(design.radius) }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-mono px-2 py-0.5 bg-muted/10 rounded text-muted">
            {"</>"}
          </span>
          <span className="text-xs text-muted font-medium">HTML Embed</span>
        </div>
        <pre className="text-xs text-foreground/70 font-mono overflow-x-auto">
          <code>{html}</code>
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI Component Renderers (defined above)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Individual UI Component Renderers ──

function ButtonComponent({ props, design }: RendererProps) {
  const text = (props.text as string) || "Button";
  const variant = (props.variant as string) || "primary";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4 flex items-center justify-center">
      <button
        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm"
        style={
          variant === "primary"
            ? { backgroundColor: accent, color: "#fff" }
            : { border: `1.5px solid ${accent}`, color: accent, background: "transparent" }
        }
      >
        {text}
      </button>
    </div>
  );
}

function CardComponent({ props }: RendererProps) {
  const title = (props.title as string) || "Card Title";
  const description = (props.description as string) || "Card description goes here.";
  return (
    <div className="px-4 py-4">
      <div className="rounded-xl border border-separator/50 bg-white dark:bg-surface shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-[#634CF8]/10 to-[#634CF8]/5" />
        <div className="p-4">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AvatarComponent({ props }: RendererProps) {
  const name = (props.name as string) || "User";
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="px-4 py-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-[#634CF8]/15 flex items-center justify-center text-xs font-bold text-[#634CF8]">
        {initials}
      </div>
      <span className="text-sm text-foreground">{name}</span>
    </div>
  );
}

function BadgeComponent({ props, design }: RendererProps) {
  const text = (props.text as string) || "Badge";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4 flex items-center">
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: `${accent}15`, color: accent }}
      >
        {text}
      </span>
    </div>
  );
}

function ChipComponent({ props, design }: RendererProps) {
  const text = (props.text as string) || "Chip";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4 flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
        style={{ borderColor: `${accent}40`, color: accent }}
      >
        {text}
        <span className="ml-1 cursor-pointer opacity-50">×</span>
      </span>
    </div>
  );
}

function InputComponent({ props }: RendererProps) {
  const placeholder = (props.placeholder as string) || "Enter text...";
  const label = (props.label as string) || "Input";
  return (
    <div className="px-4 py-4">
      <label className="text-xs font-semibold text-muted block mb-1.5">{label}</label>
      <div className="h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 flex items-center">
        <span className="text-xs text-muted/50">{placeholder}</span>
      </div>
    </div>
  );
}

function TextFieldComponent({ props }: RendererProps) {
  const label = (props.label as string) || "Text Field";
  const placeholder = (props.placeholder as string) || "Enter value...";
  return (
    <div className="px-4 py-4">
      <label className="text-xs font-semibold text-foreground block mb-1.5">{label}</label>
      <div className="h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 flex items-center">
        <span className="text-xs text-muted/50">{placeholder}</span>
      </div>
      <p className="text-[10px] text-muted/50 mt-1">Helper text</p>
    </div>
  );
}

function TextAreaComponent({ props }: RendererProps) {
  const label = (props.label as string) || "Text Area";
  const placeholder = (props.placeholder as string) || "Write something...";
  return (
    <div className="px-4 py-4">
      <label className="text-xs font-semibold text-muted block mb-1.5">{label}</label>
      <div className="h-24 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 py-2">
        <span className="text-xs text-muted/50">{placeholder}</span>
      </div>
    </div>
  );
}

function SelectComponent({ props }: RendererProps) {
  const label = (props.label as string) || "Select";
  const placeholder = (props.placeholder as string) || "Choose an option...";
  return (
    <div className="px-4 py-4">
      <label className="text-xs font-semibold text-muted block mb-1.5">{label}</label>
      <div className="h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 flex items-center justify-between">
        <span className="text-xs text-muted/50">{placeholder}</span>
        <span className="text-muted/40 text-[10px]">▼</span>
      </div>
    </div>
  );
}

function CheckboxComponent({ props, design }: RendererProps) {
  const label = (props.label as string) || "Checkbox option";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4 flex items-center gap-2.5">
      <div
        className="h-4.5 w-4.5 rounded border-2 flex items-center justify-center"
        style={{ borderColor: accent, width: 18, height: 18 }}
      >
        <span style={{ color: accent, fontSize: 11, fontWeight: 700 }}>✓</span>
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}

function SwitchComponent({ props, design }: RendererProps) {
  const label = (props.label as string) || "Toggle option";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4 flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <div className="relative h-5 w-9 rounded-full" style={{ backgroundColor: accent }}>
        <div className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm translate-x-4" />
      </div>
    </div>
  );
}

function RadioGroupComponent({ props, design }: RendererProps) {
  const label = (props.label as string) || "Radio Group";
  const options = (props.options as string[]) || ["Option 1", "Option 2", "Option 3"];
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4">
      <label className="text-xs font-semibold text-muted block mb-2">{label}</label>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: i === 0 ? accent : "#d4d4d4" }}
            >
              {i === 0 && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />}
            </div>
            <span className="text-sm text-foreground">{opt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SliderComponent({ props, design }: RendererProps) {
  const label = (props.label as string) || "Slider";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-muted">{label}</label>
        <span className="text-xs font-mono text-foreground">50</span>
      </div>
      <div className="relative h-2 rounded-full bg-muted/15">
        <div className="absolute h-2 rounded-full" style={{ backgroundColor: accent, width: "50%" }} />
        <div
          className="absolute h-4 w-4 rounded-full border-2 bg-white shadow-sm -translate-y-1"
          style={{ borderColor: accent, left: "50%", marginLeft: -8 }}
        />
      </div>
    </div>
  );
}

function AccordionComponent({ props }: RendererProps) {
  const items = (props.items as Array<{ title: string; content: string }>) || [
    { title: "Section 1", content: "Content for section 1" },
    { title: "Section 2", content: "Content for section 2" },
    { title: "Section 3", content: "Content for section 3" },
  ];
  return (
    <div className="px-4 py-4">
      <div className="rounded-lg border border-separator/50 overflow-hidden divide-y divide-separator/40">
        {items.map((item, i) => (
          <div key={i} className="px-3 py-2.5 flex items-center justify-between bg-white dark:bg-surface">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <span className="text-muted/40 text-xs">{i === 0 ? "▲" : "▼"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabsComponent({ props, design }: RendererProps) {
  const tabs = (props.tabs as string[]) || ["Tab 1", "Tab 2", "Tab 3"];
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4">
      <div className="flex border-b border-separator/40">
        {tabs.map((tab, i) => (
          <button
            key={i}
            className="px-4 py-2 text-xs font-semibold border-b-2 transition-colors"
            style={
              i === 0
                ? { color: accent, borderColor: accent }
                : { color: "#a1a1aa", borderColor: "transparent" }
            }
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="py-3 text-xs text-muted">Tab content area</div>
    </div>
  );
}

function TableComponent({ props }: RendererProps) {
  const headers = (props.headers as string[]) || ["Name", "Status", "Role"];
  const rows = (props.rows as string[][]) || [
    ["Alice", "Active", "Admin"],
    ["Bob", "Inactive", "User"],
  ];
  return (
    <div className="px-4 py-4">
      <div className="rounded-lg border border-separator/50 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#FAFAFA] dark:bg-surface">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-separator/30">
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-foreground">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinkComponent({ props, design }: RendererProps) {
  const text = (props.text as string) || "Click here";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4 flex items-center">
      <span className="text-sm font-medium underline underline-offset-2" style={{ color: accent }}>
        {text} →
      </span>
    </div>
  );
}

function SeparatorComponent() {
  return (
    <div className="px-4 py-4">
      <hr className="border-separator/50" />
    </div>
  );
}

function TooltipComponent({ props }: RendererProps) {
  const text = (props.text as string) || "Hover me";
  const tooltip = (props.tooltip as string) || "Tooltip info";
  return (
    <div className="px-4 py-4 flex items-center gap-2">
      <span className="text-sm text-foreground underline decoration-dashed underline-offset-4 decoration-muted/40 cursor-help">
        {text}
      </span>
      <div className="rounded-md bg-foreground/90 text-background px-2 py-1 text-[10px] shadow-lg">
        {tooltip}
      </div>
    </div>
  );
}

function PopoverComponent({ props, design }: RendererProps) {
  const trigger = (props.trigger as string) || "Click me";
  const accent = `#${design?.mainColor || "634CF8"}`;
  return (
    <div className="px-4 py-4">
      <button
        className="px-4 py-2 rounded-lg text-xs font-semibold border"
        style={{ borderColor: `${accent}40`, color: accent }}
      >
        {trigger}
      </button>
      <div className="mt-2 rounded-lg border border-separator/50 bg-white dark:bg-surface shadow-lg p-3 max-w-[200px]">
        <p className="text-xs text-foreground font-medium">Popover Title</p>
        <p className="text-[10px] text-muted mt-1">Popover content goes here.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Renderer Map & BlockRenderer Export
// ═══════════════════════════════════════════════════════════════════════════════

const RENDERERS: Record<string, React.FC<RendererProps>> = {
  navbar: NavbarBlock,
  hero: HeroBlock,
  features: FeaturesBlock,
  content: ContentBlock,
  testimonials: TestimonialsBlock,
  pricing: PricingBlock,
  stats: StatsBlock,
  team: TeamBlock,
  faq: FAQBlock,
  gallery: GalleryBlock,
  cta: CTABlock,
  contact: ContactBlock,
  logos: LogosBlock,
  banner: BannerBlock,
  footer: FooterBlock,
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock,
  "button-group": ButtonGroupBlock,
  columns: ColumnsBlock,
  container: ContainerBlock,
  grid: GridBlock,
  "flex-row": FlexRowBlock,
  "flex-col": FlexColBlock,
  "flex-container": FlexContainerBlock,
  spacer: SpacerBlock,
  divider: DividerBlock,
  code: CodeBlock,
  html: HTMLBlock,
  // UI Components (visual renderers)
  Button: ButtonComponent,
  Card: CardComponent,
  Avatar: AvatarComponent,
  Badge: BadgeComponent,
  Chip: ChipComponent,
  Input: InputComponent,
  TextField: TextFieldComponent,
  TextArea: TextAreaComponent,
  Select: SelectComponent,
  Checkbox: CheckboxComponent,
  Switch: SwitchComponent,
  RadioGroup: RadioGroupComponent,
  Slider: SliderComponent,
  Accordion: AccordionComponent,
  Tabs: TabsComponent,
  Table: TableComponent,
  Link: LinkComponent,
  Separator: SeparatorComponent,
  Tooltip: TooltipComponent,
  Popover: PopoverComponent,
};

// ═══════════════════════════════════════════════════════════════════════════════
// Style Override Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/** Font size token to CSS value mapping */
const FONT_SIZE_MAP: Record<string, string> = {
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
};

/** Font weight token to CSS value mapping */
const FONT_WEIGHT_MAP: Record<string, string> = {
  light: "300",
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

/** Line height token to CSS value mapping */
const LINE_HEIGHT_MAP: Record<string, string> = {
  tight: "1.25",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
};

/** Animation class mapping */
const ANIMATION_CLASSES: Record<string, string> = {
  "fade-in": "animate-fade-in",
  "fade-up": "animate-fade-up",
  "fade-down": "animate-fade-down",
  "slide-up": "animate-slide-up",
  "slide-down": "animate-slide-down",
  "slide-left": "animate-slide-left",
  "slide-right": "animate-slide-right",
  "zoom-in": "animate-zoom-in",
  "zoom-out": "animate-zoom-out",
  bounce: "animate-bounce",
};

/** Build inline style object from BlockStyleOverrides */
function buildStyleOverrides(style: BlockStyleOverrides): React.CSSProperties {
  const css: React.CSSProperties = {};

  // Typography
  if (style.fontSize) {
    css.fontSize = FONT_SIZE_MAP[style.fontSize] || style.fontSize;
  }
  if (style.fontWeight) {
    css.fontWeight = FONT_WEIGHT_MAP[style.fontWeight] || style.fontWeight;
  }
  if (style.textAlign) {
    css.textAlign = style.textAlign as React.CSSProperties["textAlign"];
  }
  if (style.textColor) {
    css.color = style.textColor;
  }
  if (style.lineHeight) {
    css.lineHeight = LINE_HEIGHT_MAP[style.lineHeight] || style.lineHeight;
  }

  // Borders
  if (style.borderWidth && style.borderWidth !== "0") {
    css.borderWidth = style.borderWidth;
    css.borderStyle = style.borderStyle || "solid";
    if (style.borderColor) {
      css.borderColor = style.borderColor;
    }
  }
  if (style.borderRadius) {
    const token = RADIUS_TOKENS[style.borderRadius as keyof typeof RADIUS_TOKENS];
    css.borderRadius = token ? token.value : style.borderRadius;
  }
  // Per-corner radius overrides
  if (style.borderRadiusTL) css.borderTopLeftRadius = style.borderRadiusTL;
  if (style.borderRadiusTR) css.borderTopRightRadius = style.borderRadiusTR;
  if (style.borderRadiusBL) css.borderBottomLeftRadius = style.borderRadiusBL;
  if (style.borderRadiusBR) css.borderBottomRightRadius = style.borderRadiusBR;

  // Background
  if (style.backgroundColor) {
    css.backgroundColor = style.backgroundColor;
  }

  // Spacing
  if (style.paddingTop != null) css.paddingTop = `${style.paddingTop}px`;
  if (style.paddingBottom != null) css.paddingBottom = `${style.paddingBottom}px`;
  if (style.paddingLeft != null) css.paddingLeft = `${style.paddingLeft}px`;
  if (style.paddingRight != null) css.paddingRight = `${style.paddingRight}px`;
  if (style.marginTop != null) css.marginTop = `${style.marginTop}px`;
  if (style.marginBottom != null) css.marginBottom = `${style.marginBottom}px`;

  // Animation delay
  if (style.animationDelay) {
    css.animationDelay = `${style.animationDelay}ms`;
  }

  return css;
}

/** Check if block is hidden for a given preview mode */
function isHiddenForViewport(
  style: BlockStyleOverrides | undefined,
  previewMode: string,
): boolean {
  if (!style) return false;
  if (previewMode === "desktop" && style.visibleDesktop === false) return true;
  if (previewMode === "tablet" && style.visibleTablet === false) return true;
  if (previewMode === "mobile" && style.visibleMobile === false) return true;
  return false;
}

/** Get viewport label for hidden overlay */
function getHiddenViewportLabel(previewMode: string): string {
  switch (previewMode) {
    case "desktop":
      return "desktop";
    case "tablet":
      return "tablet";
    case "mobile":
      return "mobile";
    default:
      return previewMode;
  }
}

export function BlockRenderer({
  block,
  design,
  isSelected,
  previewMode = "desktop",
  onClick,
}: {
  block: BlockInstance;
  design: DesignSettings;
  isSelected: boolean;
  previewMode?: string;
  onClick: () => void;
}) {
  const Renderer = RENDERERS[block.type];
  if (!Renderer) return null;

  const styleOverrides = block.props._style as BlockStyleOverrides | undefined;
  const inlineStyles = styleOverrides ? buildStyleOverrides(styleOverrides) : {};
  const animationClass =
    styleOverrides?.animation && styleOverrides.animation !== "none"
      ? ANIMATION_CLASSES[styleOverrides.animation] || ""
      : "";
  const cssClass = styleOverrides?.cssClass || "";
  const hiddenForViewport = isHiddenForViewport(styleOverrides, previewMode);

  // Responsive scaling for tablet/mobile preview
  const responsiveZoom =
    previewMode === "mobile" ? 0.65 : previewMode === "tablet" ? 0.85 : undefined;

  return (
    <div
      className={clsx(
        "relative group cursor-pointer transition-all rounded-lg",
        animationClass,
        cssClass,
      )}
      style={{ ...inlineStyles, ...(responsiveZoom ? { zoom: responsiveZoom } : {}) }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Block type label */}
      <div
        className={clsx(
          "absolute -top-3 left-3 z-10 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-opacity",
          isSelected
            ? "bg-[#634CF8] text-white opacity-100"
            : "bg-foreground/80 text-background opacity-0 group-hover:opacity-100",
        )}
      >
        {block.type}
      </div>

      <Renderer design={design} props={block.props} previewMode={previewMode} />

      {/* Responsive visibility overlay */}
      {hiddenForViewport && (
        <div className="absolute inset-0 bg-muted/20 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-[5]">
          <div className="bg-white dark:bg-surface border border-separator/50 rounded-lg px-3 py-1.5 shadow-sm">
            <p className="text-[10px] font-semibold text-muted">
              Hidden on {getHiddenViewportLabel(previewMode)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
