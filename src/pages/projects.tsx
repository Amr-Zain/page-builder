import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import { Plus, FolderOpen } from "lucide-react";

import { ProjectStorage } from "../page-builder/project-storage";
import type { ProjectMeta } from "../page-builder/project-storage";
import type { PagesState } from "../page-builder/pages";
import { ProjectCard } from "../page-builder/components/ProjectCard";
import { CreateProjectModal } from "../page-builder/components/CreateProjectModal";
import { DeleteConfirmModal } from "../page-builder/components/DeleteConfirmModal";

interface ProjectWithPages {
  project: ProjectMeta;
  pagesState: PagesState;
}

export default function ProjectsDashboard() {
  const navigate = useNavigate();
  const [projectsWithPages, setProjectsWithPages] = useState<ProjectWithPages[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectMeta | null>(null);

  const loadProjects = useCallback(() => {
    const projects = ProjectStorage.listProjects();
    const withPages: ProjectWithPages[] = projects.map((project) => ({
      project,
      pagesState: ProjectStorage.loadProjectPages(project.id),
    }));
    setProjectsWithPages(withPages);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = (name: string) => {
    const project = ProjectStorage.createProject(name);
    setIsCreateModalOpen(false);
    navigate(`/page-builder/${project.id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/page-builder/${id}`);
  };

  const handleHistory = (id: string) => {
    navigate(`/projects/${id}/history`);
  };

  const handleDeleteClick = (id: string) => {
    const project = ProjectStorage.getProject(id);
    if (project) {
      setDeleteTarget(project);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      ProjectStorage.deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      loadProjects();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted mt-1">
              Manage your websites and page builder projects
            </p>
          </div>
          <Button onPress={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            New Project
          </Button>
        </div>

        {/* Content */}
        {projectsWithPages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
              <FolderOpen size={32} className="text-muted" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No projects yet
            </h2>
            <p className="text-sm text-muted mb-6 max-w-sm">
              Create your first project to start building beautiful websites with the page builder.
            </p>
            <Button onPress={() => setIsCreateModalOpen(true)}>
              <Plus size={16} />
              Create your first project
            </Button>
          </div>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsWithPages.map(({ project, pagesState }) => (
              <ProjectCard
                key={project.id}
                project={project}
                pagesState={pagesState}
                onEdit={handleEdit}
                onHistory={handleHistory}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        projectName={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
