import { Hero } from "../components/sections/Hero";
import { Features } from "../components/sections/Features";
import { Showcase } from "../components/sections/Showcase";
import { VideoGenerator } from "../components/sections/VideoGenerator";
import { FAQ } from "../components/sections/FAQ";
import { CTA } from "../components/sections/CTA";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <Showcase />
      <VideoGenerator />
      <FAQ />
      <CTA />
    </main>
  );
}
