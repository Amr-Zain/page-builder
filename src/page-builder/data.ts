import type {
  BlockDefinition,
  ComponentDefinition,
  Template,
  BlockInstance,
  DesignSettings,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCKS — Full page sections you drag to build the page
// ═══════════════════════════════════════════════════════════════════════════════

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // ── Sections ──
  {
    type: "navbar",
    label: "Navigation",
    icon: "menu",
    category: "sections",
    description: "Top navigation bar with logo and links",
    defaultProps: { logo: "Acme", links: ["Features", "Pricing", "About"] },
  },
  {
    type: "hero",
    label: "Hero",
    icon: "rocket",
    category: "sections",
    description: "Large banner with headline, subtitle and CTA",
    defaultProps: {
      headline: "Your headline here",
      subtitle: "A short description of your product or service.",
      ctaText: "Get Started",
    },
  },
  {
    type: "features",
    label: "Features",
    icon: "sparkles",
    category: "sections",
    description: "Grid of feature cards with icons",
    defaultProps: {
      title: "Features",
      items: [
        {
          icon: "⚡",
          title: "Fast",
          description: "Lightning fast performance",
        },
        { icon: "🎨", title: "Beautiful", description: "Stunning designs" },
        {
          icon: "📱",
          title: "Responsive",
          description: "Works on every device",
        },
      ],
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    icon: "message-square",
    category: "sections",
    description: "Customer quotes and reviews",
    defaultProps: { title: "What people say" },
  },
  {
    type: "pricing",
    label: "Pricing",
    icon: "dollar-sign",
    category: "sections",
    description: "Pricing plans comparison",
    defaultProps: { title: "Pricing" },
  },
  {
    type: "stats",
    label: "Stats",
    icon: "bar-chart",
    category: "sections",
    description: "Key numbers and metrics",
    defaultProps: {
      items: [
        { value: "10K+", label: "Users" },
        { value: "99%", label: "Uptime" },
        { value: "24/7", label: "Support" },
        { value: "50+", label: "Countries" },
      ],
    },
  },
  {
    type: "team",
    label: "Team",
    icon: "users",
    category: "sections",
    description: "Team member profiles",
    defaultProps: { title: "Our Team" },
  },
  {
    type: "faq",
    label: "FAQ",
    icon: "help-circle",
    category: "sections",
    description: "Frequently asked questions accordion",
    defaultProps: {
      title: "FAQ",
      items: [
        { q: "How does it work?", a: "It's simple — just drag and drop." },
        {
          q: "Is there a free plan?",
          a: "Yes, we offer a generous free tier.",
        },
      ],
    },
  },
  {
    type: "cta",
    label: "Call to Action",
    icon: "megaphone",
    category: "sections",
    description: "Highlighted section with action button",
    defaultProps: {
      headline: "Ready to get started?",
      subtitle: "Join thousands of creators.",
      ctaText: "Start Building",
    },
  },
  {
    type: "contact",
    label: "Contact",
    icon: "mail",
    category: "sections",
    description: "Contact form section",
    defaultProps: { title: "Get in Touch" },
  },
  {
    type: "logos",
    label: "Logo Cloud",
    icon: "building",
    category: "sections",
    description: "Trusted-by logo strip",
    defaultProps: {
      title: "Trusted by",
      items: [
        { name: "Vercel", logo: "" },
        { name: "Stripe", logo: "" },
        { name: "Linear", logo: "" },
        { name: "Notion", logo: "" },
        { name: "Figma", logo: "" },
        { name: "GitHub", logo: "" },
      ],
    },
  },
  {
    type: "banner",
    label: "Banner",
    icon: "target",
    category: "sections",
    description: "Announcement or promo banner",
    defaultProps: { text: "🎉 New feature available — check it out!" },
  },
  {
    type: "gallery",
    label: "Gallery",
    icon: "image",
    category: "sections",
    description: "Image gallery grid",
    defaultProps: { columns: 3 },
  },
  {
    type: "footer",
    label: "Footer",
    icon: "clipboard",
    category: "sections",
    description: "Page footer with links and copyright",
    defaultProps: {
      copyright: "© 2026 Acme Inc. All rights reserved.",
      logo: "Acme",
      tagline: "Build better products, faster. The modern platform for ambitious teams.",
      columns: [
        { title: "Product", links: ["Features", "Pricing", "Changelog", "Docs", "API"] },
        { title: "Company", links: ["About", "Blog", "Careers", "Press", "Partners"] },
        { title: "Resources", links: ["Community", "Help Center", "Status", "Tutorials"] },
        { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
      ],
      socials: ["Twitter", "GitHub", "Discord", "LinkedIn"],
    },
  },

  // ── Content ──
  {
    type: "text",
    label: "Text",
    icon: "type",
    category: "content",
    description: "Rich text content block",
    defaultProps: { content: "Start typing your content here..." },
  },
  {
    type: "button-group",
    label: "Buttons",
    icon: "circle-dot",
    category: "content",
    description: "Group of action buttons",
    defaultProps: {
      buttons: [
        { text: "Primary", variant: "primary" },
        { text: "Secondary", variant: "secondary" },
      ],
    },
  },
  {
    type: "code",
    label: "Code",
    icon: "code",
    category: "content",
    description: "Code snippet block",
    defaultProps: { language: "javascript", code: "console.log('Hello!');" },
  },
  {
    type: "html",
    label: "HTML Embed",
    icon: "puzzle",
    category: "content",
    description: "Custom HTML embed",
    defaultProps: { html: "<div>Custom HTML</div>" },
  },

  // ── Layout ──
  {
    type: "container",
    label: "Container",
    icon: "package",
    category: "layout",
    description: "Simple container with a single drop zone",
    defaultProps: { maxWidth: "1200px", padding: "2rem" },
    zones: [{ name: "content", label: "Content" }],
  },
  {
    type: "grid",
    label: "Grid",
    icon: "grid",
    category: "layout",
    description: "CSS Grid container with configurable columns, rows, and gap",
    defaultProps: {
      columns: 2,
      gap: "16",
      rowGap: "",
      columnGap: "",
      justifyItems: "stretch",
      alignItems: "stretch",
      templateColumns: "",
      templateRows: "",
      autoFlow: "row",
    },
    zones: [
      { name: "cell-1", label: "Cell 1" },
    ],
  },
  {
    type: "flex-container",
    label: "Flex Container",
    icon: "maximize",
    category: "layout",
    description: "Flexbox container with configurable direction, gap, alignment",
    defaultProps: {
      direction: "row",
      gap: "16",
      justifyContent: "flex-start",
      alignItems: "stretch",
      wrap: "nowrap",
    },
    zones: [
      { name: "item-1", label: "Item 1" },
    ],
  },
  {
    type: "flex-row",
    label: "Flex Row",
    icon: "move-horizontal",
    category: "layout",
    description: "Horizontal flex container",
    defaultProps: { gap: "1rem", align: "stretch", justify: "start" },
    zones: [
      { name: "item-1", label: "Item 1" },
    ],
  },
  {
    type: "flex-col",
    label: "Flex Column",
    icon: "arrow-up-down",
    category: "layout",
    description: "Vertical flex container",
    defaultProps: { gap: "1rem" },
    zones: [{ name: "item-1", label: "Item 1" }],
  },
  {
    type: "columns",
    label: "Columns",
    icon: "columns",
    category: "layout",
    description: "Multi-column layout (2-4 columns)",
    defaultProps: { count: 2 },
    zones: [
      { name: "col-1", label: "Column 1" },
    ],
  },
  {
    type: "spacer",
    label: "Spacer",
    icon: "space",
    category: "layout",
    description: "Vertical spacing",
    defaultProps: { height: 64 },
  },
  {
    type: "divider",
    label: "Divider",
    icon: "minus",
    category: "layout",
    description: "Horizontal line separator",
    defaultProps: {},
  },

  // ── Media ──
  {
    type: "image",
    label: "Image",
    icon: "image",
    category: "media",
    description: "Full-width or contained image",
    defaultProps: { alt: "Image" },
  },
  {
    type: "video",
    label: "Video",
    icon: "video",
    category: "media",
    description: "Embedded video player",
    defaultProps: { url: "" },
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS — UI elements you can use inside blocks (curated for page builders)
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Actions
  {
    type: "Button",
    label: "Button",
    icon: "mouse-pointer",
    category: "actions",
    description: "Clickable action button",
  },
  {
    type: "Link",
    label: "Link",
    icon: "link",
    category: "actions",
    description: "Text navigation link",
  },
  {
    type: "Tooltip",
    label: "Tooltip",
    icon: "lightbulb",
    category: "actions",
    description: "Hover info tooltip",
  },
  {
    type: "Popover",
    label: "Popover",
    icon: "message-circle",
    category: "actions",
    description: "Click-triggered popup",
  },

  // Display
  {
    type: "Card",
    label: "Card",
    icon: "credit-card",
    category: "display",
    description: "Content container card",
  },
  {
    type: "Avatar",
    label: "Avatar",
    icon: "user-circle",
    category: "display",
    description: "User profile image",
  },
  {
    type: "Badge",
    label: "Badge",
    icon: "tag",
    category: "display",
    description: "Status indicator",
  },
  {
    type: "Chip",
    label: "Chip",
    icon: "tag",
    category: "display",
    description: "Compact tag element",
  },
  {
    type: "Accordion",
    label: "Accordion",
    icon: "folder-open",
    category: "display",
    description: "Collapsible panels",
  },
  {
    type: "Table",
    label: "Table",
    icon: "table",
    category: "display",
    description: "Data table",
  },
  {
    type: "Separator",
    label: "Separator",
    icon: "separator",
    category: "display",
    description: "Visual divider",
  },

  // Forms
  {
    type: "Input",
    label: "Input",
    icon: "text-cursor",
    category: "forms",
    description: "Text input field",
  },
  {
    type: "TextField",
    label: "Text Field",
    icon: "text-cursor",
    category: "forms",
    description: "Labeled text input",
  },
  {
    type: "TextArea",
    label: "Text Area",
    icon: "align-left",
    category: "forms",
    description: "Multi-line input",
  },
  {
    type: "Select",
    label: "Select",
    icon: "list-filter",
    category: "forms",
    description: "Dropdown selector",
  },
  {
    type: "Checkbox",
    label: "Checkbox",
    icon: "check-square",
    category: "forms",
    description: "Boolean toggle",
  },
  {
    type: "Switch",
    label: "Switch",
    icon: "toggle-left",
    category: "forms",
    description: "On/off toggle",
  },
  {
    type: "RadioGroup",
    label: "Radio Group",
    icon: "radio",
    category: "forms",
    description: "Single selection",
  },
  {
    type: "Slider",
    label: "Slider",
    icon: "sliders",
    category: "forms",
    description: "Range selector",
  },

  // Navigation
  {
    type: "Tabs",
    label: "Tabs",
    icon: "book-open",
    category: "navigation",
    description: "Tabbed content panels",
  },
];

// ── Block category metadata ──
export const BLOCK_CATEGORIES = {
  sections: {
    label: "Sections",
    icon: "",
    description: "Full page sections",
  },
  content: {
    label: "Content",
    icon: "",
    description: "Text and media blocks",
  },
  layout: { label: "Layout", icon: "", description: "Structure and spacing" },
  media: { label: "Media", icon: "", description: "Images and video" },
} as const;

export const COMPONENT_CATEGORIES = {
  actions: { label: "Actions", icon: "" },
  display: { label: "Display", icon: "" },
  forms: { label: "Forms", icon: "" },
  navigation: { label: "Navigation", icon: "" },
} as const;

// ── Default Design ──
export const DEFAULT_DESIGN: DesignSettings = {
  mood: "light",
  mainColor: "634CF8",
  backgroundTheme: "solid",
  backgroundOpacity: 15,
  typography: "inter",
  radius: "lg",
};

// ── Default Blocks — SaaS Landing Page ──
export const DEFAULT_BLOCKS: BlockInstance[] = [
  {
    id: "d-1",
    type: "banner",
    props: { text: "🚀 We just launched v2.0 — See what's new" },
  },
  {
    id: "d-2",
    type: "navbar",
    props: {
      logo: "Acme",
      links: ["Products", "Solutions", "Pricing", "Docs"],
    },
  },
  {
    id: "d-3",
    type: "hero",
    props: {
      headline: "Build products faster than ever",
      subtitle:
        "The modern platform for teams who ship. Streamline your workflow, collaborate in real-time, and deploy with confidence.",
      ctaText: "Start for free",
    },
  },
  {
    id: "d-4",
    type: "logos",
    props: { title: "Trusted by industry-leading companies" },
  },
  {
    id: "d-5",
    type: "features",
    props: {
      title: "Everything you need to ship fast",
      items: [
        {
          icon: "⚡",
          title: "Lightning Fast",
          description:
            "Built on edge infrastructure for sub-50ms response times globally.",
        },
        {
          icon: "🔒",
          title: "Enterprise Security",
          description:
            "SOC 2 Type II certified with end-to-end encryption and SSO.",
        },
        {
          icon: "📊",
          title: "Real-time Analytics",
          description:
            "Track every metric that matters with customizable dashboards.",
        },
        {
          icon: "🔄",
          title: "Seamless Integrations",
          description: "Connect with 200+ tools your team already uses.",
        },
      ],
    },
  },
  {
    id: "d-6",
    type: "stats",
    props: {
      items: [
        { value: "50K+", label: "Active developers" },
        { value: "99.99%", label: "Uptime SLA" },
        { value: "150ms", label: "Avg. response time" },
        { value: "2M+", label: "Deployments/month" },
      ],
    },
  },
  {
    id: "d-7",
    type: "testimonials",
    props: { title: "Loved by teams worldwide" },
  },
  {
    id: "d-8",
    type: "pricing",
    props: { title: "Simple, transparent pricing" },
  },
  { id: "d-9", type: "faq", props: { title: "Frequently asked questions" } },
  {
    id: "d-10",
    type: "cta",
    props: {
      headline: "Ready to accelerate your workflow?",
      subtitle:
        "Join 50,000+ developers who ship faster. Start your free trial today.",
      ctaText: "Get started for free",
    },
  },
  {
    id: "d-11",
    type: "footer",
    props: { copyright: "© 2026 Acme Inc. All rights reserved." },
  },
];

// ── Templates ──
export const TEMPLATES: Template[] = [
  {
    id: "saas-landing",
    name: "SaaS Landing",
    thumbnail: "",
    category: "saas",
    blocks: DEFAULT_BLOCKS,
    design: DEFAULT_DESIGN,
  },
  {
    id: "startup-launch",
    name: "Startup Launch",
    thumbnail: "",
    category: "saas",
    blocks: [
      {
        id: "s-1",
        type: "navbar",
        props: { logo: "LaunchPad", links: ["Features", "Pricing", "Blog"] },
      },
      {
        id: "s-2",
        type: "hero",
        props: {
          headline: "Ship your MVP in weeks, not months",
          subtitle:
            "From idea to production in record time. The fastest way to validate and launch your startup.",
          ctaText: "Start building",
        },
      },
      {
        id: "s-3",
        type: "features",
        props: {
          title: "Why founders choose us",
          items: [
            {
              icon: "🚀",
              title: "Rapid Prototyping",
              description: "Go from concept to clickable prototype in hours.",
            },
            {
              icon: "💳",
              title: "Built-in Payments",
              description:
                "Accept payments from day one with Stripe integration.",
            },
            {
              icon: "📈",
              title: "Growth Tools",
              description: "Analytics, A/B testing, and SEO built right in.",
            },
          ],
        },
      },
      {
        id: "s-4",
        type: "stats",
        props: {
          items: [
            { value: "500+", label: "Startups launched" },
            { value: "72hrs", label: "Avg. time to launch" },
            { value: "$2M+", label: "Revenue generated" },
            { value: "4.9★", label: "User rating" },
          ],
        },
      },
      { id: "s-5", type: "testimonials", props: { title: "Founders love us" } },
      {
        id: "s-6",
        type: "pricing",
        props: { title: "Start free, scale as you grow" },
      },
      {
        id: "s-7",
        type: "cta",
        props: {
          headline: "Your next big thing starts here",
          subtitle: "Join 500+ founders who launched with us.",
          ctaText: "Launch now",
        },
      },
      {
        id: "s-8",
        type: "footer",
        props: { copyright: "© 2026 LaunchPad. All rights reserved." },
      },
    ],
    design: { ...DEFAULT_DESIGN, mainColor: "F59E0B", radius: "xl" },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    thumbnail: "",
    category: "portfolio",
    blocks: [
      {
        id: "p-1",
        type: "navbar",
        props: {
          logo: "Sarah Chen",
          links: ["Work", "About", "Blog", "Contact"],
        },
      },
      {
        id: "p-2",
        type: "hero",
        props: {
          headline: "Design engineer crafting digital experiences",
          subtitle:
            "I help startups and enterprises build products that people love. Currently available for freelance projects.",
          ctaText: "View my work",
        },
      },
      { id: "p-3", type: "gallery", props: { title: "Selected Work" } },
      {
        id: "p-4",
        type: "content",
        props: {
          heading: "About me",
          body: "I'm a design engineer with 8+ years of experience building digital products. I specialize in design systems, interactive prototypes, and front-end development. Previously at Vercel, Stripe, and Linear.",
          body2:
            "When I'm not designing, you'll find me contributing to open-source projects, writing about design engineering on my blog, or exploring new cities with my camera.",
        },
      },
      { id: "p-5", type: "testimonials", props: { title: "What clients say" } },
      { id: "p-6", type: "contact", props: { title: "Let's work together" } },
      {
        id: "p-7",
        type: "footer",
        props: { copyright: "© 2026 Sarah Chen. All rights reserved." },
      },
    ],
    design: {
      ...DEFAULT_DESIGN,
      mood: "dark",
      mainColor: "10B981",
      radius: "xl",
    },
  },
  {
    id: "agency",
    name: "Agency",
    thumbnail: "",
    category: "business",
    blocks: [
      {
        id: "a-1",
        type: "navbar",
        props: {
          logo: "Studio",
          links: ["Services", "Work", "Team", "Contact"],
        },
      },
      {
        id: "a-2",
        type: "hero",
        props: {
          headline: "We build brands that move culture",
          subtitle:
            "A full-service creative agency specializing in brand strategy, digital design, and development for ambitious companies.",
          ctaText: "Start a project",
        },
      },
      {
        id: "a-3",
        type: "logos",
        props: { title: "Brands we've worked with" },
      },
      {
        id: "a-4",
        type: "features",
        props: {
          title: "Our services",
          items: [
            {
              icon: "🎨",
              title: "Brand Strategy",
              description:
                "Define your brand's voice, visual identity, and market positioning.",
            },
            {
              icon: "💻",
              title: "Web Development",
              description:
                "Custom websites and web apps built with modern technology.",
            },
            {
              icon: "📱",
              title: "Mobile Apps",
              description: "Native and cross-platform mobile experiences.",
            },
            {
              icon: "📊",
              title: "Growth Marketing",
              description:
                "Data-driven campaigns that drive real business results.",
            },
          ],
        },
      },
      {
        id: "a-5",
        type: "team",
        props: { title: "The people behind the work" },
      },
      { id: "a-6", type: "gallery", props: { title: "Recent Projects" } },
      {
        id: "a-7",
        type: "cta",
        props: {
          headline: "Have a project in mind?",
          subtitle:
            "Let's talk about how we can help bring your vision to life.",
          ctaText: "Get in touch",
        },
      },
      {
        id: "a-8",
        type: "footer",
        props: { copyright: "© 2026 Studio. All rights reserved." },
      },
    ],
    design: {
      ...DEFAULT_DESIGN,
      mainColor: "EC4899",
      radius: "lg",
      typography: "dm-sans",
    },
  },
  {
    id: "developer-tool",
    name: "Developer Tool",
    thumbnail: "",
    category: "saas",
    blocks: [
      {
        id: "dt-1",
        type: "banner",
        props: { text: "📦 v3.0 is here — Faster builds, smarter caching →" },
      },
      {
        id: "dt-2",
        type: "navbar",
        props: {
          logo: "DevKit",
          links: ["Docs", "Pricing", "Blog", "Changelog"],
        },
      },
      {
        id: "dt-3",
        type: "hero",
        props: {
          headline: "The developer toolkit that just works",
          subtitle:
            "Stop fighting your tools. DevKit handles builds, deployments, and infrastructure so you can focus on code.",
          ctaText: "npm install devkit",
        },
      },
      {
        id: "dt-4",
        type: "code",
        props: {
          language: "typescript",
          filename: "deploy.ts",
          code: "import { deploy } from '@devkit/sdk'\n\nconst app = await deploy({\n  name: 'my-app',\n  region: 'us-east-1',\n  env: { NODE_ENV: 'production' },\n})\n\nconsole.log(`Deployed to ${app.url}`)",
        },
      },
      {
        id: "dt-5",
        type: "features",
        props: {
          title: "Built for developers, by developers",
          items: [
            {
              icon: "⚡",
              title: "Zero Config",
              description:
                "Works out of the box. No webpack configs, no build scripts.",
            },
            {
              icon: "🔥",
              title: "Hot Reload",
              description: "See changes instantly. Sub-100ms refresh times.",
            },
            {
              icon: "🌍",
              title: "Edge Deploys",
              description:
                "Deploy to 300+ edge locations worldwide in seconds.",
            },
            {
              icon: "🔐",
              title: "Secrets Management",
              description:
                "Encrypted environment variables with team-level access.",
            },
          ],
        },
      },
      {
        id: "dt-6",
        type: "stats",
        props: {
          items: [
            { value: "100K+", label: "Developers" },
            { value: "5M+", label: "Builds/month" },
            { value: "<2s", label: "Deploy time" },
            { value: "300+", label: "Edge locations" },
          ],
        },
      },
      {
        id: "dt-7",
        type: "pricing",
        props: { title: "Free for individuals. Powerful for teams." },
      },
      { id: "dt-8", type: "faq", props: { title: "Common questions" } },
      {
        id: "dt-9",
        type: "cta",
        props: {
          headline: "Start shipping faster today",
          subtitle: "Free for personal projects. No credit card required.",
          ctaText: "Get started",
        },
      },
      {
        id: "dt-10",
        type: "footer",
        props: { copyright: "© 2026 DevKit. All rights reserved." },
      },
    ],
    design: {
      ...DEFAULT_DESIGN,
      mainColor: "3B82F6",
      radius: "lg",
      typography: "space-grotesk",
    },
  },
  {
    id: "landing-minimal",
    name: "Minimal Landing",
    thumbnail: "",
    category: "landing",
    blocks: [
      {
        id: "m-1",
        type: "navbar",
        props: { logo: "Mono", links: ["About", "Work", "Contact"] },
      },
      {
        id: "m-2",
        type: "hero",
        props: {
          headline: "Less noise. More signal.",
          subtitle:
            "A minimalist approach to building digital products. We strip away the unnecessary to reveal what matters.",
          ctaText: "Explore",
        },
      },
      {
        id: "m-3",
        type: "content",
        props: {
          heading: "Our philosophy",
          body: "We believe great design is invisible. It doesn't call attention to itself — it simply works. Every pixel, every interaction, every word serves a purpose.",
          body2:
            "Our process is rooted in research, refined through iteration, and validated by real users. We don't chase trends. We build things that last.",
        },
      },
      { id: "m-4", type: "divider", props: {} },
      { id: "m-5", type: "gallery", props: { title: "Selected Work" } },
      { id: "m-6", type: "contact", props: { title: "Say hello" } },
      {
        id: "m-7",
        type: "footer",
        props: { copyright: "© 2026 Mono. All rights reserved." },
      },
    ],
    design: {
      ...DEFAULT_DESIGN,
      mainColor: "171717",
      radius: "sm",
      typography: "sora",
    },
  },
];

// ── Helpers ──
let blockCounter = 100;
export function createBlockId(): string {
  return `block-${++blockCounter}-${Date.now()}`;
}
