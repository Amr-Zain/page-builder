import type { Page } from "../pages";
import type { BlockInstance } from "../types";

import { useState } from "react";
import clsx from "clsx";

// ── Types ──

type SEOScore = "good" | "ok" | "bad";

interface SEOCheck {
  label: string;
  status: SEOScore;
  message: string;
}

const SCORE_COLORS: Record<SEOScore, string> = {
  good: "bg-green-500",
  ok: "bg-amber-500",
  bad: "bg-red-500",
};

const SCORE_TEXT: Record<SEOScore, string> = {
  good: "text-green-700 dark:text-green-400",
  ok: "text-amber-700 dark:text-amber-400",
  bad: "text-red-700 dark:text-red-400",
};

const POWER_WORDS = [
  "free",
  "best",
  "guide",
  "how to",
  "ultimate",
  "proven",
  "easy",
  "simple",
  "top",
  "new",
  "secret",
  "powerful",
  "complete",
  "essential",
  "amazing",
  "exclusive",
  "instant",
  "guaranteed",
];

/**
 * Yoast-style SEO analyzer with real-time content analysis,
 * readability scoring, keyphrase density, AEO checks,
 * OG image preview, and mobile/desktop search preview.
 */
export function SEOAnalyzer({
  page,
  blocks,
  onUpdateSettings,
}: {
  page: Page;
  blocks: BlockInstance[];
  onUpdateSettings: (settings: Partial<Page["settings"]>) => void;
}) {
  const [focusKeyphrase, setFocusKeyphrase] = useState("");
  const [activeTab, setActiveTab] = useState<"seo" | "readability" | "aeo">(
    "seo",
  );
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  // Extract all text content from blocks
  const allText = extractTextFromBlocks(blocks);
  const wordCount = allText.split(/\s+/).filter(Boolean).length;

  // Run analysis
  const seoChecks = analyzeSEO(
    page,
    blocks,
    focusKeyphrase,
    allText,
    wordCount,
  );
  const readabilityChecks = analyzeReadability(allText, wordCount, blocks);
  const aeoChecks = analyzeAEO(page, allText, blocks, wordCount);

  const seoScore = calculateScore(seoChecks);
  const readabilityScore = calculateScore(readabilityChecks);
  const aeoScore = calculateScore(aeoChecks);
  const overallScore = Math.round((seoScore + readabilityScore + aeoScore) / 3);

  // Keyphrase density
  const keyphraseInfo = focusKeyphrase
    ? getKeyphraseDensity(allText, focusKeyphrase)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Overall Score */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8F8FA] dark:bg-surface">
        <ScoreCircle score={overallScore} size={64} strokeWidth={3} />
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-foreground">
            {overallScore >= 70
              ? "Good"
              : overallScore >= 40
                ? "Needs work"
                : "Poor"}{" "}
            SEO Score
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            {wordCount} words · {blocks.length} blocks
          </p>
          {/* Mini score breakdown */}
          <div className="flex items-center gap-3 mt-2">
            <MiniScore label="SEO" score={seoScore} />
            <MiniScore label="Read" score={readabilityScore} />
            <MiniScore label="AEO" score={aeoScore} />
          </div>
        </div>
      </div>

      {/* Focus Keyphrase */}
      <div>
        <label
          className="text-[11px] font-semibold text-foreground block mb-1.5"
          htmlFor="seo-keyphrase"
        >
          Focus Keyphrase
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[12px] outline-none focus:border-[#634CF8]"
            id="seo-keyphrase"
            placeholder="e.g., page builder, website creator"
            value={focusKeyphrase}
            onChange={(e) => setFocusKeyphrase(e.target.value)}
          />
          <button className="h-9 px-3 rounded-lg bg-[#634CF8]/10 text-[#634CF8] text-[10px] font-semibold hover:bg-[#634CF8]/20 transition-colors shrink-0">
            ✨ AI Suggest
          </button>
        </div>
        {keyphraseInfo && (
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={clsx(
                "h-1.5 w-1.5 rounded-full",
                keyphraseInfo.status === "good"
                  ? "bg-green-500"
                  : keyphraseInfo.status === "ok"
                    ? "bg-amber-500"
                    : "bg-red-500",
              )}
            />
            <p className="text-[10px] text-muted">
              Keyphrase density: {keyphraseInfo.density}% ({keyphraseInfo.count}{" "}
              {keyphraseInfo.count === 1 ? "occurrence" : "occurrences"})
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-separator/40">
        {(["seo", "readability", "aeo"] as const).map((tab) => {
          const tabScore =
            tab === "seo"
              ? seoScore
              : tab === "readability"
                ? readabilityScore
                : aeoScore;

          return (
            <button
              key={tab}
              className={clsx(
                "flex-1 py-2 text-[11px] font-semibold transition-colors border-b-2 flex items-center justify-center gap-1.5",
                activeTab === tab
                  ? "text-[#634CF8] border-[#634CF8]"
                  : "text-muted border-transparent",
              )}
              onClick={() => setActiveTab(tab)}
            >
              <span
                className={clsx("h-2 w-2 rounded-full", scoreColor(tabScore))}
              />
              {tab === "seo"
                ? "SEO"
                : tab === "readability"
                  ? "Readability"
                  : "AI / AEO"}
            </button>
          );
        })}
      </div>

      {/* SEO Tab */}
      {activeTab === "seo" && (
        <div className="flex flex-col gap-2">
          {/* Search Preview */}
          <div className="rounded-lg border border-separator/40 bg-white dark:bg-background p-3 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] text-muted flex items-center gap-1">
                <span>🔍</span> Google Search Preview
              </p>
              <div className="flex gap-1">
                <button
                  className={clsx(
                    "text-[9px] px-2 py-0.5 rounded-md transition-colors",
                    previewMode === "desktop"
                      ? "bg-[#634CF8]/10 text-[#634CF8] font-semibold"
                      : "text-muted hover:bg-[#F8F8FA] dark:hover:bg-surface",
                  )}
                  onClick={() => setPreviewMode("desktop")}
                >
                  Desktop
                </button>
                <button
                  className={clsx(
                    "text-[9px] px-2 py-0.5 rounded-md transition-colors",
                    previewMode === "mobile"
                      ? "bg-[#634CF8]/10 text-[#634CF8] font-semibold"
                      : "text-muted hover:bg-[#F8F8FA] dark:hover:bg-surface",
                  )}
                  onClick={() => setPreviewMode("mobile")}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className={clsx(previewMode === "mobile" && "max-w-[280px]")}>
              <p
                className={clsx(
                  "text-[#1a0dab] font-medium truncate",
                  previewMode === "mobile" ? "text-[13px]" : "text-[14px]",
                )}
              >
                {page.settings.title || "Untitled Page"}
              </p>
              <p className="text-[11px] text-green-700 dark:text-green-400 font-mono">
                yoursite.com/{page.settings.slug}
              </p>
              <p
                className={clsx(
                  "text-muted mt-0.5",
                  previewMode === "mobile"
                    ? "text-[10px] line-clamp-3"
                    : "text-[11px] line-clamp-2",
                )}
              >
                {page.settings.description || "No meta description set."}
              </p>
            </div>
          </div>

          {/* OG Image Preview */}
          {page.settings.ogImage && (
            <div className="rounded-lg border border-separator/40 bg-white dark:bg-background p-3 mb-2">
              <p className="text-[9px] text-muted mb-1.5 flex items-center gap-1">
                <span>🖼</span> OG Image Preview
              </p>
              <div className="rounded-md overflow-hidden border border-separator/30">
                <img
                  alt="Open Graph preview"
                  className="w-full h-auto max-h-32 object-cover"
                  src={page.settings.ogImage}
                />
              </div>
            </div>
          )}

          {/* SEO Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                className="text-[10px] font-semibold text-muted"
                htmlFor="seo-title"
              >
                SEO Title
              </label>
              <button className="text-[9px] text-[#634CF8] font-medium">
                ✨ Generate
              </button>
            </div>
            <input
              className="w-full h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 text-[11px] outline-none focus:border-[#634CF8]"
              id="seo-title"
              value={page.settings.title}
              onChange={(e) => onUpdateSettings({ title: e.target.value })}
            />
            <div className="mt-1 h-1 rounded-full bg-separator/20 overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  titleLengthColor(page.settings.title.length),
                )}
                style={{
                  width: `${Math.min(100, (page.settings.title.length / 60) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[9px] text-muted mt-0.5">
              {page.settings.title.length}/60 characters
            </p>
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                className="text-[10px] font-semibold text-muted"
                htmlFor="seo-description"
              >
                Meta Description
              </label>
              <button className="text-[9px] text-[#634CF8] font-medium">
                ✨ Generate
              </button>
            </div>
            <textarea
              className="w-full rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-3 py-2 text-[11px] outline-none focus:border-[#634CF8] resize-none h-16"
              id="seo-description"
              value={page.settings.description}
              onChange={(e) =>
                onUpdateSettings({ description: e.target.value })
              }
            />
            <div className="mt-1 h-1 rounded-full bg-separator/20 overflow-hidden">
              <div
                className={clsx(
                  "h-full rounded-full transition-all",
                  descLengthColor(page.settings.description.length),
                )}
                style={{
                  width: `${Math.min(100, (page.settings.description.length / 160) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[9px] text-muted mt-0.5">
              {page.settings.description.length}/160 characters
            </p>
          </div>

          {/* Analysis Results */}
          <CheckList checks={seoChecks} />

          {/* Recommendations */}
          <Recommendations checks={seoChecks} type="seo" />
        </div>
      )}

      {/* Readability Tab */}
      {activeTab === "readability" && (
        <div className="flex flex-col gap-2">
          <CheckList checks={readabilityChecks} />

          <Recommendations checks={readabilityChecks} type="readability" />
        </div>
      )}

      {/* AI / AEO Tab */}
      {activeTab === "aeo" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl bg-gradient-to-br from-[#634CF8]/10 to-[#634CF8]/5 p-4 border border-[#634CF8]/20">
            <p className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
              <span>🤖</span> AI Engine Optimization (AEO)
            </p>
            <p className="text-[10px] text-muted mt-1 leading-relaxed">
              Optimize your content for AI search engines like ChatGPT,
              Perplexity, and Google AI Overviews.
            </p>
          </div>

          <CheckList checks={aeoChecks} />

          <Recommendations checks={aeoChecks} type="aeo" />
        </div>
      )}
    </div>
  );
}

// ── Score Circle ──

function ScoreCircle({
  score,
  size,
  strokeWidth,
}: {
  score: number;
  size: number;
  strokeWidth: number;
}) {
  return (
    <div className="relative shrink-0" style={{ height: size, width: size }}>
      <svg
        className="-rotate-90"
        height={size}
        viewBox="0 0 36 36"
        width={size}
      >
        <path
          className="text-separator/30"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path
          className={
            score >= 70
              ? "text-green-500"
              : score >= 40
                ? "text-amber-500"
                : "text-red-500"
          }
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold text-foreground">
        {score}
      </span>
    </div>
  );
}

// ── Mini Score Indicator ──

function MiniScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative shrink-0" style={{ height: 18, width: 18 }}>
        <svg className="-rotate-90" height={18} viewBox="0 0 36 36" width={18}>
          <path
            className="text-separator/30"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
          />
          <path
            className={
              score >= 70
                ? "text-green-500"
                : score >= 40
                  ? "text-amber-500"
                  : "text-red-500"
            }
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            strokeWidth="5"
          />
        </svg>
      </div>
      <span className="text-[9px] text-muted font-medium">{label}</span>
    </div>
  );
}

