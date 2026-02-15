import { Metadata } from "next";
import { Container } from "@/components/layout";
import { AgentForm } from "@/components/agent";

export const metadata: Metadata = {
  title: "Product Decision Agent",
  description:
    "An AI-powered research agent that investigates product questions and produces structured decision briefs with evidence, trade-offs, and recommendations.",
};

export default function AgentPage() {
  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Product Decision Agent
        </h1>
        <p className="mt-2 text-muted">
          Ask a product question and an AI agent will research it across the web,
          then produce a structured decision brief with evidence, trade-offs, and
          a recommendation.
        </p>
      </div>

      <AgentForm />
    </Container>
  );
}
