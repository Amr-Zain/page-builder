import type { BlockInstance, DesignSettings, TypographyType } from "./types";
import type { Page, PageSettings } from "./pages";
import { RADIUS_TOKENS } from "./tokens";

// ── Public Types ──

export interface HtmlExportOptions {
  blocks: BlockInstance[];
  design: DesignSettings;
  pageSettings: PageSettings;
  allPages?: Page[];
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

function ensureRelative(url: string): string {
  if (!url || url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) {
    return url;
  }
  // Remove leading slash and ensure .html extension if it's a page path without one
  let clean = url.replace(/^\/+/, "");
  if (clean && !clean.includes(".") && !clean.includes("#")) {
    clean += ".html";
  }
  return clean || "index.html";
}

// ── Block HTML Generators ──

type BlockHtmlFn = (
  props: Record<string, any>,
  design: DesignSettings,
  childrenHtml?: string,
  options?: HtmlExportOptions,
) => string;

const BLOCK_HTML_MAP: Record<string, BlockHtmlFn> = {
  navbar: (props, _design, _children, options) => {
    const logo = esc(String(props.logo ?? "Logo"));
    const rawLinks = Array.isArray(props.links) ? props.links : [];
    const currentLocale = options?.pageSettings.locale || "en";
    
    // Resolve links
    const links = rawLinks.map((link: any) => {
      if (typeof link === "string") return { label: link, url: "#" };
      const l = link as { label: string; url?: string; pageId?: string };
      let url = l.url || "#";
      
      // Resolve pageId to actual URL
      if (l.pageId && options?.allPages) {
        const targetPage = options.allPages.find((p: Page) => String(p.id) === String(l.pageId));
        if (targetPage) {
          const targetLocale = targetPage.settings.locale || "en";
          // Ensure slug doesn't have a leading slash
          const cleanSlug = (targetPage.settings.slug || "index").replace(/^\//, "");
          const prefix = (currentLocale === "ar" && targetLocale !== "ar") ? "../" : 
                         (currentLocale !== "ar" && targetLocale === "ar") ? "ar/" : "";
          url = `${prefix}${cleanSlug}.html`;
        } else {
          url = ensureRelative(url);
        }
      } else {
        url = ensureRelative(url);
      }
      return { label: l.label, url };
    });

    const linkHtml = links.map((l: { label: string; url: string }) => 
      `<a href="${esc(l.url)}" style="text-decoration:none;font-weight:500;font-size:0.9375rem;color:var(--muted-text)">${esc(l.label)}</a>`
    ).join("");

    // Language switcher
    let switcherHtml = "";
    if (options?.allPages && options.pageSettings.translationGroupId) {
      const otherLang = currentLocale === "en" ? "ar" : "en";
      const translation = options.allPages.find(
        (p: Page) => p.settings.translationGroupId === options.pageSettings.translationGroupId && p.settings.locale === otherLang
      );
      
      if (translation) {
        const prefix = currentLocale === "ar" ? "../" : "ar/";
        const targetUrl = `${prefix}${translation.settings.slug || "index"}.html`;
        switcherHtml = `
          <div style="width:1px;height:1.5rem;background:#e5e7eb;margin:0 0.5rem"></div>
          <a href="${esc(targetUrl)}" style="text-decoration:none;color:var(--main-color);font-size:0.75rem;font-weight:700;text-transform:uppercase;padding:0.25rem 0.5rem;border:1px solid var(--main-color);border-radius:4px">
            ${otherLang}
          </a>`;
      }
    }

    const themeToggle = `
      <button class="pb-theme-toggle" style="background:transparent;border:1px solid #e5e7eb;padding:0.5rem;border-radius:var(--radius);cursor:pointer;display:flex;align-items:center;justify-content:center;color:inherit;width:34px;height:34px">
        <svg class="sun-icon" style="display:none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg class="moon-icon" style="display:none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <script>
        (function() {
          const btn = document.currentScript.previousElementSibling;
          const sun = btn.querySelector('.sun-icon');
          const moon = btn.querySelector('.moon-icon');
          function updateIcons(isDark) {
            sun.style.display = isDark ? 'block' : 'none';
            moon.style.display = isDark ? 'none' : 'block';
          }
          const isDark = document.documentElement.classList.contains('dark');
          updateIcons(isDark);
          btn.addEventListener('click', () => {
            const nowDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('pb-theme', nowDark ? 'dark' : 'light');
            updateIcons(nowDark);
          });
        })();
      </script>
    `;

    const mobileMenu = `
      <div class="pb-mobile-menu" style="display:none;padding:1.5rem;border-top:1px solid var(--border-color);background:var(--bg-color)">
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          ${links.map(l => `<a href="${esc(l.url)}" style="text-decoration:none;color:var(--text-color);font-weight:600;font-size:1rem">${esc(l.label)}</a>`).join("")}
          ${switcherHtml}
        </div>
      </div>
    `;

    const hamburger = `
      <button class="pb-hamburger" style="background:transparent;border:none;padding:0.5rem;cursor:pointer;color:inherit;align-items:center;justify-content:center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    `;

    return `<nav class="pb-navbar">
      <div class="pb-nav-container">
        <div class="pb-nav-logo">${logo}</div>
        <div class="pb-nav-right">
          <div class="pb-nav-links">
            ${linkHtml}
            ${switcherHtml}
          </div>
          <div class="pb-nav-actions">
            ${themeToggle}
            <a href="#" class="pb-nav-cta">Get Started</a>
            ${hamburger}
          </div>
        </div>
      </div>
      ${mobileMenu}
      <script>
        (function() {
          const nav = document.currentScript.parentElement;
          const burger = nav.querySelector('.pb-hamburger');
          const menu = nav.querySelector('.pb-mobile-menu');
          if (burger && menu) {
            burger.addEventListener('click', () => {
              const isOpen = menu.style.display === 'block';
              menu.style.display = isOpen ? 'none' : 'block';
            });
          }
        })();
      </script>
    </nav>`;
  },

  hero: (props, _design) => {
    const headline = esc(String(props.headline ?? "Your headline here"));
    const subtitle = esc(String(props.subtitle ?? ""));
    const ctaText = esc(String(props.ctaText ?? "Get Started"));
    return `<section style="text-align:center;padding:5rem 2rem">
      <h1 style="font-size:3rem;font-weight:700;margin:0 0 1rem">${headline}</h1>
      <p style="font-size:1.25rem;color:var(--muted-text);max-width:640px;margin:0 auto 2rem">${subtitle}</p>
      <div style="display:flex;gap:1rem;justify-content:center">
        <a href="#" style="background:var(--main-color);color:#fff;padding:0.75rem 1.5rem;border-radius:var(--radius);text-decoration:none;font-weight:600">${ctaText}</a>
      </div>
    </section>`;
  },

  features: (props, _design) => {
    const title = esc(String(props.title ?? "Features"));
    const items = Array.isArray(props.items) ? props.items : [];
    const cardsHtml = items
      .map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return `<div style="padding:1.5rem;border:1px solid var(--border-color);border-radius:var(--radius)">
          <div style="font-size:2rem;margin-bottom:0.75rem">${esc(String(i.icon ?? ""))}</div>
          <h3 style="font-weight:600;margin:0 0 0.5rem">${esc(String(i.title ?? ""))}</h3>
          <p style="color:var(--muted-text);margin:0">${esc(String(i.description ?? ""))}</p>
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

  content: (props, _design) => {
    const heading = esc(String(props.heading ?? ""));
    const body = esc(String(props.body ?? ""));
    const body2 = props.body2
      ? `<p style="color:var(--muted-text);max-width:700px;margin:1rem auto 0">${esc(String(props.body2))}</p>`
      : "";
    return `<section style="padding:4rem 2rem;text-align:center">
      ${heading ? `<h2 style="font-size:2rem;font-weight:700;margin:0 0 1rem">${heading}</h2>` : ""}
      <p style="color:var(--muted-text);max-width:700px;margin:0 auto">${body}</p>
      ${body2}
    </section>`;
  },

  testimonials: (props, _design) => {
    const title = esc(String(props.title ?? "Testimonials"));
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;max-width:1000px;margin:0 auto">
        <div style="padding:1.5rem;border:1px solid var(--border-color);border-radius:var(--radius)">
          <p style="font-style:italic;color:var(--muted-text);margin:0 0 1rem">"This product changed how our team works. Highly recommended."</p>
          <p style="font-weight:600;margin:0">— Alex Johnson</p>
        </div>
        <div style="padding:1.5rem;border:1px solid var(--border-color);border-radius:var(--radius)">
          <p style="font-style:italic;color:#6b7280;margin:0 0 1rem">"Incredible experience from start to finish. The support is top-notch."</p>
          <p style="font-weight:600;margin:0">— Maria Garcia</p>
        </div>
        <div style="padding:1.5rem;border:1px solid var(--border-color);border-radius:var(--radius)">
          <p style="font-style:italic;color:#6b7280;margin:0 0 1rem">"We saw a 40% improvement in productivity within the first month."</p>
          <p style="font-weight:600;margin:0">— David Kim</p>
        </div>
      </div>
    </section>`;
  },

  pricing: (props, _design) => {
    const title = esc(String(props.title ?? "Pricing"));
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;max-width:900px;margin:0 auto">
        <div style="padding:2rem;border:1px solid var(--border-color);border-radius:var(--radius)">
          <h3 style="font-weight:600;margin:0 0 0.5rem">Free</h3>
          <p style="font-size:2rem;font-weight:700;margin:0 0 1rem">$0<span style="font-size:1rem;color:var(--muted-text)">/mo</span></p>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:var(--muted-text)"><li>Up to 3 projects</li><li>Basic analytics</li><li>Community support</li></ul>
          <a href="#" style="display:inline-block;padding:0.5rem 1.5rem;border:1px solid var(--border-color);border-radius:var(--radius);text-decoration:none;color:inherit">Get Started</a>
        </div>
        <div style="padding:2rem;border:2px solid var(--main-color);border-radius:var(--radius);position:relative">
          <h3 style="font-weight:600;margin:0 0 0.5rem">Pro</h3>
          <p style="font-size:2rem;font-weight:700;margin:0 0 1rem">$29<span style="font-size:1rem;color:#6b7280">/mo</span></p>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:#6b7280"><li>Unlimited projects</li><li>Advanced analytics</li><li>Priority support</li></ul>
          <a href="#" style="display:inline-block;padding:0.5rem 1.5rem;background:var(--main-color);color:#fff;border-radius:var(--radius);text-decoration:none;font-weight:500">Get Started</a>
        </div>
        <div style="padding:2rem;border:1px solid var(--border-color);border-radius:var(--radius)">
          <h3 style="font-weight:600;margin:0 0 0.5rem">Enterprise</h3>
          <p style="font-size:2rem;font-weight:700;margin:0 0 1rem">Custom</p>
          <ul style="list-style:none;padding:0;margin:0 0 1.5rem;color:#6b7280"><li>Custom integrations</li><li>Dedicated support</li><li>SLA guarantee</li></ul>
          <a href="#" style="display:inline-block;padding:0.5rem 1.5rem;border:1px solid #e5e7eb;border-radius:var(--radius);text-decoration:none;color:inherit">Contact Sales</a>
        </div>
      </div>
    </section>`;
  },

  stats: (props, _design) => {
    const items = Array.isArray(props.items) ? props.items : [];
    const statsHtml = items
      .map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return `<div style="text-align:center">
          <div style="font-size:2.5rem;font-weight:700">${esc(String(i.value ?? ""))}</div>
          <div style="color:var(--muted-text);margin-top:0.25rem">${esc(String(i.label ?? ""))}</div>
        </div>`;
      })
      .join("\n      ");
    return `<section style="padding:4rem 2rem">
      <div style="display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;max-width:900px;margin:0 auto">
        ${statsHtml}
      </div>
    </section>`;
  },

  team: (props, _design) => {
    const title = esc(String(props.title ?? "Our Team"));
    return `<section style="padding:4rem 2rem;text-align:center">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem">${title}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;max-width:800px;margin:0 auto">
        <div style="text-align:center">
          <div style="width:80px;height:80px;border-radius:50%;background:#e5e7eb;margin:0 auto 1rem"></div>
          <h3 style="font-weight:600;margin:0">Jane Doe</h3>
          <p style="color:var(--muted-text);margin:0.25rem 0 0">CEO &amp; Founder</p>
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

  faq: (props, _design) => {
    const title = esc(String(props.title ?? "FAQ"));
    const items = Array.isArray(props.items) ? props.items : [];
    const faqHtml = items
      .map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return `<details style="border:1px solid var(--border-color);border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem">
          <summary style="font-weight:600;cursor:pointer">${esc(String(i.q ?? ""))}</summary>
          <p style="color:var(--muted-text);margin:0.75rem 0 0">${esc(String(i.a ?? ""))}</p>
        </details>`;
      })
      .join("\n      ");
    return `<section style="padding:4rem 2rem;max-width:700px;margin:0 auto">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem;text-align:center">${title}</h2>
      ${faqHtml}
    </section>`;
  },

  gallery: (props, _design) => {
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

  contact: (props, _design) => {
    const title = esc(String(props.title ?? "Contact"));
    return `<section style="padding:4rem 2rem;max-width:600px;margin:0 auto">
      <h2 style="font-size:2rem;font-weight:700;margin:0 0 2rem;text-align:center">${title}</h2>
      <form style="display:flex;flex-direction:column;gap:1rem">
        <input type="text" placeholder="Name" style="padding:0.75rem;border:1px solid var(--border-color);border-radius:var(--radius);font-size:1rem;background:var(--bg-color);color:var(--text-color)" />
        <input type="email" placeholder="Email" style="padding:0.75rem;border:1px solid #e5e7eb;border-radius:var(--radius);font-size:1rem" />
        <textarea placeholder="Message" rows="4" style="padding:0.75rem;border:1px solid var(--border-color);border-radius:var(--radius);font-size:1rem;resize:vertical;background:var(--bg-color);color:var(--text-color)"></textarea>
        <button type="submit" style="padding:0.75rem 1.5rem;background:var(--main-color);color:#fff;border:none;border-radius:var(--radius);font-size:1rem;font-weight:600;cursor:pointer">Send Message</button>
      </form>
    </section>`;
  },

  logos: (props, _design) => {
    const title = esc(String(props.title ?? "Trusted by"));
    return `<section style="padding:3rem 2rem;text-align:center">
      <p style="color:var(--muted-text);margin:0 0 1.5rem;font-size:0.875rem;text-transform:uppercase;letter-spacing:0.05em">${title}</p>
      <div style="display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;opacity:0.5">
        <span style="font-size:1.25rem;font-weight:700">Vercel</span>
        <span style="font-size:1.25rem;font-weight:700">Stripe</span>
        <span style="font-size:1.25rem;font-weight:700">Linear</span>
        <span style="font-size:1.25rem;font-weight:700">Notion</span>
        <span style="font-size:1.25rem;font-weight:700">Figma</span>
      </div>
    </section>`;
  },

  banner: (props, _design) => {
    const text = esc(String(props.text ?? ""));
    return `<div style="padding:0.75rem 2rem;background:var(--main-color);color:#fff;text-align:center;font-size:0.875rem">${text}</div>`;
  },

  footer: (props, _design, _children, options) => {
    const copyright = esc(String(props.copyright ?? ""));
    const rawLinks = Array.isArray(props.links) ? props.links : [];
    const currentLocale = options?.pageSettings.locale || "en";
    
    // Group links by "column" if provided, otherwise generic list
    const links = rawLinks.map((link: any) => {
      if (typeof link === "string") return { label: link, url: "#" };
      const l = link as { label: string; url?: string; pageId?: string };
      let url = l.url || "#";
      if (l.pageId && options?.allPages) {
        const targetPage = options.allPages.find((p: Page) => String(p.id) === String(l.pageId));
        if (targetPage) {
          const targetLocale = targetPage.settings.locale || "en";
          const cleanSlug = (targetPage.settings.slug || "index").replace(/^\//, "");
          const prefix = (currentLocale === "ar" && targetLocale !== "ar") ? "../" : 
                         (currentLocale !== "ar" && targetLocale === "ar") ? "ar/" : "";
          url = `${prefix}${cleanSlug}.html`;
        } else {
          url = ensureRelative(url);
        }
      } else {
        url = ensureRelative(url);
      }
      return { label: l.label, url };
    });

    const linkListHtml = links.length > 0 
      ? links.map((l: { label: string; url: string }) => `<a href="${esc(l.url)}" style="color:var(--muted-text);text-decoration:none;font-size:0.875rem">${esc(l.label)}</a>`).join("")
      : `<a href="#" style="color:var(--muted-text);text-decoration:none;font-size:0.875rem">Features</a><a href="#" style="color:var(--muted-text);text-decoration:none;font-size:0.875rem">Pricing</a><a href="#" style="color:var(--muted-text);text-decoration:none;font-size:0.875rem">About</a>`;

    return `<footer style="padding:4rem 2rem;border-top:1px solid var(--border-color)">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:3rem;max-width:1100px;margin:0 auto 3rem">
        <div>
          <h4 style="font-weight:700;margin:0 0 1.25rem;font-size:1rem">Links</h4>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            ${linkListHtml}
          </div>
        </div>
        <div>
          <h4 style="font-weight:700;margin:0 0 1.25rem;font-size:1rem">Company</h4>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem">About Us</a>
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem">Careers</a>
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem">Blog</a>
          </div>
        </div>
        <div>
          <h4 style="font-weight:700;margin:0 0 1.25rem;font-size:1rem">Legal</h4>
          <div style="display:flex;flex-direction:column;gap:0.75rem">
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem">Privacy Policy</a>
            <a href="#" style="color:#6b7280;text-decoration:none;font-size:0.875rem">Terms of Service</a>
          </div>
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;margin:0;font-size:0.875rem;border-top:1px solid var(--border-color);padding-top:2rem">${copyright}</p>
    </footer>`;
  },

  text: (props, _design) => {
    const content = esc(String(props.content ?? ""));
    return `<div style="padding:2rem;max-width:700px;margin:0 auto">
      <p style="margin:0;line-height:1.7">${content}</p>
    </div>`;
  },

  image: (props, _design) => {
    const src = String(props.src ?? "");
    const alt = esc(String(props.alt ?? "Image"));
    return `<figure style="padding:2rem;margin:0;text-align:center">
      <img src="${esc(src)}" alt="${alt}" style="max-width:100%;height:auto;border-radius:var(--radius)" />
    </figure>`;
  },

  video: (props, _design) => {
    const url = String(props.url ?? "");
    return `<div style="padding:2rem;text-align:center">
      <div style="aspect-ratio:16/9;background:#111;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:#fff;max-width:800px;margin:0 auto">
        ${url ? `<p style="margin:0">Video: ${esc(url)}</p>` : '<p style="margin:0">▶ Video placeholder</p>'}
      </div>
    </div>`;
  },

  "button-group": (props, _design) => {
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

  columns: (props, _design, childrenHtml) => {
    const count = Number(props.count) || 2;
    return `<div style="display:grid;grid-template-columns:repeat(${count},1fr);gap:1rem;padding:2rem">${childrenHtml || ""}</div>`;
  },
  
  container: (props, _design, childrenHtml) => {
    return `<div style="max-width:${props.maxWidth || "1200px"};margin:0 auto;padding:2rem">${childrenHtml || ""}</div>`;
  },

  grid: (props, _design, childrenHtml) => {
    const cols = Number(props.columns) || 2;
    const gap = props.gap || "16";
    const templateCols = props.templateColumns || `repeat(${cols}, 1fr)`;
    return `<div style="display:grid;grid-template-columns:${templateCols};gap:${gap}px;${props.justifyItems ? `justify-items:${props.justifyItems};` : ""}${props.alignItems ? `align-items:${props.alignItems};` : ""}padding:1rem">${childrenHtml || ""}</div>`;
  },

  "flex-container": (props, _design, childrenHtml) => {
    const dir = props.direction || "row";
    const gap = props.gap || "16";
    return `<div style="display:flex;flex-direction:${dir};gap:${gap}px;${props.justifyContent ? `justify-content:${props.justifyContent};` : ""}${props.alignItems ? `align-items:${props.alignItems};` : ""}${props.wrap ? `flex-wrap:${props.wrap};` : ""}padding:1rem">${childrenHtml || ""}</div>`;
  },
  
  "flex-row": (props, _design, childrenHtml) => {
    const gap = props.gap || "1rem";
    return `<div style="display:flex;flex-direction:row;gap:${gap};${props.justify ? `justify-content:${props.justify};` : ""}${props.align ? `align-items:${props.align};` : ""}padding:1rem">${childrenHtml || ""}</div>`;
  },
  
  "flex-col": (props, _design, childrenHtml) => {
    const gap = props.gap || "1rem";
    return `<div style="display:flex;flex-direction:column;gap:${gap};${props.justify ? `justify-content:${props.justify};` : ""}${props.align ? `align-items:${props.align};` : ""}padding:1rem">${childrenHtml || ""}</div>`;
  },

  spacer: (props, _design) => {
    const height = Number(props.height) || 64;
    return `<div style="height:${height}px"></div>`;
  },

  divider: (_props, _design) => {
    return `<hr style="border:none;border-top:1px solid var(--border-color);margin:2rem 0" />`;
  },

  code: (props, _design) => {
    const code = esc(String(props.code ?? ""));
    const language = esc(String(props.language ?? ""));
    return `<pre style="background:#1e1e2e;color:#cdd6f4;padding:1.5rem;border-radius:var(--radius);overflow-x:auto;margin:2rem"><code data-language="${language}">${code}</code></pre>`;
  },

  html: (props, _design) => {
    const rawHtml = String(props.html ?? "");
    return `<div>${rawHtml}</div>`;
  },

  // ── UI Components ──

  button: (props, design) => {
    const text = esc(String(props.text ?? "Button"));
    const variant = props.variant || "primary";
    const accent = `#${design.mainColor}`;
    const style = variant === "primary"
      ? `background:${accent};color:#fff;border:none`
      : `border:1.5px solid ${accent};color:${accent};background:transparent`;
    return `<div style="padding:1rem;display:flex;justify-content:center">
      <button style="${style};padding:0.625rem 1.5rem;border-radius:var(--radius);font-weight:600;font-size:0.875rem;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all 0.2s">${text}</button>
    </div>`;
  },

  link: (props, design) => {
    const text = esc(String(props.text ?? "Link"));
    const url = ensureRelative(String(props.url ?? "#"));
    return `<div style="padding:1rem;display:flex;justify-content:center">
      <a href="${url}" style="color:#${design.mainColor};text-decoration:none;font-weight:500;font-size:0.875rem;border-bottom:1px solid transparent;transition:border-color 0.2s" onmouseover="this.style.borderBottomColor='#${design.mainColor}'" onmouseout="this.style.borderBottomColor='transparent'">${text}</a>
    </div>`;
  },

  card: (props, _design) => {
    const title = esc(String(props.title ?? "Card Title"));
    const description = esc(String(props.description ?? "Card description goes here."));
    return `<div style="padding:1rem">
      <div style="border:1px solid var(--border-color);border-radius:var(--radius);background:var(--bg-color);overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <div style="height:120px;background:linear-gradient(135deg, rgba(99,76,248,0.1) 0%, rgba(99,76,248,0.05) 100%)"></div>
        <div style="padding:1.25rem">
          <h4 style="margin:0 0 0.5rem;font-weight:700;font-size:0.9375rem">${title}</h4>
          <p style="margin:0;color:var(--muted-text);font-size:0.8125rem;line-height:1.5">${description}</p>
        </div>
      </div>
    </div>`;
  },

  avatar: (props, _design) => {
    const name = esc(String(props.name ?? "User"));
    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `<div style="padding:1rem;display:flex;align-items:center;gap:0.75rem">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(99,76,248,0.1);display:flex;align-items:center;justify-content:center;font-size:0.8125rem;font-weight:700;color:#634CF8">${initials}</div>
      <span style="font-size:0.875rem;font-weight:500">${name}</span>
    </div>`;
  },

  badge: (props, design) => {
    const text = esc(String(props.text ?? "Badge"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem;display:flex">
      <span style="background:${accent}15;color:${accent};padding:0.125rem 0.625rem;border-radius:9999px;font-size:0.75rem;font-weight:700;letter-spacing:0.025em">${text}</span>
    </div>`;
  },

  chip: (props, design) => {
    const text = esc(String(props.text ?? "Chip"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem;display:flex;gap:0.5rem">
      <span style="border:1px solid ${accent}40;color:${accent};padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:500;display:inline-flex;align-items:center;gap:0.25rem">
        ${text}
        <span style="opacity:0.5;cursor:pointer;margin-left:0.25rem">×</span>
      </span>
    </div>`;
  },

  accordion: (props, _design) => {
    const title = esc(String(props.title ?? "Accordion Title"));
    const items = Array.isArray(props.items) ? props.items : [
      { q: "Item 1", a: "Content 1" },
      { q: "Item 2", a: "Content 2" }
    ];
    const itemsHtml = items.map((item: any) => `
      <details style="border-bottom:1px solid var(--border-color);padding:0.75rem 0">
        <summary style="font-weight:600;font-size:0.9375rem;cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center">
          ${esc(item.q ?? item.title ?? "Question")}
          <span style="transition:transform 0.2s">▼</span>
        </summary>
        <div style="padding:1rem 0;color:var(--muted-text);font-size:0.875rem;line-height:1.6">${esc(item.a ?? item.content ?? "Answer content goes here.")}</div>
      </details>`).join("");
    
    return `<div style="padding:2rem;max-width:700px;margin:0 auto">
      ${props.title ? `<h3 style="font-size:1.25rem;font-weight:700;margin-bottom:1.5rem">${title}</h3>` : ""}
      <div style="border-top:1px solid var(--border-color)">${itemsHtml}</div>
    </div>`;
  },

  tabs: (props, design) => {
    const items = Array.isArray(props.items) ? props.items : [
      { label: "Tab 1", content: "Content 1" },
      { label: "Tab 2", content: "Content 2" }
    ];
    const accent = `#${design.mainColor}`;
    const tabsHtml = items.map((item: any, i: number) => `
      <div class="pb-tab-item ${i === 0 ? "active" : ""}" data-target="tab-${i}" style="padding:0.5rem 1rem;cursor:pointer;font-weight:600;font-size:0.875rem;color:${i === 0 ? accent : "#6b7280"};border-bottom:2px solid ${i === 0 ? accent : "transparent"}">${esc(item.label)}</div>
    `).join("");
    const panelsHtml = items.map((item: any, i: number) => `
      <div id="tab-${i}" class="pb-tab-panel" style="display:${i === 0 ? "block" : "none"};padding:1.5rem 0;font-size:0.875rem;color:#4b5563">${esc(item.content)}</div>
    `).join("");

    return `<div style="padding:2rem" class="pb-tabs">
      <div style="display:flex;gap:1rem;border-bottom:1px solid var(--border-color)">${tabsHtml}</div>
      <div>${panelsHtml}</div>
      <script>
        (function() {
          var container = document.currentScript.parentElement;
          var tabs = container.querySelectorAll('.pb-tab-item');
          var panels = container.querySelectorAll('.pb-tab-panel');
          tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
              tabs.forEach(t => { 
                t.style.color = '#6b7280'; 
                t.style.borderBottomColor = 'transparent';
              });
              panels.forEach(p => p.style.display = 'none');
              tab.style.color = '${accent}';
              tab.style.borderBottomColor = '${accent}';
              container.querySelector('#' + tab.dataset.target).style.display = 'block';
            });
          });
        })();
      </script>
    </div>`;
  },

  table: (props, _design) => {
    const title = esc(String(props.title ?? ""));
    const headers = Array.isArray(props.headers) ? props.headers : ["Name", "Role", "Status"];
    const rows = Array.isArray(props.rows) ? props.rows : [
      ["John Doe", "Designer", "Active"],
      ["Jane Smith", "Developer", "Away"]
    ];
    
    const headerHtml = headers.map(h => `<th style="text-align:left;padding:0.75rem;border-bottom:1px solid var(--border-color);font-size:0.75rem;font-weight:700;color:var(--muted-text);text-transform:uppercase;letter-spacing:0.05em">${esc(h)}</th>`).join("");
    const rowsHtml = rows.map(row => `
      <tr>
        ${(Array.isArray(row) ? row : []).map(cell => `<td style="padding:1rem 0.75rem;border-bottom:1px solid #f3f4f6;font-size:0.875rem;color:#4b5563">${esc(String(cell))}</td>`).join("")}
      </tr>`).join("");

    return `<div style="padding:2rem;overflow-x:auto">
      ${title ? `<h3 style="font-size:1.125rem;font-weight:700;margin-bottom:1rem">${title}</h3>` : ""}
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
  },

  separator: (_props, _design) => `<div style="padding:1rem"><div style="height:1px;background:var(--border-color)"></div></div>`,

  input: (props, _design) => {
    const label = esc(String(props.label ?? "Input"));
    const placeholder = esc(String(props.placeholder ?? "Enter text..."));
    return `<div style="padding:1rem">
      <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--muted-text);margin-bottom:0.375rem">${label}</label>
      <input type="text" placeholder="${placeholder}" style="width:100%;padding:0.625rem 0.75rem;border:1px solid var(--border-color);border-radius:var(--radius);font-size:0.875rem;background:var(--bg-color);color:var(--text-color)" />
    </div>`;
  },

  textfield: (props, _design) => {
    const label = esc(String(props.label ?? "Text Field"));
    const placeholder = esc(String(props.placeholder ?? "Enter value..."));
    return `<div style="padding:1rem">
      <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--text-color);margin-bottom:0.375rem">${label}</label>
      <input type="text" placeholder="${placeholder}" style="width:100%;padding:0.625rem 0.75rem;border:1px solid var(--border-color);border-radius:var(--radius);font-size:0.875rem;background:var(--bg-color);color:var(--text-color)" />
      <p style="margin:0.25rem 0 0;font-size:0.625rem;color:var(--muted-text)">Helper text</p>
    </div>`;
  },

  textarea: (props, _design) => {
    const label = esc(String(props.label ?? "Text Area"));
    const placeholder = esc(String(props.placeholder ?? "Write something..."));
    return `<div style="padding:1rem">
      <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--muted-text);margin-bottom:0.375rem">${label}</label>
      <textarea placeholder="${placeholder}" style="width:100%;min-height:100px;padding:0.625rem 0.75rem;border:1px solid var(--border-color);border-radius:var(--radius);font-size:0.875rem;background:var(--bg-color);color:var(--text-color);resize:vertical"></textarea>
    </div>`;
  },

  checkbox: (props, design) => {
    const label = esc(String(props.label ?? "Checkbox option"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem;display:flex;align-items:center;gap:0.625rem">
      <div style="width:18px;height:18px;border:2px solid ${accent};border-radius:4px;display:flex;align-items:center;justify-content:center;color:${accent};font-size:11px;font-weight:700">✓</div>
      <span style="font-size:0.875rem;color:var(--text-color)">${label}</span>
    </div>`;
  },

  switch: (props, design) => {
    const label = esc(String(props.label ?? "Toggle option"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:0.875rem;color:var(--text-color)">${label}</span>
      <div style="width:36px;height:20px;background:${accent};border-radius:9999px;position:relative">
        <div style="width:16px;height:16px;background:#fff;border-radius:50%;position:absolute;top:2px;right:2px;box-shadow:0 1px 2px rgba(0,0,0,0.1)"></div>
      </div>
    </div>`;
  },

  progress: (props, design) => {
    const value = Number(props.value) || 50;
    const label = esc(String(props.label ?? "Progress"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.375rem">
        <span style="font-size:0.75rem;font-weight:600;color:var(--muted-text)">${label}</span>
        <span style="font-size:0.75rem;font-weight:700;color:${accent}">${value}%</span>
      </div>
      <div style="height:8px;background:#f3f4f6;border-radius:9999px;overflow:hidden">
        <div style="height:100%;width:${value}%;background:${accent};border-radius:9999px"></div>
      </div>
    </div>`;
  },

  breadcrumbs: (props) => {
    const items = Array.isArray(props.items) ? props.items : ["Home", "Products", "Current"];
    const html = items.map((item, i) => `
      <span style="font-size:0.75rem;color:${i === items.length - 1 ? "var(--text-color)" : "var(--muted-text)"};font-weight:${i === items.length - 1 ? "600" : "400"}">${esc(String(item))}</span>
      ${i < items.length - 1 ? '<span style="color:var(--border-color);font-size:0.75rem;margin:0 0.5rem">/</span>' : ""}
    `).join("");
    return `<div style="padding:1rem;display:flex;align-items:center">${html}</div>`;
  },

  select: (props, _design) => {
    const label = esc(String(props.label ?? "Select"));
    const placeholder = esc(String(props.placeholder ?? "Choose an option..."));
    return `<div style="padding:1rem">
      <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--muted-text);margin-bottom:0.375rem">${label}</label>
      <div style="width:100%;padding:0.625rem 0.75rem;border:1px solid var(--border-color);border-radius:var(--radius);font-size:0.875rem;background:var(--bg-color);color:var(--text-color);display:flex;justify-content:space-between;align-items:center;cursor:pointer">
        <span style="color:var(--muted-text)">${placeholder}</span>
        <span style="font-size:10px;color:var(--muted-text)">▼</span>
      </div>
    </div>`;
  },

  radiogroup: (props, design) => {
    const label = esc(String(props.label ?? "Radio Group"));
    const options = Array.isArray(props.options) ? props.options : ["Option 1", "Option 2", "Option 3"];
    const accent = `#${design.mainColor}`;
    const optsHtml = options.map((opt, i) => `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
        <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${i === 0 ? accent : "#d4d4d4"};display:flex;align-items:center;justify-content:center">
          ${i === 0 ? `<div style="width:8px;height:8px;border-radius:50%;background:${accent}"></div>` : ""}
        </div>
        <span style="font-size:0.875rem;color:var(--text-color)">${esc(String(opt))}</span>
      </div>`).join("");
    return `<div style="padding:1rem">
      <label style="display:block;font-size:0.75rem;font-weight:600;color:var(--muted-text);margin-bottom:0.625rem">${label}</label>
      <div>${optsHtml}</div>
    </div>`;
  },

  slider: (props, design) => {
    const label = esc(String(props.label ?? "Slider"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
        <label style="font-size:0.75rem;font-weight:600;color:var(--muted-text)">${label}</label>
        <span style="font-size:0.75rem;font-weight:700;color:var(--text-color)">50</span>
      </div>
      <div style="position:relative;height:20px;display:flex;align-items:center">
        <div style="width:100%;height:6px;background:var(--border-color);border-radius:9999px;position:relative">
          <div style="width:50%;height:100%;background:${accent};border-radius:9999px"></div>
          <div style="width:16px;height:16px;background:#fff;border:2px solid ${accent};border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 1px 3px rgba(0,0,0,0.1)"></div>
        </div>
      </div>
    </div>`;
  },

  tooltip: (props, _design) => {
    const text = esc(String(props.text ?? "Hover me"));
    const tooltip = esc(String(props.tooltip ?? "Tooltip info"));
    return `<div style="padding:1rem;display:flex;align-items:center;gap:0.5rem">
      <span style="font-size:0.875rem;color:var(--text-color);text-decoration:underline;text-decoration-style:dashed;text-underline-offset:4px;cursor:help">${text}</span>
      <div style="background:var(--text-color);color:var(--bg-color);padding:0.25rem 0.5rem;border-radius:4px;font-size:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">${tooltip}</div>
    </div>`;
  },

  popover: (props, design) => {
    const trigger = esc(String(props.trigger ?? "Click me"));
    const accent = `#${design.mainColor}`;
    return `<div style="padding:1rem">
      <button style="padding:0.5rem 1rem;border:1px solid ${accent}40;color:${accent};border-radius:8px;font-size:0.75rem;font-weight:600;background:transparent;cursor:pointer">${trigger}</button>
      <div style="margin-top:0.5rem;padding:0.75rem;border:1px solid var(--border-color);border-radius:8px;background:var(--bg-color);color:var(--text-color);box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:200px">
        <p style="margin:0;font-size:0.75rem;font-weight:600;color:var(--text-color)">Popover Title</p>
        <p style="margin:0.25rem 0 0;font-size:10px;color:var(--muted-text)">Popover content goes here.</p>
      </div>
    </div>`;
  },
};

// ── Render a single block ──

function renderBlock(
  block: BlockInstance,
  design: DesignSettings,
  options: HtmlExportOptions,
): string {
  // Case-insensitive lookup for block type
  const typeKey = block.type.toLowerCase();
  const generator = BLOCK_HTML_MAP[typeKey] || BLOCK_HTML_MAP[block.type];
  // Render nested children if present
  let childrenHtml = "";
  if (block.children) {
    for (const [zoneName, zoneBlocks] of Object.entries(block.children)) {
      if (zoneBlocks.length > 0) {
        const zoneContent = zoneBlocks
          .map((child) => renderBlock(child, design, options))
          .join("\n");
        childrenHtml += `\n<div data-zone="${esc(zoneName)}" style="min-width:0">${zoneContent}</div>`;
      }
    }
    if (
      childrenHtml &&
      block.type !== "grid" &&
      block.type !== "flex-container" &&
      block.type !== "flex-row" &&
      block.type !== "flex-col" &&
      block.type !== "columns" &&
      block.type !== "container"
    ) {
      childrenHtml = `<div style="display:flex;gap:1rem">${childrenHtml}\n</div>`;
    }
  }

  let inner = "";
  if (generator) {
    inner = (generator as any)(block.props, design, childrenHtml, options);
  } else {
    const textContent = esc(String(block.props.text || block.props.title || block.props.headline || block.props.name || block.props.label || block.type));
    inner = `<div style="padding:1rem;border:1px dashed #ccc;border-radius:4px;margin-bottom:1rem">${textContent}${childrenHtml || ""}</div>`;
  }
  const inlineStyle = getInlineStyles(block.props);
  const anim = block.props._animation as string;
  const animClass =
    anim && anim !== "none"
      ? ` class="pb-animate" data-animation="${esc(anim)}"`
      : "";
  const section = block.props._section as Record<string, string> | undefined;

  let html = `<div data-block-id="${esc(block.id)}" data-block-type="${esc(block.type)}"${inlineStyle}${animClass}>${inner}</div>`;

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

  const blocksHtml = blocks.map((b) => renderBlock(b, design, options)).join("\n");

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

  const locale = pageSettings.locale || "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  // Alternate links for SEO
  let alternateLinks = "";
  if (options?.allPages && pageSettings.translationGroupId) {
    options.allPages
      .filter((p: Page) => p.settings.translationGroupId === pageSettings.translationGroupId && p.settings.locale !== locale)
      .forEach((p: Page) => {
        const prefix = locale === "ar" ? "../" : "ar/";
        const url = `${prefix}${p.settings.slug || "index"}.html`;
        alternateLinks += `<link rel="alternate" hreflang="${p.settings.locale}" href="${esc(url)}" />\n  `;
      });
  }

  return `<!DOCTYPE html>
${!pageSettings.published ? "<!-- DRAFT - Not Published -->\n" : ""}<html lang="${locale}" dir="${dir}" class="${moodClass}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(pageSettings.title)}</title>
  <meta name="description" content="${esc(pageSettings.description)}" />
  ${alternateLinks}
  ${pageSettings.ogImage ? `<meta property="og:image" content="${esc(pageSettings.ogImage)}" />` : ""}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${fontUrl}" rel="stylesheet" />
  <style>
    :root {
      --main-color: ${mainColor};
      --radius: ${radiusValue};
      --font-family: ${fontFamily};
      --bg-color: #ffffff;
      --text-color: #111827;
      --border-color: #e5e7eb;
      --muted-text: #6b7280;
    }
    html.dark {
      --bg-color: #111827;
      --text-color: #f9fafb;
      --border-color: #374151;
      --muted-text: #9ca3af;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-family);
      line-height: 1.6;
      color: var(--text-color);
      background: var(--bg-color);
      transition: background-color 0.3s, color 0.3s;
    }
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
    
    /* UI Component Helper Styles */
    .pb-tab-item:hover { opacity: 0.8; }
    .pb-tab-item.active { pointer-events: none; }
    details > summary::-webkit-details-marker { display: none; }
    details[open] summary span { transform: rotate(180deg); }
    
    /* Force consistent colors for nav and other elements using the variables */
    nav, section, footer, div, h1, h2, h3, h4, p, span { border-color: var(--border-color) !important; }

    /* Navbar Responsiveness */
    .pb-navbar { border-bottom: 1px solid var(--border-color); }
    .pb-nav-container { display: flex; align-items: center; justify-content: space-between; padding: 1rem 2rem; max-width: 1200px; margin: 0 auto; }
    .pb-nav-logo { font-weight: 700; font-size: 1.25rem; }
    .pb-nav-right { display: flex; align-items: center; gap: 1.5rem; }
    .pb-nav-links { display: flex; align-items: center; gap: 1.5rem; }
    .pb-nav-actions { display: flex; align-items: center; gap: 0.75rem; }
    .pb-nav-cta { background: var(--main-color); color: #fff; padding: 0.5rem 1.25rem; border-radius: var(--radius); text-decoration: none; font-weight: 600; font-size: 0.875rem; }
    .pb-hamburger { display: none; }
    
    @media (max-width: 768px) {
      .pb-nav-links { display: none; }
      .pb-hamburger { display: flex; }
      .pb-nav-container { padding: 0.75rem 1rem; }
      .pb-nav-right { gap: 0.75rem; }
      .pb-nav-cta { display: none; }
    }
  </style>
  <script>
    (function() {
      const saved = localStorage.getItem('pb-theme');
      if (saved === 'dark') document.documentElement.classList.add('dark');
      else if (saved === 'light') document.documentElement.classList.remove('dark');
    })();
  </script>
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

// ── Multi-page Export ──

export function exportProject(pages: Page[], design: DesignSettings): Record<string, string> {
  const files: Record<string, string> = {};
  
  pages.forEach(page => {
    const html = generateHtml({
      blocks: page.blocks,
      design: design,
      pageSettings: page.settings,
      allPages: pages
    });
    
    const localePrefix = (page.settings.locale || "en") === "ar" ? "ar/" : "";
    const filename = `${localePrefix}${page.settings.slug || "index"}.html`;
    files[filename] = html;
  });
  
  return files;
}

export async function downloadAllPages(files: Record<string, string>): Promise<void> {
  try {
    // @ts-ignore - Importing from URL
    const JSZipModule = await import("https://cdn.skypack.dev/jszip");
    const JSZip = (JSZipModule as any).default;
    const zip = new JSZip();

    // Add files to zip
    Object.entries(files).forEach(([filename, html]) => {
      zip.file(filename, html);
    });

    // Generate zip blob
    const content = await zip.generateAsync({ type: "blob" });
    
    // Download the zip
    const url = URL.createObjectURL(content);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project-export.zip";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate ZIP, falling back to individual downloads", error);
    // Fallback to individual downloads if ZIP fails
    Object.entries(files).forEach(([filename, html], index) => {
      setTimeout(() => {
        downloadHtml(html, filename.replace("/", "-"));
      }, index * 200);
    });
  }
}
