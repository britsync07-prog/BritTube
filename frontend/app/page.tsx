import { Hero } from "../components/sections/Hero";
import { Features } from "../components/sections/Features";
import { Showcase } from "../components/sections/Showcase";
import { VideoGenerator } from "../components/sections/VideoGenerator";
import { CTA } from "../components/sections/CTA";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <Showcase />
      <CTA />
    </main>
  );
}
