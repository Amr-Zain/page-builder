import type { BlockInstance, DesignSettings } from "./types";
import type { PageSettings } from "./pages";
import { RADIUS_TOKENS } from "./tokens";

export interface ReactExportOptions {
  blocks: BlockInstance[];
  design: DesignSettings;
  pageSettings: PageSettings;
}

const FONT_FAMILIES: Record<string, string> = {
  inter: "'Inter', sans-serif",
  "plus-jakarta": "'Plus Jakarta Sans', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  poppins: "'Poppins', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  sora: "'Sora', sans-serif",
};

function esc(s: string): string {
  return s.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function blockToJsx(block: BlockInstance, design: DesignSettings, indent: string = "      "): string {
  const p = block.props;
  const mc = design.mainColor;
  const r = RADIUS_TOKENS[design.radius]?.value || "0.5rem";

  // Render nested children if present
  let childrenJsx = "";
  if (block.children) {
    const zones = Object.entries(block.children);
    if (zones.some(([, zoneBlocks]) => zoneBlocks.length > 0)) {
      const childIndent = indent + "  ";
      childrenJsx = zones
        .map(([zoneName, zoneBlocks]) => {
          if (zoneBlocks.length === 0) return "";
          const childrenMapped = zoneBlocks.map((child) => blockToJsx(child, design, childIndent + "  ")).join("\n\n");
          return `${childIndent}<div data-zone="${zoneName}" style={{ minWidth: 0 }}>\n${childrenMapped}\n${childIndent}</div>`;
        })
        .filter(Boolean)
        .join("\n");
      
      if (block.type !== "grid" && block.type !== "flex-container" && block.type !== "flex-row" && block.type !== "flex-col" && block.type !== "columns" && block.type !== "container") {
        childrenJsx = `\n${indent}<div style={{ display: "flex", gap: "1rem" }}>\n${childrenJsx}\n${indent}</div>`;
      } else {
        childrenJsx = `\n${childrenJsx}\n${indent}`;
      }
    }
  }

  let inner: string;
  switch (block.type) {
    case "navbar":
      inner = `${indent}<nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", borderBottom: "1px solid #e5e7eb" }}>
${indent}  <span style={{ fontWeight: 700, fontSize: "1.25rem" }}>${esc(String(p.logo || "Logo"))}</span>
${indent}  <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
${indent}    ${(Array.isArray(p.links) ? p.links : []).map((l: any) => {
        const label = typeof l === "string" ? l : (l?.label || "Link");
        return `<a href="#" style={{ textDecoration: "none", color: "inherit" }}>${esc(String(label))}</a>`;
      }).join("\n" + indent + "    ")}
${indent}    <a href="#" style={{ background: "#${mc}", color: "#fff", padding: "0.5rem 1rem", borderRadius: "${r}", textDecoration: "none" }}>Get Started</a>
${indent}  </div>
${indent}</nav>${childrenJsx}`;
      break;
    case "hero":
      inner = `${indent}<section style={{ textAlign: "center", padding: "5rem 2rem" }}>
${indent}  <h1 style={{ fontSize: "3rem", fontWeight: 700, margin: "0 0 1rem" }}>${esc(String(p.headline || ""))}</h1>
${indent}  <p style={{ fontSize: "1.25rem", color: "#6b7280", maxWidth: 640, margin: "0 auto 2rem" }}>${esc(String(p.subtitle || ""))}</p>
${indent}  <a href="#" style={{ background: "#${mc}", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "${r}", textDecoration: "none", fontWeight: 600 }}>${esc(String(p.ctaText || "Get Started"))}</a>
${indent}</section>${childrenJsx}`;
      break;
    case "footer":
      inner = `${indent}<footer style={{ padding: "3rem 2rem", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
${indent}  <p style={{ color: "#6b7280", margin: 0 }}>${esc(String(p.copyright || ""))}</p>
${indent}</footer>${childrenJsx}`;
      break;
    case "cta":
      inner = `${indent}<section style={{ padding: "4rem 2rem", background: "#${mc}", color: "#fff", textAlign: "center" }}>
${indent}  <h2 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 1rem" }}>${esc(String(p.headline || ""))}</h2>
${indent}  <p style={{ maxWidth: 500, margin: "0 auto 2rem", opacity: 0.9 }}>${esc(String(p.subtitle || ""))}</p>
${indent}  <a href="#" style={{ background: "#fff", color: "#${mc}", padding: "0.75rem 1.5rem", borderRadius: "${r}", textDecoration: "none", fontWeight: 600 }}>${esc(String(p.ctaText || "Get Started"))}</a>
${indent}</section>${childrenJsx}`;
      break;
    case "banner":
      inner = `${indent}<div style={{ padding: "0.75rem 2rem", background: "#${mc}", color: "#fff", textAlign: "center", fontSize: "0.875rem" }}>${esc(String(p.text || ""))}</div>${childrenJsx}`;
      break;
    case "spacer":
      inner = `${indent}<div style={{ height: ${Number(p.height) || 64} }} />${childrenJsx}`;
      break;
    case "divider":
      inner = `${indent}<hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "2rem 0" }} />${childrenJsx}`;
      break;
    case "columns": {
      const count = Number(p.count) || 2;
      inner = `${indent}<div style={{ display: "grid", gridTemplateColumns: "repeat(${count}, 1fr)", gap: "1rem", padding: "2rem" }}>${childrenJsx}</div>`;
      break;
    }
    case "container": {
      inner = `${indent}<div style={{ maxWidth: "${p.maxWidth || "1200px"}", margin: "0 auto", padding: "2rem" }}>${childrenJsx}</div>`;
      break;
    }
    case "grid": {
      const cols = Number(p.columns) || 2;
      const templateCols = p.templateColumns || `repeat(${cols}, 1fr)`;
      inner = `${indent}<div style={{ display: "grid", gridTemplateColumns: "${templateCols}", gap: "${p.gap || 16}px" }}>${childrenJsx}</div>`;
      break;
    }
    case "flex-container": {
      inner = `${indent}<div style={{ display: "flex", flexDirection: "${p.direction || "row"}", gap: "${p.gap || 16}px", justifyContent: "${p.justifyContent || "flex-start"}", alignItems: "${p.alignItems || "stretch"}", flexWrap: "${p.wrap || "nowrap"}" }}>${childrenJsx}</div>`;
      break;
    }
    case "flex-row": {
      inner = `${indent}<div style={{ display: "flex", flexDirection: "row", gap: "${p.gap || "1rem"}", justifyContent: "${p.justify || "flex-start"}", alignItems: "${p.align || "stretch"}" }}>${childrenJsx}</div>`;
      break;
    }
    case "flex-col": {
      inner = `${indent}<div style={{ display: "flex", flexDirection: "column", gap: "${p.gap || "1rem"}", justifyContent: "${p.justify || "flex-start"}", alignItems: "${p.align || "stretch"}" }}>${childrenJsx}</div>`;
      break;
    }
    case "features": {
      inner = `${indent}<section style={{ padding: "4rem 2rem", background: "transparent" }}>
${indent}  <h2 style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>${esc(String(p.title || "Features"))}</h2>
${indent}  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
${indent}    ${(Array.isArray(p.items) ? p.items : []).map((item: any) => `
${indent}    <div style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "${r}" }}>
${indent}      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>${esc(String(item.icon || "✨"))}</div>
${indent}      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>${esc(String(item.title || ""))}</h3>
${indent}      <p style={{ color: "#6b7280", lineHeight: 1.5 }}>${esc(String(item.description || ""))}</p>
${indent}    </div>`).join("")}
${indent}  </div>
${indent}</section>${childrenJsx}`;
      break;
    }
    case "pricing": {
      inner = `${indent}<section style={{ padding: "4rem 2rem" }}>
${indent}  <h2 style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>${esc(String(p.title || "Pricing"))}</h2>
${indent}  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
${indent}    ${(Array.isArray(p.tiers) ? p.tiers : []).map((tier: any) => `
${indent}    <div style={{ padding: "2rem", border: "2px solid #e5e7eb", borderRadius: "${r}", textAlign: "center" }}>
${indent}      <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>${esc(String(tier.name || ""))}</h3>
${indent}      <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>${esc(String(tier.price || "$0"))}</div>
${indent}      <ul style={{ listStyle: "none", padding: 0, marginBottom: "2rem", textAlign: "left" }}>
${indent}        ${(Array.isArray(tier.features) ? tier.features : []).map((f: string) => `<li style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem" }}><span>✓</span> ${esc(f)}</li>`).join("\n" + indent + "        ")}
${indent}      </ul>
${indent}      <button style={{ width: "100%", background: "#${mc}", color: "#fff", border: "none", padding: "0.75rem", borderRadius: "${r}", fontWeight: 600 }}>Get Started</button>
${indent}    </div>`).join("")}
${indent}  </div>
${indent}</section>${childrenJsx}`;
      break;
    }
    case "stats": {
      inner = `${indent}<section style={{ padding: "4rem 2rem", background: "#f9fafb", textAlign: "center" }}>
${indent}  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
${indent}    ${(Array.isArray(p.items) ? p.items : []).map((s: any) => `
${indent}    <div>
${indent}      <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#${mc}" }}>${esc(String(s.value || ""))}</div>
${indent}      <div style={{ color: "#6b7280", fontWeight: 500 }}>${esc(String(s.label || ""))}</div>
${indent}    </div>`).join("")}
${indent}  </div>
${indent}</section>${childrenJsx}`;
      break;
    }
    case "testimonials": {
      inner = `${indent}<section style={{ padding: "4rem 2rem" }}>
${indent}  <h2 style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>${esc(String(p.title || "Testimonials"))}</h2>
${indent}  <div style={{ maxWidth: "800px", margin: "0 auto" }}>
${indent}    ${(Array.isArray(p.testimonials) ? p.testimonials : []).map((t: any) => `
${indent}    <div style={{ padding: "2rem", background: "#f9fafb", borderRadius: "${r}", marginBottom: "2rem" }}>
${indent}      <p style={{ fontSize: "1.125rem", fontStyle: "italic", marginBottom: "1.5rem" }}>"${esc(String(t.content || ""))}"</p>
${indent}      <div style={{ fontWeight: 600 }}>${esc(String(t.name || ""))}</div>
${indent}      <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>${esc(String(t.role || ""))}</div>
${indent}    </div>`).join("")}
${indent}  </div>
${indent}</section>${childrenJsx}`;
      break;
    }
    case "faq": {
      inner = `${indent}<section style={{ padding: "4rem 2rem" }}>
${indent}  <h2 style={{ fontSize: "2rem", fontWeight: 700, textAlign: "center", marginBottom: "3rem" }}>${esc(String(p.title || "FAQ"))}</h2>
${indent}  <div style={{ maxWidth: "700px", margin: "0 auto" }}>
${indent}    ${(Array.isArray(p.questions) ? p.questions : []).map((q: any) => `
${indent}    <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
${indent}      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>${esc(String(q.question || ""))}</h3>
${indent}      <p style={{ color: "#6b7280" }}>${esc(String(q.answer || ""))}</p>
${indent}    </div>`).join("")}
${indent}  </div>
${indent}</section>${childrenJsx}`;
      break;
    }
    case "logos": {
      inner = `${indent}<section style={{ padding: "3rem 2rem", textAlign: "center", background: "#fff" }}>
${indent}  <p style={{ color: "#6b7280", fontWeight: 600, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2rem" }}>${esc(String(p.title || "Trusted by"))}</p>
${indent}  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "3rem", opacity: 0.5 }}>
${indent}    ${(Array.isArray(p.items) ? p.items : []).map((l: any) => `<span style={{ fontSize: "1.5rem", fontWeight: 700 }}>${esc(String(l.name || ""))}</span>`).join("\n" + indent + "    ")}
${indent}  </div>
${indent}</section>${childrenJsx}`;
      break;
    }
    default:
      inner = `${indent}{/* Block: ${block.type} */}\n${indent}<div style={{ padding: "2rem" }}>${esc(String(p.title || p.headline || p.content || block.type))}${childrenJsx}</div>`;
      break;
  }

  return inner;
}

export function generateReactComponent(options: ReactExportOptions): string {
  const { blocks, design, pageSettings } = options;
  const fontFamily = FONT_FAMILIES[design.typography] || "'Inter', sans-serif";
  const radiusValue = RADIUS_TOKENS[design.radius]?.value || "0.5rem";
  const timestamp = new Date().toISOString();
  const componentName =
    pageSettings.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("") || "Page";

  const blocksJsx = blocks.map((b) => blockToJsx(b, design)).join("\n\n");

  return `${!pageSettings.published ? "// DRAFT - Not Published\n" : ""}/**
 * Generated by Page Builder
 * Page: ${pageSettings.title}
 * Exported: ${timestamp}
 */
import React from "react";

export default function ${componentName}() {
  return (
    <div
      style={{
        fontFamily: "${fontFamily}",
        color: "${design.mood === "dark" ? "#f9fafb" : "#111827"}",
        background: "${design.mood === "dark" ? "#111827" : "#ffffff"}",
        ["--main-color" as string]: "#${design.mainColor}",
        ["--radius" as string]: "${radiusValue}",
      }}
    >
${blocksJsx}
    </div>
  );
}
`;
}

export function downloadReactFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
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
