import { useState, useCallback, useEffect } from "react";
import { Slider, Label } from "@heroui/react";

/** Preset colors for quick selection */
const PRESET_COLORS = [
  { label: "Accent", hex: "#634CF8" },
  { label: "Success", hex: "#22C55E" },
  { label: "Warning", hex: "#F59E0B" },
  { label: "Danger", hex: "#EF4444" },
  { label: "Neutral 900", hex: "#171717" },
  { label: "Neutral 600", hex: "#525252" },
  { label: "Neutral 400", hex: "#A3A3A3" },
  { label: "Neutral 100", hex: "#F5F5F5" },
  { label: "White", hex: "#FFFFFF" },
  { label: "Transparent", hex: "transparent" },
];

/** Convert hex + opacity (0-100) to rgba string */
function hexToRgba(hex: string, opacity: number): string {
  if (hex === "transparent") return "transparent";
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  if (opacity >= 100) return hex;
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
}

/** Parse a color value to extract hex and opacity */
function parseColor(value: string): { hex: string; opacity: number } {
  if (!value || value === "transparent") {
    return { hex: "#000000", opacity: 100 };
  }
  // Try rgba format
  const rgbaMatch = value.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/,
  );
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
    const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    return { hex, opacity: Math.round(a * 100) };
  }
  // Hex format
  if (value.startsWith("#")) {
    return { hex: value.length === 4 ? expandShortHex(value) : value, opacity: 100 };
  }
  return { hex: value, opacity: 100 };
}

function expandShortHex(hex: string): string {
  const c = hex.replace("#", "");
  return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
}

/**
 * Reusable color picker with native input, hex text field, opacity slider, and presets.
 */
export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const parsed = parseColor(value);
  const [hex, setHex] = useState(parsed.hex);
  const [opacity, setOpacity] = useState(parsed.opacity);

  // Sync internal state when external value changes
  useEffect(() => {
    const p = parseColor(value);
    setHex(p.hex);
    setOpacity(p.opacity);
  }, [value]);

  const emitChange = useCallback(
    (newHex: string, newOpacity: number) => {
      if (newHex === "transparent") {
        onChange("transparent");
        return;
      }
      const output = newOpacity < 100 ? hexToRgba(newHex, newOpacity) : newHex;
      onChange(output);
    },
    [onChange],
  );

  function handleHexChange(newHex: string) {
    setHex(newHex);
    if (/^#[0-9a-fA-F]{6}$/.test(newHex)) {
      emitChange(newHex, opacity);
    }
  }

  function handleNativeColorChange(newHex: string) {
    setHex(newHex);
    emitChange(newHex, opacity);
  }

  function handleOpacityChange(newOpacity: number | number[]) {
    const val = Array.isArray(newOpacity) ? newOpacity[0] : newOpacity;
    setOpacity(val);
    emitChange(hex, val);
  }

  function handlePresetClick(presetHex: string) {
    if (presetHex === "transparent") {
      setHex("#000000");
      setOpacity(0);
      onChange("transparent");
      return;
    }
    setHex(presetHex);
    setOpacity(100);
    emitChange(presetHex, 100);
  }

  return (
    <div>
      <label className="text-[11px] font-semibold text-muted block mb-1.5">
        {label}
      </label>

      {/* Color input + hex field */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative shrink-0">
          <div
            className="h-8 w-8 rounded-lg border border-separator/40 cursor-pointer"
            style={{
              backgroundColor: hex === "transparent" ? "transparent" : hex,
              backgroundImage:
                hex === "transparent"
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : undefined,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
          <input
            className="absolute inset-0 opacity-0 cursor-pointer"
            type="color"
            value={hex === "transparent" ? "#000000" : hex}
            onChange={(e) => handleNativeColorChange(e.target.value)}
          />
        </div>
        <input
          className="flex-1 h-8 rounded-lg border border-separator/50 bg-[#FAFAFA] dark:bg-surface px-2 text-[11px] font-mono outline-none focus:border-[#634CF8]"
          placeholder="#000000"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
        />
      </div>

      {/* Opacity slider */}
      <div className="mb-2">
        <Slider
          value={opacity}
          onChange={handleOpacityChange}
          minValue={0}
          maxValue={100}
          step={1}
        >
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted">Opacity</Label>
            <Slider.Output className="text-[10px] text-muted font-mono" />
          </div>
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>

      {/* Preset colors */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((preset) => (
          <button
            key={preset.hex}
            className="h-5 w-5 rounded-md border border-separator/40 hover:ring-1 hover:ring-[#634CF8]/40 transition-all"
            title={preset.label}
            style={{
              backgroundColor:
                preset.hex === "transparent" ? "transparent" : preset.hex,
              backgroundImage:
                preset.hex === "transparent"
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : undefined,
              backgroundSize: "6px 6px",
              backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px",
            }}
            onClick={() => handlePresetClick(preset.hex)}
          />
        ))}
      </div>
    </div>
  );
}
