import { Divider } from "@/components/Divider";
import CTA from "@/components/views/landing/CTA";
import CodeExamples from "@/components/views/landing/Code";
import Hero from "@/components/views/landing/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-landing w-full mx-auto scroll-smooth max-w-screen-lg">
      <Hero />
      <Divider />
      <CodeExamples />
      <CTA />
    </main>
  );
}
