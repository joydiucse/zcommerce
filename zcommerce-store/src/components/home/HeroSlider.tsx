"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay } from "react-icons/fi";
import { SmartLink } from "@/components/ui/SmartLink";
import { imageProps } from "@/lib/images";
import type { HeroSlide } from "@/lib/types";

const INTERVAL = 6000;

export function HeroSlider({ slides, storeName }: { slides: HeroSlide[]; storeName: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || hover) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(t);
  }, [count, paused, hover]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={`${storeName} highlights`}
      className="relative overflow-hidden bg-secondary"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="relative h-[26rem] sm:h-[30rem] lg:h-[34rem]">
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={`${s.image_url}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "opacity-0"}`}
            >
              {s.image_url && (
                <Image
                  {...imageProps(s.image_url)}
                  alt={s.title || storeName}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={`object-cover transition-transform duration-[7000ms] ${active ? "scale-105" : "scale-100"}`}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
              <div className="container-store relative flex h-full items-center">
                <div className="max-w-xl text-white">
                  {s.title && (
                    <p className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{s.title}</p>
                  )}
                  {s.subtitle && <p className="mt-4 text-lg text-white/85 sm:text-xl">{s.subtitle}</p>}
                  {s.cta_text && s.cta_link && (
                    <SmartLink href={s.cta_link} className="btn btn-primary btn-lg mt-8 shadow-lg">
                      {s.cta_text}
                    </SmartLink>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 sm:grid"
            aria-label="Previous slide"
          >
            <FiChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/30 sm:grid"
            aria-label="Next slide"
          >
            <FiChevronRight className="size-6" />
          </button>
          <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="ml-2 grid size-7 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"
              aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            >
              {paused ? <FiPlay className="size-3.5" /> : <FiPause className="size-3.5" />}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