// ── Check List Component ──

function CheckList({ checks }: { checks: SEOCheck[] }) {
  const good = checks.filter((c) => c.status === "good");
  const problems = checks.filter((c) => c.status === "bad");
  const improvements = checks.filter((c) => c.status === "ok");

  return (
    <div className="flex flex-col gap-2">
      {problems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1">
            Problems ({problems.length})
          </p>
          {problems.map((c, i) => (
            <CheckItem key={`bad-${i}`} check={c} />
          ))}
        </div>
      )}
      {improvements.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
            Improvements ({improvements.length})
          </p>
          {improvements.map((c, i) => (
            <CheckItem key={`ok-${i}`} check={c} />
          ))}
        </div>
      )}
      {good.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1">
            Good results ({good.length})
          </p>
          {good.map((c, i) => (
            <CheckItem key={`good-${i}`} check={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckItem({ check }: { check: SEOCheck }) {
  return (
    <div className="flex items-start gap-2 rounded-lg px-2.5 py-2 hover:bg-[#F8F8FA] dark:hover:bg-surface transition-colors">
      <span
        className={clsx(
          "h-2 w-2 rounded-full mt-1 shrink-0",
          SCORE_COLORS[check.status],
        )}
      />
      <div>
        <p
          className={clsx("text-[11px] font-medium", SCORE_TEXT[check.status])}
        >
          {check.label}
        </p>
        <p className="text-[10px] text-muted leading-relaxed">
          {check.message}
        </p>
      </div>
    </div>
  );
}

// ── Recommendations ──

const RECOMMENDATIONS: Record<string, Record<string, string>> = {
  seo: {
    bad: "Focus on fixing the red items first — they have the biggest impact on your search rankings.",
    ok: "You're on the right track. Address the amber items to push your SEO score above 70.",
    good: "Great SEO foundation! Keep your content fresh and monitor keyword rankings regularly.",
  },
  readability: {
    bad: "Your content may be hard to read. Shorten sentences, break up paragraphs, and use simpler words.",
    ok: "Readability is decent. Try adding subheadings every 300 words and mixing sentence lengths.",
    good: "Your content reads well! Maintain this quality as you add more sections.",
  },
  aeo: {
    bad: "AI engines may struggle to cite your content. Add structured data, clear answers, and specific facts.",
    ok: "Good start for AI optimization. Add FAQ sections, statistics, and clear question-answer patterns.",
    good: "Your content is well-structured for AI engines. Keep adding authoritative, fact-rich content.",
  },
};

function Recommendations({
  checks,
  type,
}: {
  checks: SEOCheck[];
  type: "seo" | "readability" | "aeo";
}) {
  const score = calculateScore(checks);
  const level: SEOScore = score >= 70 ? "good" : score >= 40 ? "ok" : "bad";
  const tips = RECOMMENDATIONS[type][level];

  const badCount = checks.filter((c) => c.status === "bad").length;
  const okCount = checks.filter((c) => c.status === "ok").length;

  return (
    <div className="rounded-lg bg-[#F8F8FA] dark:bg-surface p-3 mt-1">
      <p className="text-[10px] font-semibold text-foreground mb-1">
        💡 Recommendations
      </p>
      <p className="text-[10px] text-muted leading-relaxed">{tips}</p>
      {(badCount > 0 || okCount > 0) && (
        <p className="text-[9px] text-muted mt-1.5">
          {badCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {badCount} {badCount === 1 ? "issue" : "issues"}
            </span>
          )}
          {badCount > 0 && okCount > 0 && " · "}
          {okCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {okCount} {okCount === 1 ? "improvement" : "improvements"}
            </span>
          )}
          {" to address"}
        </p>
      )}
    </div>
  );
}

// ── Helper: Extract text from blocks ──

function extractTextFromBlocks(blocks: BlockInstance[]): string {
  return blocks
    .map((b) => {
      const p = b.props;

      return [
        p.headline,
        p.subtitle,
        p.title,
        p.content,
        p.body,
        p.body2,
        p.text,
        p.heading,
        p.copyright,
        p.question,
        p.answer,
        p.label,
        p.description,
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");
}

// ── Helper: Keyphrase density ──

function getKeyphraseDensity(
  text: string,
  keyphrase: string,
): { density: string; count: number; status: SEOScore } {
  if (!text || !keyphrase) {
    return { density: "0.0", count: 0, status: "bad" };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const kpLower = keyphrase.toLowerCase();
  const textLower = text.toLowerCase();

  let count = 0;
  let searchFrom = 0;

  while (true) {
    const idx = textLower.indexOf(kpLower, searchFrom);

    if (idx === -1) break;
    count++;
    searchFrom = idx + kpLower.length;
  }

  const kpWordCount = keyphrase.split(/\s+/).filter(Boolean).length;
  const density =
    words.length > 0 ? ((count * kpWordCount) / words.length) * 100 : 0;
  const rounded = density.toFixed(1);

  let status: SEOScore = "ok";

  if (density >= 0.5 && density <= 3) status = "good";
  else if (density > 3) status = "bad";
  else status = "ok";

  return { density: rounded, count, status };
}

// ── SEO Analysis (15+ checks) ──

function analyzeSEO(
  page: Page,
  blocks: BlockInstance[],
  keyphrase: string,
  allText: string,
  wordCount: number,
): SEOCheck[] {
  const checks: SEOCheck[] = [];
  const title = page.settings.title;
  const desc = page.settings.description;
  const slug = page.settings.slug;

  // 1. Title presence & length
  if (!title) {
    checks.push({
      label: "SEO title",
      status: "bad",
      message: "No SEO title set. Add a title for search engines.",
    });
  } else if (title.length < 30) {
    checks.push({
      label: "SEO title width",
      status: "ok",
      message: `Title is ${title.length} chars. Aim for 50–60 characters.`,
    });
  } else if (title.length > 60) {
    checks.push({
      label: "SEO title width",
      status: "ok",
      message: `Title is ${title.length} chars — slightly long. Keep under 60.`,
    });
  } else {
    checks.push({
      label: "SEO title width",
      status: "good",
      message: "Title length is optimal (50–60 characters).",
    });
  }

  // 2. Title uses power words
  if (title) {
    const titleLower = title.toLowerCase();
    const found = POWER_WORDS.filter((w) => titleLower.includes(w));

    if (found.length > 0) {
      checks.push({
        label: "Power words in title",
        status: "good",
        message: `Title uses power words: ${found.slice(0, 3).join(", ")}.`,
      });
    } else {
      checks.push({
        label: "Power words in title",
        status: "ok",
        message:
          "Add power words (free, best, guide, how to) to boost click-through rate.",
      });
    }
  }

  // 3. Description presence & length
  if (!desc) {
    checks.push({
      label: "Meta description",
      status: "bad",
      message: "No meta description. Add one to improve click-through rates.",
    });
  } else if (desc.length < 120) {
    checks.push({
      label: "Meta description length",
      status: "ok",
      message: `Description is ${desc.length} chars. Aim for 120–160.`,
    });
  } else if (desc.length > 160) {
    checks.push({
      label: "Meta description length",
      status: "ok",
      message: `Description is ${desc.length} chars — slightly long.`,
    });
  } else {
    checks.push({
      label: "Meta description length",
      status: "good",
      message: "Meta description length is optimal.",
    });
  }

  // 4. No duplicate title/description
  if (title && desc && title.toLowerCase() === desc.toLowerCase()) {
    checks.push({
      label: "Duplicate title & description",
      status: "bad",
      message:
        "Title and meta description are identical. Make them unique for better SEO.",
    });
  } else if (title && desc) {
    checks.push({
      label: "Unique title & description",
      status: "good",
      message: "Title and meta description are different.",
    });
  }

  // 5. Slug presence & length
  if (!slug || slug.length === 0) {
    checks.push({
      label: "URL slug",
      status: "bad",
      message: "Set a URL slug for this page.",
    });
  } else if (slug.length > 75) {
    checks.push({
      label: "URL slug length",
      status: "ok",
      message: `Slug is ${slug.length} chars. Keep under 75 for best results.`,
    });
  } else {
    checks.push({
      label: "URL slug",
      status: "good",
      message: `URL slug is set (${slug.length} chars).`,
    });
  }

  // 6. OG image
  if (page.settings.ogImage) {
    checks.push({
      label: "OG image",
      status: "good",
      message: "Open Graph image is set for social sharing.",
    });
  } else {
    checks.push({
      label: "OG image",
      status: "ok",
      message: "Set an OG image for better social media previews when shared.",
    });
  }

  // 7. Content length
  if (wordCount < 100) {
    checks.push({
      label: "Text length",
      status: "bad",
      message: `Only ${wordCount} words. Aim for at least 300 words.`,
    });
  } else if (wordCount < 300) {
    checks.push({
      label: "Text length",
      status: "ok",
      message: `${wordCount} words — slightly below recommended 300 minimum.`,
    });
  } else {
    checks.push({
      label: "Text length",
      status: "good",
      message: `${wordCount} words — good content length.`,
    });
  }

  // 8. Outbound links (check for http in text)
  if (allText.includes("http://") || allText.includes("https://")) {
    checks.push({
      label: "Outbound links",
      status: "good",
      message: "Content contains external links, which can boost authority.",
    });
  } else {
    checks.push({
      label: "Outbound links",
      status: "ok",
      message: "Consider adding outbound links to authoritative sources.",
    });
  }

  // 9. Images present
  const imageBlocks = blocks.filter(
    (b) => b.type === "image" || b.type === "gallery" || b.type === "hero",
  );

  if (imageBlocks.length > 0) {
    checks.push({
      label: "Images",
      status: "good",
      message: `Page contains ${imageBlocks.length} image-related block(s).`,
    });
  } else {
    checks.push({
      label: "Images",
      status: "ok",
      message: "Consider adding images to improve engagement.",
    });
  }

  // 10. Image alt text
  const imagesWithoutAlt = blocks.filter(
    (b) =>
      (b.type === "image" || b.type === "gallery") &&
      !b.props.alt &&
      !b.props.altText,
  );

  if (imageBlocks.length > 0 && imagesWithoutAlt.length === 0) {
    checks.push({
      label: "Image alt text",
      status: "good",
      message: "All image blocks have alt text set.",
    });
  } else if (imagesWithoutAlt.length > 0) {
    checks.push({
      label: "Image alt text",
      status: "bad",
      message: `${imagesWithoutAlt.length} image block(s) missing alt text. Add descriptive alt text for accessibility and SEO.`,
    });
  }

  // 11. Headings
  const hasHeadings = blocks.some(
    (b) =>
      b.type === "hero" ||
      b.type === "features" ||
      b.type === "content" ||
      b.type === "text",
  );

  if (hasHeadings) {
    checks.push({
      label: "Headings",
      status: "good",
      message: "Page uses heading structure.",
    });
  } else {
    checks.push({
      label: "Headings",
      status: "bad",
      message: "Add headings to structure your content.",
    });
  }

  // 12. Internal links / CTAs
  const hasCTA = blocks.some((b) => b.type === "cta" || b.type === "navbar");

  if (hasCTA) {
    checks.push({
      label: "Internal links",
      status: "good",
      message: "Page contains navigation and CTAs.",
    });
  } else {
    checks.push({
      label: "Internal links",
      status: "ok",
      message: "Add internal links or CTAs to guide visitors.",
    });
  }

  // 13. Mobile-friendly (responsive blocks)
  const hasResponsive = blocks.some(
    (b) =>
      b.type === "columns" || b.type === "features" || b.type === "pricing",
  );

  if (hasResponsive) {
    checks.push({
      label: "Mobile-friendly layout",
      status: "good",
      message: "Page uses responsive layout blocks (columns, features, etc.).",
    });
  } else {
    checks.push({
      label: "Mobile-friendly layout",
      status: "ok",
      message:
        "Consider adding responsive blocks like columns for better mobile experience.",
    });
  }

  // Keyphrase-specific checks (14–17)
  if (keyphrase) {
    const kpLower = keyphrase.toLowerCase();
    const titleLower = title.toLowerCase();

    // 14. Keyphrase at beginning of title
    if (titleLower.startsWith(kpLower)) {
      checks.push({
        label: "Keyphrase at title start",
        status: "good",
        message: "Focus keyphrase appears at the beginning of the title.",
      });
    } else if (titleLower.includes(kpLower)) {
      checks.push({
        label: "Keyphrase at title start",
        status: "ok",
        message:
          "Keyphrase is in the title but not at the beginning. Move it to the front for better SEO.",
      });
    } else {
      checks.push({
        label: "Keyphrase at title start",
        status: "bad",
        message: "Focus keyphrase not found in SEO title.",
      });
    }

    // 15. Keyphrase in description
    if (desc.toLowerCase().includes(kpLower)) {
      checks.push({
        label: "Keyphrase in description",
        status: "good",
        message: "Focus keyphrase appears in meta description.",
      });
    } else {
      checks.push({
        label: "Keyphrase in description",
        status: "ok",
        message: "Consider adding the focus keyphrase to the meta description.",
      });
    }

    // 16. Keyphrase in URL
    if (slug.includes(kpLower.replace(/\s+/g, "-"))) {
      checks.push({
        label: "Keyphrase in URL",
        status: "good",
        message: "Focus keyphrase appears in the URL slug.",
      });
    } else {
      checks.push({
        label: "Keyphrase in URL",
        status: "ok",
        message: "Consider adding the keyphrase to the URL slug.",
      });
    }

    // 17. Keyphrase in first paragraph
    const firstBlockText =
      blocks.length > 0 ? extractTextFromBlocks([blocks[0]]) : "";

    if (firstBlockText.toLowerCase().includes(kpLower)) {
      checks.push({
        label: "Keyphrase in introduction",
        status: "good",
        message: "Focus keyphrase appears in the first content block.",
      });
    } else {
      checks.push({
        label: "Keyphrase in introduction",
        status: "ok",
        message:
          "Add the focus keyphrase to your first paragraph for better relevance signals.",
      });
    }

    // 18. Keyphrase density
    const kpInfo = getKeyphraseDensity(allText, keyphrase);

    if (kpInfo.status === "good") {
      checks.push({
        label: "Keyphrase density",
        status: "good",
        message: `Keyphrase density is ${kpInfo.density}% (${kpInfo.count} occurrences). Optimal range is 0.5–3%.`,
      });
    } else if (kpInfo.count === 0) {
      checks.push({
        label: "Keyphrase density",
        status: "bad",
        message:
          "Keyphrase not found in content. Use it naturally throughout your text.",
      });
    } else if (parseFloat(kpInfo.density) > 3) {
      checks.push({
        label: "Keyphrase density",
        status: "bad",
        message: `Keyphrase density is ${kpInfo.density}% — too high. Reduce to avoid keyword stuffing.`,
      });
    } else {
      checks.push({
        label: "Keyphrase density",
        status: "ok",
        message: `Keyphrase density is ${kpInfo.density}%. Aim for 0.5–3%.`,
      });
    }
  }

  return checks;
}

// ── Readability Analysis (8+ checks) ──

function analyzeReadability(
  text: string,
  wordCount: number,
  blocks: BlockInstance[],
): SEOCheck[] {
  const checks: SEOCheck[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength =
    sentences.length > 0 ? wordCount / sentences.length : 0;

  // 1. Flesch reading ease (simplified)
  const syllableCount = estimateSyllables(text);
  const flesch =
    sentences.length > 0 && wordCount > 0
      ? 206.835 -
        1.015 * (wordCount / sentences.length) -
        84.6 * (syllableCount / wordCount)
      : 0;
  const fleschRounded = Math.round(Math.max(0, Math.min(100, flesch)));

  if (fleschRounded >= 60) {
    checks.push({
      label: "Flesch reading ease",
      status: "good",
      message: `Score: ${fleschRounded}/100. Content is easy to read.`,
    });
  } else if (fleschRounded >= 30) {
    checks.push({
      label: "Flesch reading ease",
      status: "ok",
      message: `Score: ${fleschRounded}/100. Content is somewhat difficult. Simplify language.`,
    });
  } else {
    checks.push({
      label: "Flesch reading ease",
      status: "bad",
      message: `Score: ${fleschRounded}/100. Content is very difficult to read. Use shorter words and sentences.`,
    });
  }

  // 2. Sentence length
  if (avgSentenceLength > 25) {
    checks.push({
      label: "Sentence length",
      status: "bad",
      message: `Average ${Math.round(avgSentenceLength)} words/sentence. Keep under 20 for readability.`,
    });
  } else if (avgSentenceLength > 20) {
    checks.push({
      label: "Sentence length",
      status: "ok",
      message: `Average ${Math.round(avgSentenceLength)} words/sentence. Slightly long.`,
    });
  } else {
    checks.push({
      label: "Sentence length",
      status: "good",
      message: "Sentence length is good for readability.",
    });
  }

  // 3. Paragraph length
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).length > 150);

  if (longParagraphs.length > 0) {
    checks.push({
      label: "Paragraph length",
      status: "ok",
      message: `${longParagraphs.length} paragraph(s) are too long. Break them up.`,
    });
  } else {
    checks.push({
      label: "Paragraph length",
      status: "good",
      message: "Paragraph lengths are good.",
    });
  }

  // 4. Consecutive sentences starting with same word
  if (sentences.length >= 3) {
    let consecutiveCount = 0;

    for (let i = 1; i < sentences.length; i++) {
      const prevFirst = sentences[i - 1].trim().split(/\s+/)[0]?.toLowerCase();
      const currFirst = sentences[i].trim().split(/\s+/)[0]?.toLowerCase();

      if (prevFirst && currFirst && prevFirst === currFirst) {
        consecutiveCount++;
      }
    }

    if (consecutiveCount > 2) {
      checks.push({
        label: "Sentence beginnings",
        status: "bad",
        message: `${consecutiveCount} consecutive sentences start with the same word. Vary your sentence openings.`,
      });
    } else if (consecutiveCount > 0) {
      checks.push({
        label: "Sentence beginnings",
        status: "ok",
        message: `${consecutiveCount} pair(s) of consecutive sentences start the same way. Try varying them.`,
      });
    } else {
      checks.push({
        label: "Sentence beginnings",
        status: "good",
        message: "Good variety in sentence beginnings.",
      });
    }
  }

  // 5. Passive voice (simplified check)
  const passiveWords = ["was", "were", "been", "being"];
  const words = text.toLowerCase().split(/\s+/);
  const passiveCount = words.filter((w) => passiveWords.includes(w)).length;
  const passiveRatio = wordCount > 0 ? passiveCount / wordCount : 0;

  if (passiveRatio > 0.1) {
    checks.push({
      label: "Passive voice",
      status: "ok",
      message: "Consider using more active voice for clarity.",
    });
  } else {
    checks.push({
      label: "Passive voice",
      status: "good",
      message: "Good use of active voice.",
    });
  }

  // 6. Transition words
  const transitions = [
    "however",
    "therefore",
    "moreover",
    "furthermore",
    "additionally",
    "consequently",
    "meanwhile",
    "nevertheless",
    "although",
    "because",
    "finally",
    "first",
    "second",
    "next",
    "then",
    "also",
    "in addition",
    "for example",
    "in conclusion",
  ];
  const transitionCount = transitions.filter((t) =>
    text.toLowerCase().includes(t),
  ).length;

  if (transitionCount >= 3) {
    checks.push({
      label: "Transition words",
      status: "good",
      message: `Content uses ${transitionCount} types of transition words for good flow.`,
    });
  } else if (transitionCount > 0) {
    checks.push({
      label: "Transition words",
      status: "ok",
      message: `Only ${transitionCount} type(s) of transition words found. Add more for better flow.`,
    });
  } else {
    checks.push({
      label: "Transition words",
      status: "bad",
      message:
        "No transition words found. Add words like however, therefore, additionally.",
    });
  }

  // 7. Subheading distribution (every 300 words)
  const headingBlocks = blocks.filter(
    (b) =>
      b.type === "hero" ||
      b.type === "features" ||
      b.type === "content" ||
      b.type === "text",
  );
  const headingCount = headingBlocks.length;

  if (wordCount > 300) {
    const expectedHeadings = Math.floor(wordCount / 300);

    if (headingCount >= expectedHeadings) {
      checks.push({
        label: "Subheading distribution",
        status: "good",
        message: `${headingCount} heading block(s) for ${wordCount} words. Good distribution.`,
      });
    } else {
      checks.push({
        label: "Subheading distribution",
        status: "ok",
        message: `Only ${headingCount} heading block(s) for ${wordCount} words. Add a subheading every ~300 words.`,
      });
    }
  } else {
    checks.push({
      label: "Subheading distribution",
      status: "good",
      message: "Content is short enough that subheading distribution is fine.",
    });
  }

  // 8. Text contains lists
  const hasLists =
    text.includes("•") ||
    text.includes("- ") ||
    text.includes("1.") ||
    text.includes("2.");

  if (hasLists) {
    checks.push({
      label: "Use of lists",
      status: "good",
      message: "Content uses lists, which improves scannability.",
    });
  } else {
    checks.push({
      label: "Use of lists",
      status: "ok",
      message: "Consider adding bullet or numbered lists to break up content.",
    });
  }

  // 9. Sentence variety (mix of short and long)
  if (sentences.length >= 4) {
    const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
    const shortSentences = lengths.filter((l) => l <= 10).length;
    const longSentences = lengths.filter((l) => l > 20).length;
    const hasVariety = shortSentences > 0 && longSentences > 0;

    if (hasVariety) {
      checks.push({
        label: "Sentence variety",
        status: "good",
        message: "Good mix of short and long sentences keeps readers engaged.",
      });
    } else if (shortSentences === 0 && longSentences > 0) {
      checks.push({
        label: "Sentence variety",
        status: "ok",
        message:
          "Most sentences are long. Mix in some short, punchy sentences.",
      });
    } else {
      checks.push({
        label: "Sentence variety",
        status: "ok",
        message:
          "Sentences are similar in length. Vary between short and long for better rhythm.",
      });
    }
  }

  return checks;
}

// ── AEO Analysis (dynamic, content-based) ──

function analyzeAEO(
  page: Page,
  allText: string,
  blocks: BlockInstance[],
  wordCount: number,
): SEOCheck[] {
  const checks: SEOCheck[] = [];
  const textLower = allText.toLowerCase();

  // 1. FAQ blocks present
  const hasFAQ = blocks.some((b) => b.type === "faq");

  if (hasFAQ) {
    checks.push({
      label: "FAQ section",
      status: "good",
      message:
        "FAQ block detected — great for featured snippets and AI citations.",
    });
  } else {
    checks.push({
      label: "FAQ section",
      status: "ok",
      message:
        "Add an FAQ block to increase chances of appearing in featured snippets.",
    });
  }

  // 2. Stats/numbers in content
  const numberMatches = allText.match(/\d+(\.\d+)?(%|\+|x|k|m|b)?/gi);
  const numberCount = numberMatches ? numberMatches.length : 0;

  if (numberCount >= 5) {
    checks.push({
      label: "Statistics & numbers",
      status: "good",
      message: `Content includes ${numberCount} numeric references. AI engines love citing specific data.`,
    });
  } else if (numberCount > 0) {
    checks.push({
      label: "Statistics & numbers",
      status: "ok",
      message: `Only ${numberCount} numeric reference(s). Add more specific stats, percentages, or data points.`,
    });
  } else {
    checks.push({
      label: "Statistics & numbers",
      status: "bad",
      message:
        "No statistics or numbers found. Add specific data points for AI engines to cite.",
    });
  }

  // 3. Question-answer format detection
  const questionPatterns = [
    "what is",
    "what are",
    "how to",
    "how do",
    "how does",
    "why is",
    "why do",
    "when should",
    "where can",
    "who is",
    "can you",
    "is it",
    "does it",
  ];
  const questionCount = questionPatterns.filter((q) =>
    textLower.includes(q),
  ).length;

  if (questionCount >= 3) {
    checks.push({
      label: "Question-answer format",
      status: "good",
      message: `${questionCount} question patterns detected. Great for AI-powered search results.`,
    });
  } else if (questionCount > 0) {
    checks.push({
      label: "Question-answer format",
      status: "ok",
      message: `${questionCount} question pattern(s) found. Add more Q&A-style content for AI engines.`,
    });
  } else {
    checks.push({
      label: "Question-answer format",
      status: "bad",
      message:
        "No question-answer patterns found. Structure content as Q&A for better AI visibility.",
    });
  }

  // 4. Content structure (heading hierarchy)
  const blockTypes = blocks.map((b) => b.type);
  const hasHero = blockTypes.includes("hero");
  const hasContent =
    blockTypes.includes("content") || blockTypes.includes("features");
  const hasGoodStructure = hasHero && hasContent && blocks.length >= 3;

  if (hasGoodStructure) {
    checks.push({
      label: "Content structure",
      status: "good",
      message:
        "Good heading hierarchy with hero, content sections, and multiple blocks.",
    });
  } else if (blocks.length >= 2) {
    checks.push({
      label: "Content structure",
      status: "ok",
      message:
        "Basic structure present. Add a clear H1 (hero) followed by H2/H3 sections.",
    });
  } else {
    checks.push({
      label: "Content structure",
      status: "bad",
      message:
        "Weak content structure. Use a clear H1 → H2 → H3 hierarchy for AI parsing.",
    });
  }

  // 5. Author/brand mentions
  const brandIndicators = [
    "by ",
    "author",
    "written by",
    "published by",
    "team",
    "about us",
  ];
  const hasBrandMention = brandIndicators.some((b) => textLower.includes(b));

  if (hasBrandMention) {
    checks.push({
      label: "Author/brand mentions",
      status: "good",
      message:
        "Author or brand references detected. This builds trust with AI engines.",
    });
  } else {
    checks.push({
      label: "Author/brand mentions",
      status: "ok",
      message:
        "Add author or brand information to boost credibility and E-E-A-T signals.",
    });
  }

  // 6. Content uniqueness indicator (based on content diversity)
  const uniqueWords = new Set(
    allText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
  const uniqueRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  if (uniqueRatio >= 0.4) {
    checks.push({
      label: "Content uniqueness",
      status: "good",
      message: `High vocabulary diversity (${Math.round(uniqueRatio * 100)}% unique words). Content appears original.`,
    });
  } else if (uniqueRatio >= 0.25) {
    checks.push({
      label: "Content uniqueness",
      status: "ok",
      message: `Moderate vocabulary diversity (${Math.round(uniqueRatio * 100)}%). Try using more varied language.`,
    });
  } else if (wordCount > 0) {
    checks.push({
      label: "Content uniqueness",
      status: "bad",
      message: `Low vocabulary diversity (${Math.round(uniqueRatio * 100)}%). Content may appear repetitive to AI.`,
    });
  }

  // 7. Direct answers (concise definitions/explanations)
  const definitionPatterns = [
    " is a ",
    " is an ",
    " refers to ",
    " means ",
    " defined as ",
    " is the ",
  ];
  const hasDefinitions = definitionPatterns.some((p) => textLower.includes(p));

  if (hasDefinitions) {
    checks.push({
      label: "Direct answers",
      status: "good",
      message:
        "Content includes clear definitions — ideal for AI-generated answers.",
    });
  } else {
    checks.push({
      label: "Direct answers",
      status: "ok",
      message:
        "Add clear, concise definitions and explanations for AI to extract.",
    });
  }

  // 8. Content freshness
  if (page.settings.updatedAt) {
    const updated = new Date(page.settings.updatedAt);
    const now = new Date();
    const daysSinceUpdate = Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceUpdate <= 30) {
      checks.push({
        label: "Content freshness",
        status: "good",
        message: `Updated ${daysSinceUpdate} day(s) ago. Fresh content ranks better.`,
      });
    } else if (daysSinceUpdate <= 90) {
      checks.push({
        label: "Content freshness",
        status: "ok",
        message: `Updated ${daysSinceUpdate} days ago. Consider refreshing your content.`,
      });
    } else {
      checks.push({
        label: "Content freshness",
        status: "bad",
        message: `Updated ${daysSinceUpdate} days ago. Stale content loses AI visibility.`,
      });
    }
  }

  return checks;
}

// ── Utility Functions ──

function estimateSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);

  return words.reduce((total, word) => {
    const cleaned = word.replace(/[^a-z]/g, "");

    if (cleaned.length <= 3) return total + 1;

    let count = cleaned
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .match(/[aeiouy]{1,2}/g);

    return total + (count ? count.length : 1);
  }, 0);
}

function calculateScore(checks: SEOCheck[]): number {
  if (checks.length === 0) return 50;

  const scores = checks.map((c) =>
    c.status === "good" ? 100 : c.status === "ok" ? 60 : 20,
  );

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function scoreColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";

  return "bg-red-500";
}

function titleLengthColor(len: number): string {
  if (len >= 30 && len <= 60) return "bg-green-500";
  if (len > 0) return "bg-amber-500";

  return "bg-red-500";
}

function descLengthColor(len: number): string {
  if (len >= 120 && len <= 160) return "bg-green-500";
  if (len > 0) return "bg-amber-500";

  return "bg-red-500";
}
