import { Button, Card, Chip } from "@heroui/react";
import { Pencil, Clock, Trash2, Layout } from "lucide-react";

import type { ProjectMeta } from "../project-storage";
import type { PagesState } from "../pages";
import { formatRelativeTime } from "../utils/format-time";

interface ProjectCardProps {
  project: ProjectMeta;
  pagesState: PagesState;
  onEdit: (id: string) => void;
  onHistory: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({
  project,
  pagesState,
  onEdit,
  onHistory,
  onDelete,
}: ProjectCardProps) {
  const pages = pagesState.pages;
  const pageCount = pages.length;

  // Determine published status
  const isPublished = pages.some((page) => page.settings.published === true);

  // Get the most recent updatedAt across all pages
  const lastUpdated = pages.reduce((latest, page) => {
    const pageDate = page.settings.updatedAt;
    if (!latest) return pageDate;
    return pageDate > latest ? pageDate : latest;
  }, "");

  const relativeTime = lastUpdated ? formatRelativeTime(lastUpdated) : "";

  return (
    <Card className="flex flex-col h-full">
      {/* Preview placeholder */}
      <div className="h-32 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <Layout size={32} className="text-muted" />
      </div>

      <Card.Header className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <Card.Title className="text-base truncate">{project.name}</Card.Title>
          <Chip
            size="sm"
            color={isPublished ? "success" : "warning"}
            variant="soft"
          >
            {isPublished ? "Published" : "Draft"}
          </Chip>
        </div>
        <Card.Description>
          {pageCount} page{pageCount !== 1 ? "s" : ""}
          {relativeTime && ` · Updated ${relativeTime}`}
        </Card.Description>
      </Card.Header>

      <Card.Footer className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => onEdit(project.id)}
          aria-label="Edit project"
        >
          <Pencil size={14} />
          Edit
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => onHistory(project.id)}
          aria-label="View history"
        >
          <Clock size={14} />
          History
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          className="ml-auto text-danger"
          onPress={() => onDelete(project.id)}
          aria-label="Delete project"
        >
          <Trash2 size={14} />
        </Button>
      </Card.Footer>
    </Card>
  );
}
