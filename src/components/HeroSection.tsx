"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

const Cursor3D = dynamic(
  () => import("@/components/Cursor3D").then((mod) => mod.Cursor3D),
  { ssr: false },
);

export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative isolate scroll-mt-24 overflow-hidden px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pt-32"
    >
      <Cursor3D />
      <div className="xp-dots pointer-events-none absolute inset-0 opacity-20 dark:opacity-10" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-2 border-[3px] border-frufru-ganache bg-frufru-pistachio px-3 py-1 font-bricolage text-xs font-bold uppercase tracking-[0.18em] text-frufru-ganache neo-shadow dark:border-frufru-cream"
          >
            <Sparkles className="size-3.5" />
            estúdio criativo · @frufrudigital
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-caprasimo max-w-[14ch] text-5xl leading-[0.95] text-frufru-ganache dark:text-frufru-cream sm:text-6xl lg:text-7xl"
          >
            design que é fofo, mas{" "}
            <span className="relative inline-block">
              entrega.
              <span className="absolute inset-x-0 -bottom-1 h-3 bg-frufru-pink/80 dark:bg-frufru-pink/40" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="font-instrument mt-6 max-w-xl text-xl italic text-frufru-ganache/80 dark:text-frufru-cream/80 sm:text-2xl"
          >
            UI/UX, branding e um pouco de caos doce — neobrutalismo pastel
            com nostalgia de pasta do Windows XP.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#projetos"
              className="neo-press inline-flex items-center gap-2 bg-frufru-pink px-6 py-3 font-bricolage text-base font-extrabold text-frufru-ganache"
            >
              ver os cases
              <ArrowDownRight className="size-4" />
            </a>
            <a
              href="#contato"
              className="neo-press inline-flex items-center bg-frufru-blue px-6 py-3 font-bricolage text-base font-extrabold text-frufru-ganache"
            >
              manda um oi
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, rotate: -3, y: 18 }}
          animate={{ opacity: 1, rotate: -2, y: 0 }}
          transition={{ delay: 0.16 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="border-[3px] border-frufru-ganache bg-frufru-blue neo-shadow dark:border-frufru-cream">
            <div className="flex items-center justify-between border-b-[3px] border-frufru-ganache bg-frufru-pink px-3 py-2 dark:border-frufru-cream">
              <p className="font-bricolage text-xs font-semibold text-frufru-ganache">
                gato_espacial.exe
              </p>
              <div className="flex gap-1">
                <span className="size-3 border-2 border-frufru-ganache bg-frufru-cream" />
                <span className="size-3 border-2 border-frufru-ganache bg-frufru-pistachio" />
                <span className="size-3 border-2 border-frufru-ganache bg-frufru-pink" />
              </div>
            </div>
            <div className="relative aspect-[6/5] overflow-hidden bg-[#7aa7c4]">
              <Image
                src="/brand/mascot-alt.png"
                alt="Mascote espacial do Frufru Digital Studio"
                fill
                sizes="(max-width: 768px) 80vw, 400px"
                priority
                className="object-cover"
              />
            </div>
            <div className="border-t-[3px] border-frufru-ganache bg-frufru-cream px-4 py-3 dark:border-frufru-cream dark:bg-frufru-ganache-deep">
              <p className="font-bricolage text-sm font-medium text-frufru-ganache dark:text-frufru-cream">
                status:{" "}
                <span className="font-extrabold">orbitando ideias</span>
              </p>
              <p className="font-bricolage mt-1 text-xs font-light text-frufru-ganache/70 dark:text-frufru-cream/70">
                arraste o cursor — a estrela 3D te segue (desktop)
              </p>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-4 hidden rotate-[-8deg] border-[3px] border-frufru-ganache bg-frufru-pistachio px-3 py-2 font-bricolage text-xs font-bold text-frufru-ganache neo-shadow dark:border-frufru-cream sm:block">
            Y2K.exe carregado
          </div>
        </motion.div>
      </div>
    </section>
  );
}
