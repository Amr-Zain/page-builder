import type { BlockInstance, DesignSettings, TypographyType } from "./types";
import type { PageSettings } from "./pages";
import { RADIUS_TOKENS } from "./tokens";

// ── Public Types ──

export interface HtmlExportOptions {
  blocks: BlockInstance[];
  design: DesignSettings;
  pageSettings: PageSettings;
}

// ── Font URL Map ──

const FONT_URLS: Record<TypographyType, string> = {
  inter:
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  "plus-jakarta":
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
  "space-grotesk":
    "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
  poppins:
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  "dm-sans":
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  sora: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap",
};

const FONT_FAMILIES: Record<TypographyType, string> = {
  inter: "'Inter', sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  poppins: "'Poppins', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  sora: "'Sora', sans-serif",
};

// ── Helpers ──

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function styleAttr(styles: Record<string, string> | undefined): string {
  if (!styles || typeof styles !== "object") return "";
  const css = Object.entries(styles)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
  return css ? ` style="${esc(css)}"` : "";
}

function getInlineStyles(props: Record<string, unknown>): string {
  return styleAttr(props._styles as Record<string, string> | undefined);
}
// ── Block HTML Generators ──

type BlockHtmlFn = (
  props: Record<string, unknown>,
  design: DesignSettings,
) => string;

