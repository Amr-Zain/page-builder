// ── Block Types (page sections you drag to build) ──
export type BlockType =
  | "navbar"
  | "hero"
  | "features"
  | "content"
  | "testimonials"
  | "pricing"
  | "stats"
  | "team"
  | "faq"
  | "gallery"
  | "cta"
  | "contact"
  | "logos"
  | "banner"
  | "footer"
  // Primitives
  | "text"
  | "image"
  | "video"
  | "button-group"
  | "columns"
  | "grid"
  | "flex-row"
  | "flex-col"
  | "flex-container"
  | "container"
  | "spacer"
  | "divider"
  | "code"
  | "html";

export type BlockCategory = "sections" | "content" | "layout" | "media";

/** A named drop zone definition for container blocks */
export interface ZoneDefinition {
  /** Zone identifier (e.g., "left", "right", "content") */
  name: string;
  /** Human-readable label for the zone */
  label: string;
  /** Block types allowed in this zone (empty/undefined = all allowed) */
  allow?: BlockType[];
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  category: BlockCategory;
  description: string;
  /** Default props when a new instance is created */
  defaultProps: Record<string, unknown>;
  /** If present, this block is a container that supports nesting */
  zones?: ZoneDefinition[];
}

export interface BlockInstance {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  /**
   * Children organized by zone name.
   * Only present on container blocks.
   * Example: { left: [...], right: [...] }
   */
  children?: Record<string, BlockInstance[]>;
}

/** Per-block style overrides stored in block.props._style */
export interface BlockStyleOverrides {
  // Typography
  fontSize?: string;
  fontWeight?: string;
  textAlign?: string;
  textColor?: string;
  lineHeight?: string;
  // Borders
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: string;
  borderRadiusTL?: string;
  borderRadiusTR?: string;
  borderRadiusBL?: string;
  borderRadiusBR?: string;
  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  // Spacing
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  // Layout
  fullWidth?: boolean;
  // Animation
  animation?: string;
  animationDelay?: number;
  // CSS
  cssClass?: string;
  // Responsive visibility
  visibleDesktop?: boolean;
  visibleTablet?: boolean;
  visibleMobile?: boolean;
}

// ── Animation Presets ──
export type AnimationPreset =
  | "none"
  | "fade-in"
  | "fade-up"
  | "fade-down"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "zoom-out"
  | "bounce";

// ── Section Settings (per-block layout/background) ──
export interface SectionSettings {
  layout: "contained" | "full-width";
  bgImage: string;
  bgOverlay: string;
}

// ── Form Action (for contact blocks) ──
export interface FormAction {
  method: "email" | "webhook" | "localStorage";
  email?: string;
  webhookUrl?: string;
}

// ── Component Types (UI elements inside blocks — curated for page builders) ──
export type ComponentType =
  | "Button"
  | "Card"
  | "Avatar"
  | "Badge"
  | "Chip"
  | "Input"
  | "TextField"
  | "TextArea"
  | "Select"
  | "Checkbox"
  | "Switch"
  | "RadioGroup"
  | "Slider"
  | "Accordion"
  | "Tabs"
  | "Table"
  | "Link"
  | "Separator"
  | "Tooltip"
  | "Popover";

export type ComponentCategory = "actions" | "forms" | "display" | "navigation";

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  icon: string;
  category: ComponentCategory;
  description: string;
}

// ── Design Settings ──
export type MoodType = "light" | "dark";
export type BackgroundThemeType = "solid" | "pattern" | "gradient";
export type TypographyType =
  | "inter"
  | "plus-jakarta"
  | "space-grotesk"
  | "poppins"
  | "dm-sans"
  | "sora";
export type RadiusType =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full";

export interface DesignSettings {
  mood: MoodType;
  mainColor: string;
  backgroundTheme: BackgroundThemeType;
  backgroundOpacity: number;
  typography: TypographyType;
  radius: RadiusType;
  // Customizable color tokens
  successColor?: string;
  warningColor?: string;
  dangerColor?: string;
  // Theme color overrides (light mode)
  lightForeground?: string;
  lightBackground?: string;
  lightMuted?: string;
  lightSurface?: string;
  lightSeparator?: string;
  // Theme color overrides (dark mode)
  darkForeground?: string;
  darkBackground?: string;
  darkMuted?: string;
  darkSurface?: string;
  darkSeparator?: string;
  // Customizable border
  borderWidth?: string;
  borderStyle?: "solid" | "dashed" | "dotted";
  // Customizable shadow
  shadow?: "none" | "sm" | "md" | "lg";
  // Customizable base spacing multiplier
  spacingBase?: number;
}

// ── Template ──
export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  category: "landing" | "portfolio" | "business" | "saas";
  blocks: BlockInstance[];
  design: DesignSettings;
}

// ── Builder State ──
export type SidebarPanel =
  | "blocks"
  | "components"
  | "design"
  | "templates"
  | "pages"
  | "menus";

export interface BuilderState {
  blocks: BlockInstance[];
  design: DesignSettings;
  selectedBlockId: string | null;
  sidebarPanel: SidebarPanel;
  isDrawerOpen: boolean;
  previewMode: "desktop" | "tablet" | "mobile";
  hoveredBlockId: string | null;
  expandedLayerIds: Set<string>;
}
