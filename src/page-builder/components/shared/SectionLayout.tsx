import clsx from "clsx";

/**
 * Shared section wrapper — consistent padding, max-width, and centering.
 * Used by most block renderers (Hero, Features, CTA, Stats, etc.)
 */
export function SectionLayout({
  children,
  maxWidth = "6xl",
  className,
}: {
  children: React.ReactNode;
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
}) {
  const maxWidthClass = {
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div className={clsx("px-4 sm:px-8 py-16 sm:py-20 mx-auto", maxWidthClass, className)}>
      {children}
    </div>
  );
}

/**
 * Centered section heading with optional subtitle.
 */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={clsx("mb-10 sm:mb-14", align === "center" && "text-center")}>
      <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * Responsive grid for cards/items.
 */
export function ResponsiveGrid({
  children,
  columns = 3,
  isMobile = false,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  isMobile?: boolean;
  className?: string;
}) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={clsx("grid gap-6", isMobile ? "grid-cols-1" : `grid-cols-1 ${colClass}`, className)}>
      {children}
    </div>
  );
}

/**
 * Rich HTML content renderer — handles both plain text and HTML from TipTap.
 */
export function RichContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const isHtml = content.includes("<");

  if (isHtml) {
    return (
      <div
        className={clsx(
          "leading-relaxed [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-6 [&_ul]:pl-6 [&_li]:mb-1 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-separator [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-[#634CF8] [&_a]:underline",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <p className={clsx("leading-relaxed", className)}>{content}</p>;
}