const BLOCK_HTML_MAP: Record<string, BlockHtmlFn> = {
  navbar: (props) => {
    const logo = esc(String(props.logo ?? "Logo"));
    const links = Array.isArray(props.links) ? props.links : [];
    const linkHtml = links
      .map(
        (l) =>
          `<a href="#" style="text-decoration:none;color:inherit">${esc(String(l))}</a>`,
      )
      .join("\n          ");
    return `<nav style="display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;border-bottom:1px solid #e5e7eb">
      <div style="font-weight:700;font-size:1.25rem">${logo}</div>
      <div style="display:flex;gap:1.5rem;align-items:center">
        ${linkHtml}
        <a href="#" style="background:var(--main-color);color:#fff;padding:0.5rem 1rem;border-radius:var(--radius);text-decoration:none;font-weight:500">Get Started</a>
      </div>
    </nav>`;
  },

  hero: (props) => {
    const headline = esc(String(props.headline ?? "Your headline here"));
    const subtitle = esc(String(props.subtitle ?? ""));
    const ctaText = esc(String(props.ctaText ?? "Get Started"));
    return `<section style="text-align:center;padding:5rem 2rem">
      <h1 style="font-size:3rem;font-weight:700;margin:0 0 1rem">${headline}</h1>
      <p style="font-size:1.25rem;color:#6b7280;max-width:640px;margin:0 auto 2rem">${subtitle}</p>
      <div style="display:flex;gap:1rem;justify-content:center">
        <a href="#" style="background:var(--main-color);color:#fff;padding:0.75rem 1.5rem;border-radius:var(--radius);text-decoration:none;font-weight:600">${ctaText}</a>
      </div>
    </section>`;
  },

  features: (props) => {
    const title = esc(String(props.title ?? "Features"));
    const items = Array.isArray(props.items) ? props.items : [];
    const cardsHtml = items
      .map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return `<div style="padding:1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius)">
          <div style="font-size:2rem;margin-bottom:0.75rem">${esc(String(i.icon ?? ""))}</div>
          <h3 style="font-weight:600;margin:0 0 0.5rem">${esc(String(i.title ?? ""))}</h3>
          <p style="color:#6b7280;margin:0">${esc(String(i.description ?? ""))}</p>
        </div>`;
      })
      .join("\n      ");
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto">
        ${cardsHtml}
      </div>
    </section>`;
  },

  content: (props) => {
    const heading = esc(String(props.heading ?? ""));
    const body = esc(String(props.body ?? ""));
    const body2 = props.body2
      ? `<p style="color:#6b7280;max-width:700px;margin:1rem auto 0">${esc(String(props.body2))}</p>`
      : "";
    return `<section style="padding:4rem 2rem;text-align:center">
      ${heading ? `<h2 style="font-size:2rem;font-weight:700;margin:0 0 1rem">${heading}</h2>` : ""}
      <p style="color:#6b7280;max-width:700px;margin:0 auto">${body}</p>
      ${body2}
    </section>`;
  },

  testimonials: (props) => {
    const title = esc(String(props.title ?? "Testimonials"));
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto">
        <div style="padding:1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius)">
          <p style="font-style:italic;color:#6b7280;margin:0 0 1rem">"This product changed how our team works. Highly recommended."</p>
          <p style="font-weight:600;margin:0">— Alex Johnson</p>
        </div>
        <div style="padding:1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius)">
          <p style="font-style:italic;color:#6b7280;margin:0 0 1rem">"Incredible experience from start to finish. The support is top-notch."</p>
          <p style="font-weight:600;margin:0">— Maria Garcia</p>
        </div>
        <div style="padding:1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius)">
          <p style="font-style:italic;color:#6b7280;margin:0 0 1rem">"We saw a 40% improvement in productivity within the first month."</p>
          <p style="font-weight:600;margin:0">— David Kim</p>
        </div>
      </div>
    </section>`;
  },

  pricing: (props) => {
    const title = esc(String(props.title ?? "Pricing"));
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;max-width:900px;margin:0 auto">
        <div style="padding:2rem;border:1px solid #e5e7eb;border-radius:var(--radius)">
          <h3 style="font-weight:600;margin:0 0 0.5rem">Free</h3>
          <p style="font-size:2rem;font-weight:700;margin:0 0 1rem">$0<span style="font-size:1rem;color:#6b7280">/mo</span></p>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:#6b7280"><li>Up to 3 projects</li><li>Basic analytics</li><li>Community support</li></ul>
          <a href="#" style="display:inline-block;padding:0.5rem 1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius);text-decoration:none;color:inherit">Get Started</a>
        </div>
        <div style="padding:2rem;border:2px solid var(--main-color);border-radius:var(--radius);position:relative">
          <h3 style="font-weight:600;margin:0 0 0.5rem">Pro</h3>
          <p style="font-size:2rem;font-weight:700;margin:0 0 1rem">$29<span style="font-size:1rem;color:#6b7280">/mo</span></p>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:#6b7280"><li>Unlimited projects</li><li>Advanced analytics</li><li>Priority support</li></ul>
          <a href="#" style="display:inline-block;padding:0.5rem 1.5rem;background:var(--main-color);color:#fff;border-radius:var(--radius);text-decoration:none;font-weight:500">Get Started</a>
        </div>
        <div style="padding:2rem;border:1px solid #e5e7eb;border-radius:var(--radius)">
          <h3 style="font-weight:600;margin:0 0 0.5rem">Enterprise</h3>
          <p style="font-size:2rem;font-weight:700;margin:0 0 1rem">Custom</p>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:#6b7280"><li>Custom integrations</li><li>Dedicated support</li><li>SLA guarantee</li></ul>
          <a href="#" style="display:inline-block;padding:0.5rem 1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius);text-decoration:none;color:inherit">Contact Sales</a>
        </div>
      </div>
    </section>`;
  },

  stats: (props) => {
    const items = Array.isArray(props.items) ? props.items : [];
    const statsHtml = items
      .map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return `<div style="text-align:center">
          <div style="font-size:2.5rem;font-weight:700">${esc(String(i.value ?? ""))}</div>
          <div style="color:#6b7280;margin-top:0.25rem">${esc(String(i.label ?? ""))}</div>
        </div>`;
      })
      .join("\n      ");
    return `<section style="padding:4rem 2rem">
      <div style="display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;max-width:900px;margin:0 auto">
        ${statsHtml}
      </div>
    </section>`;
  },

  team: (props) => {
    const title = esc(String(props.title ?? "Our Team"));
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;max-width:800px;margin:0 auto">
        <div style="text-align:center">
          <div style="width:80px;height:80px;border-radius:50%;background:#e5e7eb;margin:0 auto 1rem"></div>
          <h3 style="font-weight:600;margin:0">Jane Doe</h3>
          <p style="color:#6b7280;margin:0.25rem 0 0">CEO &amp; Founder</p>
        </div>
        <div style="text-align:center">
          <div style="width:80px;height:80px;border-radius:50%;background:#e5e7eb;margin:0 auto 1rem"></div>
          <h3 style="font-weight:600;margin:0">John Smith</h3>
          <p style="color:#6b7280;margin:0.25rem 0 0">CTO</p>
        </div>
        <div style="text-align:center">
          <div style="width:80px;height:80px;border-radius:50%;background:#e5e7eb;margin:0 auto 1rem"></div>
          <h3 style="font-weight:600;margin:0">Emily Chen</h3>
          <p style="color:#6b7280;margin:0.25rem 0 0">Head of Design</p>
        </div>
      </div>
    </section>`;
  },

  faq: (props) => {
    const title = esc(String(props.title ?? "FAQ"));
    const items = Array.isArray(props.items) ? props.items : [];
    const faqHtml = items
      .map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return `<details style="border:1px solid #e5e7eb;border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem">
          <summary style="font-weight:600;cursor:pointer">${esc(String(i.q ?? ""))}</summary>
          <p style="color:#6b7280;margin:0.75rem 0 0">${esc(String(i.a ?? ""))}</p>
        </details>`;
      })
      .join("\n      ");
    return `<section style="padding:4rem 2rem;max-width:700px;margin:0 auto">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem;text-align:center">${title}</h2>
      ${faqHtml}
    </section>`;
  },

  gallery: (props) => {
    const title = props.title
      ? `<h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem;text-align:center">${esc(String(props.title))}</h2>`
      : "";
    const cols = Number(props.columns) || 3;
    return `<section style="padding:4rem 2rem">
      ${title}
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:1rem;max-width:1000px;margin:0 auto">
        <div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:var(--radius)"></div>
        <div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:var(--radius)"></div>
        <div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:var(--radius)"></div>
        <div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:var(--radius)"></div>
        <div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:var(--radius)"></div>
        <div style="aspect-ratio:4/3;background:#e5e7eb;border-radius:var(--radius)"></div>
      </div>
    </section>`;
  },

  cta: (props, design) => {
    const headline = esc(String(props.headline ?? "Ready to get started?"));
    const subtitle = esc(String(props.subtitle ?? ""));
    const ctaText = esc(String(props.ctaText ?? "Get Started"));
    const bg = `#${design.mainColor}`;
    return `<section style="padding:4rem 2rem;background:${bg};color:#fff;text-align:center;border-radius:var(--radius);margin:2rem">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 1rem">${headline}</h2>
      <p style="max-width:500px;margin:0 auto 2rem;opacity:0.9">${subtitle}</p>
      <a href="#" style="display:inline-block;padding:0.75rem 1.5rem;background:#fff;color:${bg};border-radius:var(--radius);text-decoration:none;font-weight:600">${ctaText}</a>
    </section>`;
  },

  contact: (props) => {
    const title = esc(String(props.title ?? "Contact"));
    return `<section style="padding:4rem 2rem;max-width:600px;margin:0 auto">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem;text-align:center">${title}</h2>
      <form style="display:flex;flex-direction:column;gap:1rem">
        <input type="text" placeholder="Name" style="padding:0.75rem;border:1px solid #e5e7eb;border-radius:var(--radius);font-size:1rem" />
        <input type="email" placeholder="Email" style="padding:0.75rem;border:1px solid #e5e7eb;border-radius:var(--radius);font-size:1rem" />
        <textarea placeholder="Message" rows="4" style="padding:0.75rem;border:1px solid #e5e7eb;border-radius:var(--radius);font-size:1rem;resize:vertical"></textarea>
        <button type="submit" style="padding:0.75rem 1.5rem;background:var(--main-color);color:#fff;border:none;border-radius:var(--radius);font-size:1rem;font-weight:600;cursor:pointer">Send Message</button>
      </form>
    </section>`;
  },

  logos: (props) => {
    const title = esc(String(props.title ?? "Trusted by"));
    return `<section style="padding:3rem 2rem;text-align:center">
      <p style="color:#6b7280;margin:0 0 1.5rem;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${title}</p>
      <div style="display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;opacity:0.5">
        <span style="font-size:1.25rem;font-weight:700">Vercel</span>
        <span style="font-size:1.25rem;font-weight:700">Stripe</span>
        <span style="font-size:1.25rem;font-weight:700">Linear</span>
        <span style="font-size:1.25rem;font-weight:700">Notion</span>
        <span style="font-size:1.25rem;font-weight:700">Figma</span>
      </div>
    </section>`;
  },

  banner: (props) => {
    const text = esc(String(props.text ?? ""));
    return `<div style="padding:0.75rem 2rem;background:var(--main-color);color:#fff;text-align:center;font-size:0.875rem">${text}</div>`;
  },

  footer: (props) => {
    const copyright = esc(String(props.copyright ?? ""));
    return `<footer style="padding:3rem 2rem;border-top:1px solid #e5e7eb">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:2rem;max-width:1000px;margin:0 auto 2rem">
        <div>
          <h4 style="font-weight:600;margin:0 0 0.75rem">Product</h4>
          <div style="display:flex;flex-direction:column;gap:0.5rem"><a href="#" style="color:#6b7280;text-decoration:none">Features</a><a href="#" style="color:#6b7280;text-decoration:none">Pricing</a><a href="#" style="color:#6b7280;text-decoration:none">Changelog</a></div>
        </div>
        <div>
          <h4 style="font-weight:600;margin:0 0 0.75rem">Company</h4>
          <div style="display:flex;flex-direction:column;gap:0.5rem"><a href="#" style="color:#6b7280;text-decoration:none">About</a><a href="#" style="color:#6b7280;text-decoration:none">Blog</a><a href="#" style="color:#6b7280;text-decoration:none">Careers</a></div>
        </div>
        <div>
          <h4 style="font-weight:600;margin:0 0 0.75rem">Legal</h4>
          <div style="display:flex;flex-direction:column;gap:0.5rem"><a href="#" style="color:#6b7280;text-decoration:none">Privacy</a><a href="#" style="color:#6b7280;text-decoration:none">Terms</a></div>
        </div>
      </div>
      <p style="text-align:center;color:#6b7280;margin:0;font-size:0.875rem">${copyright}</p>
    </footer>`;
  },

  text: (props) => {
    const content = esc(String(props.content ?? ""));
    return `<div style="padding:2rem;max-width:700px;margin:0 auto">
      <p style="margin:0;line-height:1.7">${content}</p>
    </div>`;
  },

  image: (props) => {
    const src = String(props.src ?? "");
    const alt = esc(String(props.alt ?? "Image"));
    return `<figure style="padding:2rem;margin:0;text-align:center">
      <img src="${esc(src)}" alt="${alt}" style="max-width:100%;height:auto;border-radius:var(--radius)" />
    </figure>`;
  },

  video: (props) => {
    const url = String(props.url ?? "");
    return `<div style="padding:2rem;text-align:center">
      <div style="aspect-ratio:16/9;background:#111;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:#fff;max-width:800px;margin:0 auto">
        ${url ? `<p style="margin:0">Video: ${esc(url)}</p>` : '<p style="margin:0">▶ Video placeholder</p>'}
      </div>
    </div>`;
  },

  "button-group": (props) => {
    const buttons = Array.isArray(props.buttons) ? props.buttons : [];
    const btnsHtml = buttons
      .map((btn: unknown) => {
        const b = btn as Record<string, unknown>;
        const text = esc(String(b.text ?? "Button"));
        const isPrimary = b.variant === "primary";
        const style = isPrimary
          ? "background:var(--main-color);color:#fff;border:none"
          : "background:transparent;color:inherit;border:1px solid #e5e7eb";
        return `<a href="#" style="${style};padding:0.5rem 1.25rem;border-radius:var(--radius);text-decoration:none;font-weight:500;display:inline-block">${text}</a>`;
      })
      .join("\n      ");
    return `<div style="padding:2rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
      ${btnsHtml}
    </div>`;
  },

  columns: (props) => {
    const count = Number(props.count) || 2;
    const colsHtml = Array.from({ length: count })
      .map(
        () =>
          `<div style="padding:1rem;border:1px dashed #d1d5db;border-radius:var(--radius);min-height:100px">Column</div>`,
      )
      .join("\n      ");
    return `<div style="display:grid;grid-template-columns:repeat(${count},1fr);gap:1rem;padding:2rem">
      ${colsHtml}
    </div>`;
  },

  grid: (props) => {
    const cols = Number(props.columns) || 2;
    const gap = props.gap || "16";
    const templateCols = props.templateColumns || `repeat(${cols}, 1fr)`;
    return `<div style="display:grid;grid-template-columns:${templateCols};gap:${gap}px;${props.justifyItems ? `justify-items:${props.justifyItems};` : ""}${props.alignItems ? `align-items:${props.alignItems};` : ""}padding:1rem"></div>`;
  },

  "flex-container": (props) => {
    const dir = props.direction || "row";
    const gap = props.gap || "16";
    return `<div style="display:flex;flex-direction:${dir};gap:${gap}px;${props.justifyContent ? `justify-content:${props.justifyContent};` : ""}${props.alignItems ? `align-items:${props.alignItems};` : ""}${props.wrap ? `flex-wrap:${props.wrap};` : ""}padding:1rem"></div>`;
  },

  spacer: (props) => {
    const height = Number(props.height) || 64;
    return `<div style="height:${height}px"></div>`;
  },

  divider: () => {
    return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:2rem 0" />`;
  },

  code: (props) => {
    const code = esc(String(props.code ?? ""));
    const language = esc(String(props.language ?? ""));
    return `<pre style="background:#1e1e2e;color:#cdd6f4;padding:1.5rem;border-radius:var(--radius);overflow-x:auto;margin:2rem"><code data-language="${language}">${code}</code></pre>`;
  },

  html: (props) => {
    const rawHtml = String(props.html ?? "");
    return `<div>${rawHtml}</div>`;
  },
};

