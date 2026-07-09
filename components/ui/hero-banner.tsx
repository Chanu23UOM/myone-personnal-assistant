"use client";

import React, { useState } from "react";
import { Calendar, FileText, Sparkles, Newspaper, ArrowRight, ArrowUpRight, Menu } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

interface Feature {
  icon: React.ReactNode;
  label: string;
}

interface HeroBannerProps {
  brand?: string;
  navLinks?: NavLink[];
  ctaButtonText?: string;
  onCtaClick?: () => void;
  badgeLabel?: string;
  badgeText?: string;
  title?: string;
  titleLine2?: string;
  description?: string;
  primaryButtonText?: string;
  onPrimaryClick?: () => void;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  featuresTitle?: string;
  features?: Feature[];
  /** Rendered as the full-bleed background layer (e.g. the 3D robot scene). */
  background?: React.ReactNode;
}

const defaultFeatures: Feature[] = [
  { icon: <Calendar className="h-4 w-4" />, label: "Calendar synced" },
  { icon: <FileText className="h-4 w-4" />, label: "Drive notes" },
  { icon: <Sparkles className="h-4 w-4" />, label: "AI workflows" },
  { icon: <Newspaper className="h-4 w-4" />, label: "Daily briefing" },
];

export function HeroBanner({
  brand = "Assistant",
  navLinks = [
    { label: "Calendar", href: "#features" },
    { label: "Notes", href: "#features" },
    { label: "Tasks", href: "#features" },
    { label: "AI Briefing", href: "#features" },
  ],
  ctaButtonText = "Sign in with Google",
  onCtaClick,
  badgeLabel = "Personal",
  badgeText = "One assistant for your whole day",
  title = "Your day,",
  titleLine2 = "organized by AI",
  description = "Calendar, Drive notes, tasks and deadlines in one place — with an AI layer that turns notes into workflows, tracks your progress, and briefs you every morning.",
  primaryButtonText = "Sign in with Google",
  onPrimaryClick,
  secondaryButtonText = "See what it does",
  secondaryButtonHref = "#features",
  featuresTitle = "Everything your day needs, in one dashboard",
  features = defaultFeatures,
  background,
}: HeroBannerProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <section className="w-full isolate min-h-screen overflow-hidden relative bg-neutral-950">
      {background ? (
        <div className="absolute inset-0 z-0">{background}</div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/10 via-black/40 to-black/80" />
      <div className="pointer-events-none absolute inset-0 z-[1] ring-1 ring-black/30" />

      <header className="z-10 xl:top-4 relative">
        <div className="mx-6">
          <div className="flex items-center justify-between pt-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-white font-sans">
              <Sparkles className="h-4 w-4" />
              {brand}
            </span>

            <nav className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur">
                {navLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white font-sans transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <button
                  onClick={onCtaClick}
                  className="ml-1 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-white/90 font-sans transition-colors"
                >
                  {ctaButtonText}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5 text-white/90" />
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="md:hidden mt-3 flex flex-col gap-1 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white font-sans"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={onCtaClick}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 font-sans"
              >
                {ctaButtonText}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="z-10 relative">
        <div className="sm:pt-28 md:pt-32 lg:pt-40 max-w-7xl mx-auto pt-28 px-6 pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-2.5 py-2 ring-1 ring-white/15 backdrop-blur animate-fade-slide-in-1">
              <span className="inline-flex items-center text-xs font-medium text-neutral-900 bg-white/90 rounded-full py-0.5 px-2 font-sans">
                {badgeLabel}
              </span>
              <span className="text-sm font-medium text-white/90 font-sans">{badgeText}</span>
            </div>

            <h1 className="sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-4xl text-white tracking-tight font-serif font-normal animate-fade-slide-in-2">
              {title}
              <br className="hidden sm:block" />
              {titleLine2}
            </h1>

            <p className="sm:text-lg animate-fade-slide-in-3 text-base text-white/80 max-w-2xl mt-6 mx-auto">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
              <button
                onClick={onPrimaryClick}
                className="inline-flex items-center gap-2 hover:bg-white/15 text-sm font-medium text-white bg-white/10 ring-white/15 ring-1 rounded-full py-3 px-5 font-sans transition-colors"
              >
                {primaryButtonText}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={secondaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full bg-transparent px-5 py-3 text-sm font-medium text-white/90 hover:text-white font-sans transition-colors"
              >
                {secondaryButtonText}
              </a>
            </div>
          </div>

          <div id="features" className="mx-auto mt-20 max-w-5xl scroll-mt-24">
            <p className="animate-fade-slide-in-1 text-sm text-white/70 text-center">{featuresTitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 animate-fade-slide-in-2 text-white/80 mt-6 items-center justify-items-center gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 ring-1 ring-white/10 text-sm font-medium"
                >
                  {feature.icon}
                  {feature.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
