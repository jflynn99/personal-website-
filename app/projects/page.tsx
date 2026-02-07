import { Metadata } from "next";
import { Container } from "@/components/layout";
import { ProjectGrid } from "@/components/projects";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "A collection of projects I've built and contributed to.",
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Projects
        </h1>
        <p className="mt-2 text-muted">
          A collection of more project based articles where I produced real outputs.
        </p>
      </div>

      <ProjectGrid projects={projects} />
    </Container>
  );
}