// ── Render a single block ──

function renderBlock(block: BlockInstance, design: DesignSettings): string {
  const generator = BLOCK_HTML_MAP[block.type];
  if (!generator) {
    return `<!-- Unsupported block: ${esc(block.type)} -->`;
  }
  const inner = generator(block.props, design);
  const inlineStyle = getInlineStyles(block.props);
  const anim = block.props._animation as string;
  const animClass =
    anim && anim !== "none"
      ? ` class="pb-animate" data-animation="${esc(anim)}"`
      : "";
  const section = block.props._section as Record<string, string> | undefined;

  // Render nested children if present
  let childrenHtml = "";
  if (block.children) {
    for (const [zoneName, zoneBlocks] of Object.entries(block.children)) {
      if (zoneBlocks.length > 0) {
        const zoneContent = zoneBlocks.map((child) => renderBlock(child, design)).join("\n");
        childrenHtml += `\n<div data-zone="${esc(zoneName)}" style="flex:1;min-width:0">${zoneContent}</div>`;
      }
    }
    if (childrenHtml) {
      childrenHtml = `<div style="display:flex;gap:1rem">${childrenHtml}\n</div>`;
    }
  }

  let html = `<div data-block-id="${esc(block.id)}" data-block-type="${esc(block.type)}"${inlineStyle}${animClass}>${inner}${childrenHtml}</div>`;

  if (section?.bgImage || section?.bgOverlay) {
    const overlay = section?.bgOverlay
      ? `<div style="position:absolute;inset:0;background:${esc(section.bgOverlay)}"></div>`
      : "";
    html = `<div style="position:relative${section?.bgImage ? `;background-image:url(${esc(section.bgImage)});background-size:cover;background-position:center` : ""}">${overlay}<div style="position:relative">${html}</div></div>`;
  }

  return html;
}

