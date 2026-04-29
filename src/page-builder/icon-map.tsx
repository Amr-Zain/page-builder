import {
  Menu, Rocket, Sparkles, MessageSquare, DollarSign, BarChart3, Users,
  HelpCircle, Megaphone, Mail, Building2, Target, Image, ClipboardList,
  Type, CircleDot, Code, Puzzle, Package, Grid3X3, ArrowLeftRight,
  ArrowUpDown, MoveHorizontal, Columns3, Space, Minus, Video,
  MousePointer, Link, Lightbulb, MessageCircle, CreditCard, UserCircle,
  Tag, Layers, FolderOpen, Table, SeparatorHorizontal,
  TextCursorInput, AlignLeft, ListFilter, CheckSquare, ToggleLeft,
  Radio, SlidersHorizontal, BookOpen, Maximize2, Hash, Smartphone,
  FileText
} from "lucide-react";
import type { ReactNode } from "react";

const ICON_MAP: Record<string, ReactNode> = {
  // Sections
  "menu": <Menu size={14} />,
  "rocket": <Rocket size={14} />,
  "sparkles": <Sparkles size={14} />,
  "message-square": <MessageSquare size={14} />,
  "dollar-sign": <DollarSign size={14} />,
  "bar-chart": <BarChart3 size={14} />,
  "users": <Users size={14} />,
  "help-circle": <HelpCircle size={14} />,
  "megaphone": <Megaphone size={14} />,
  "mail": <Mail size={14} />,
  "building": <Building2 size={14} />,
  "target": <Target size={14} />,
  "image": <Image size={14} />,
  "clipboard": <ClipboardList size={14} />,
  // Content
  "type": <Type size={14} />,
  "circle-dot": <CircleDot size={14} />,
  "code": <Code size={14} />,
  "puzzle": <Puzzle size={14} />,
  // Layout
  "package": <Package size={14} />,
  "grid": <Grid3X3 size={14} />,
  "arrow-left-right": <ArrowLeftRight size={14} />,
  "move-horizontal": <MoveHorizontal size={14} />,
  "arrow-up-down": <ArrowUpDown size={14} />,
  "columns": <Columns3 size={14} />,
  "space": <Space size={14} />,
  "minus": <Minus size={14} />,
  "maximize": <Maximize2 size={14} />,
  // Media
  "video": <Video size={14} />,
  // Components - Actions
  "mouse-pointer": <MousePointer size={14} />,
  "link": <Link size={14} />,
  "lightbulb": <Lightbulb size={14} />,
  "message-circle": <MessageCircle size={14} />,
  // Components - Display
  "credit-card": <CreditCard size={14} />,
  "user-circle": <UserCircle size={14} />,
  "tag": <Tag size={14} />,
  "layers": <Layers size={14} />,
  "folder-open": <FolderOpen size={14} />,
  "table": <Table size={14} />,
  "separator": <SeparatorHorizontal size={14} />,
  // Components - Forms
  "text-cursor": <TextCursorInput size={14} />,
  "align-left": <AlignLeft size={14} />,
  "list-filter": <ListFilter size={14} />,
  "check-square": <CheckSquare size={14} />,
  "toggle-left": <ToggleLeft size={14} />,
  "radio": <Radio size={14} />,
  "sliders": <SlidersHorizontal size={14} />,
  // Components - Navigation
  "book-open": <BookOpen size={14} />,
  // Menu system
  "hash": <Hash size={14} />,
  "smartphone": <Smartphone size={14} />,
  "file-text": <FileText size={14} />,
};

/** Render a block/component icon from its string key. Falls back to the string itself (for emojis). */
export function renderIcon(icon: string, size?: number): ReactNode {
  if (!icon) return <Package size={size || 14} />;
  const mapped = ICON_MAP[icon];
  if (mapped) return mapped;
  // Fallback: render as text (for any remaining emojis)
  return <span className="text-sm">{icon}</span>;
}
