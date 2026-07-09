"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { HeroBanner } from "@/components/ui/hero-banner";
import { InteractiveRobotSpline } from "@/components/blocks/interactive-3d-robot";

const ROBOT_SCENE_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white/70">
        Loading…
      </main>
    );
  }

  return (
    <main>
      <HeroBanner
        onCtaClick={() => signIn("google")}
        onPrimaryClick={() => signIn("google")}
        background={<InteractiveRobotSpline scene={ROBOT_SCENE_URL} className="absolute inset-0" />}
      />
    </main>
  );
}
