import { Container } from "@/components/layout";
import { Hero, LatestPosts, FeaturedProject } from "@/components/home";
import { getLatestPosts } from "@/lib/posts";
import { getFeaturedProjects } from "@/lib/projects";

export default function HomePage() {
  const latestPosts = getLatestPosts(3);
  const featuredProjects = getFeaturedProjects();
  const featuredProject = featuredProjects[0];

  return (
    <Container>
      <Hero />

      {featuredProject && <FeaturedProject project={featuredProject} />}

      <LatestPosts posts={latestPosts} />
    </Container>
  );
}
