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
${indent}    ${(Array.isArray(p.links) ? p.links : []).map((l: unknown) => `<a href="#" style={{ textDecoration: "none", color: "inherit" }}>${esc(String(l))}</a>`).join("\n" + indent + "    ")}
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
