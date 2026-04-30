import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import PageBuilder from "@/page-builder/PageBuilder";

const ProjectsDashboard = lazy(() => import("@/pages/projects"));
const WebsiteHistory = lazy(() => import("@/pages/project-history"));

function App() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-muted">Loading...</div>}>
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<ProjectsDashboard />} path="/projects" />
        <Route element={<WebsiteHistory />} path="/projects/:id/history" />
        <Route element={<PageBuilder />} path="/page-builder/:projectId?" />
      </Routes>
    </Suspense>
  );
}

export default App;