// ── Main Export Function ──

export function generateHtml(options: HtmlExportOptions): string {
  const { blocks, design, pageSettings } = options;

  const fontUrl = FONT_URLS[design.typography];
  const fontFamily = FONT_FAMILIES[design.typography];
  const radiusToken = RADIUS_TOKENS[design.radius] ?? RADIUS_TOKENS.lg;
  const radiusValue = radiusToken.value;
  const mainColor = `#${design.mainColor}`;
  const moodClass = design.mood === "dark" ? "dark" : "light";

  const blocksHtml = blocks.map((b) => renderBlock(b, design)).join("\n");

  // Collect animation presets used (recursively)
  const usedAnimations = new Set<string>();
  function collectAnimations(blockList: BlockInstance[]) {
    for (const b of blockList) {
      const anim = b.props._animation as string;
      if (anim && anim !== "none") usedAnimations.add(anim);
      if (b.children) {
        for (const zone of Object.values(b.children)) {
          collectAnimations(zone);
        }
      }
    }
  }
  collectAnimations(blocks);

  // Animation keyframes CSS
  const animationCSS =
    usedAnimations.size > 0
      ? `
  <style>
    .pb-animate { opacity: 0; }
    .pb-animate.pb-visible { animation-duration: 0.6s; animation-fill-mode: forwards; }
    ${[...usedAnimations]
      .map((a) => {
        const keyframes: Record<string, string> = {
          "fade-in":
            "@keyframes pb-fade-in { from { opacity: 0; } to { opacity: 1; } }",
          "fade-up":
            "@keyframes pb-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }",
          "fade-down":
            "@keyframes pb-fade-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }",
          "slide-up":
            "@keyframes pb-slide-up { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }",
          "slide-down":
            "@keyframes pb-slide-down { from { transform: translateY(-40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }",
          "slide-left":
            "@keyframes pb-slide-left { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }",
          "slide-right":
            "@keyframes pb-slide-right { from { transform: translateX(-40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }",
          "zoom-in":
            "@keyframes pb-zoom-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }",
          "zoom-out":
            "@keyframes pb-zoom-out { from { transform: scale(1.1); opacity: 0; } to { transform: scale(1); opacity: 1; } }",
          bounce:
            "@keyframes pb-bounce { 0% { transform: translateY(20px); opacity: 0; } 60% { transform: translateY(-5px); opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }",
        };
        return `${keyframes[a] || ""}\n    .pb-animate.pb-visible[data-animation="${a}"] { animation-name: pb-${a}; }`;
      })
      .join("\n    ")}
  </style>`
      : "";

  // Intersection Observer script for animations
  const animationScript =
    usedAnimations.size > 0
      ? `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('pb-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      document.querySelectorAll('.pb-animate').forEach(function(el) { observer.observe(el); });
    });
  </script>`
      : "";

  // Form submission script
  function hasBlockType(blockList: BlockInstance[], type: string): boolean {
    for (const b of blockList) {
      if (b.type === type) return true;
      if (b.children) {
        for (const zone of Object.values(b.children)) {
          if (hasBlockType(zone, type)) return true;
        }
      }
    }
    return false;
  }
  const hasContactForm = hasBlockType(blocks, "contact");
  const formScript = hasContactForm
    ? `
  <script>
    document.querySelectorAll('form[data-form-action]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var data = Object.fromEntries(new FormData(form));
        var method = form.dataset.formMethod || 'localStorage';
        var blockId = form.dataset.blockId || 'form';
        if (method === 'email') {
          var email = form.dataset.formEmail || '';
          window.location.href = 'mailto:' + email + '?subject=Form Submission&body=' + encodeURIComponent(JSON.stringify(data));
        } else if (method === 'webhook') {
          var url = form.dataset.formWebhook || '';
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          alert('Form submitted!');
        } else {
          localStorage.setItem('form-' + blockId, JSON.stringify(data));
          alert('Form saved!');
        }
      });
    });
  </script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" class="${moodClass}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(pageSettings.title)}</title>
  <meta name="description" content="${esc(pageSettings.description)}" />
  ${pageSettings.ogImage ? `<meta property="og:image" content="${esc(pageSettings.ogImage)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fontUrl}" rel="stylesheet" />
  <style>
    :root {
      --main-color: ${mainColor};
      --radius: ${radiusValue};
      --font-family: ${fontFamily};
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-family);
      line-height: 1.6;
      color: ${design.mood === "dark" ? "#f9fafb" : "#111827"};
      background: ${design.mood === "dark" ? "#111827" : "#ffffff"};
    }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
  </style>
  ${animationCSS}
  ${pageSettings.customCSS ? `<style>\n${pageSettings.customCSS}\n  </style>` : ""}
  ${pageSettings.headCode ?? ""}
</head>
<body>
${blocksHtml}
${animationScript}
${formScript}
${pageSettings.bodyCode ?? ""}
</body>
</html>`;
}

// ── Download Helper ──

export function downloadHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
