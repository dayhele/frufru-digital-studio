"use client";

import { Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const TABS = [
  { id: "inicio", label: "início", color: "bg-frufru-pink" },
  { id: "projetos", label: "projetos", color: "bg-frufru-blue" },
  { id: "sobre", label: "sobre", color: "bg-frufru-pistachio" },
  { id: "blog", label: "blog", color: "bg-frufru-pink" },
  { id: "contato", label: "contato", color: "bg-frufru-blue" },
] as const;

export function HeaderTabs() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("inicio");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const offset = 140;
      let current: (typeof TABS)[number]["id"] = "inicio";

      for (const tab of TABS) {
        const section = document.getElementById(tab.id);
        if (section && section.getBoundingClientRect().top - offset <= 0) {
          current = tab.id;
        }
      }

      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[80] isolate px-3 pt-3 sm:px-5">
      <div className="pointer-events-auto mx-auto max-w-6xl">
        <div className="flex items-end gap-2 overflow-x-auto pb-0">
          <a
            href="#inicio"
            className="mb-[-3px] hidden shrink-0 items-center gap-2 border-[3px] border-frufru-ganache bg-frufru-cream px-3 py-2 dark:border-frufru-cream dark:bg-frufru-ganache-deep sm:flex"
          >
            <Image
              src="/brand/mascot.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
            />
            <span className="font-bricolage text-sm font-extrabold tracking-tight text-frufru-ganache dark:text-frufru-cream">
              frufru™
            </span>
          </a>

          <nav
            aria-label="Seções da landing"
            className="flex min-w-0 flex-1 items-end"
          >
            {TABS.map((tab, index) => {
              const isActive = active === tab.id;
              return (
                <a
                  key={tab.id}
                  href={`#${tab.id}`}
                  onClick={() => setActive(tab.id)}
                  className={[
                    "relative -ml-[3px] min-w-[5.5rem] shrink-0 border-[3px] border-b-0 border-frufru-ganache px-4 py-2 text-center font-bricolage text-sm font-semibold capitalize first:ml-0 dark:border-frufru-cream sm:min-w-[6.5rem]",
                    isActive
                      ? "z-20 mb-[-3px] bg-frufru-cream text-frufru-ganache dark:bg-frufru-ganache-deep dark:text-frufru-cream"
                      : `z-10 ${tab.color} text-frufru-ganache hover:translate-y-[-2px]`,
                  ].join(" ")}
                  style={{ zIndex: isActive ? 20 : 10 - index }}
                  aria-current={isActive ? "true" : undefined}
                >
                  {tab.label}
                </a>
              );
            })}
          </nav>

          <div className="mb-[-3px] flex shrink-0 items-center gap-1 border-[3px] border-frufru-ganache bg-frufru-cream p-1 dark:border-frufru-cream dark:bg-frufru-ganache-deep">
            <button
              type="button"
              aria-label="Ativar modo claro"
              onClick={() => setTheme("light")}
              className={[
                "grid size-7 place-items-center border-2 border-frufru-ganache dark:border-frufru-cream",
                mounted && !isDark
                  ? "bg-frufru-pistachio"
                  : "bg-frufru-blue hover:translate-x-px hover:translate-y-px",
              ].join(" ")}
            >
              <Sun className="size-3.5 text-frufru-ganache" strokeWidth={2.6} />
            </button>
            <button
              type="button"
              aria-label="Ativar modo escuro"
              onClick={() => setTheme("dark")}
              className={[
                "grid size-7 place-items-center border-2 border-frufru-ganache dark:border-frufru-cream",
                isDark
                  ? "bg-frufru-pink"
                  : "bg-frufru-blue hover:translate-x-px hover:translate-y-px",
              ].join(" ")}
            >
              <Moon className="size-3.5 text-frufru-ganache" strokeWidth={2.6} />
            </button>
          </div>
        </div>

        <div className="h-[3px] bg-frufru-ganache dark:bg-frufru-cream" />
      </div>
    </header>
  );
}
