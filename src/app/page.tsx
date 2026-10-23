import { HeroSection } from "@/components/HeroSection";
import {
  AboutSection,
  BlogSection,
  ContactSection,
  ProjectsSection,
} from "@/components/StudioSections";

export default function Home() {
  return (
    <main className="min-h-full">
      <HeroSection />
      <ProjectsSection />
      <AboutSection />
      <BlogSection />
      <ContactSection />
    </main>
  );
}
