import Image from "next/image";

const PROJECTS = [
  {
    id: "01",
    title: "identidade em órbita",
    tag: "branding",
    color: "bg-frufru-pink",
    copy: "Sistemas visuais com borda dura, paleta pastel e um mascote que não pede desculpa.",
  },
  {
    id: "02",
    title: "interfaces com personalidade",
    tag: "ui/ux",
    color: "bg-frufru-blue",
    copy: "Produtos digitais que parecem um sticker pack — e ainda convertem.",
  },
  {
    id: "03",
    title: "sites que gritam (fofo)",
    tag: "web",
    color: "bg-frufru-pistachio",
    copy: "LPs, portfólios e vitrines com motion, 3D leve e texto que não dorme.",
  },
];

const POSTS = [
  {
    id: "01",
    title: "por que o Windows XP ainda ensina hierarquia",
    note: "ensaio visual",
  },
  {
    id: "02",
    title: "pastel não é fofo demais — é estratégico",
    note: "método",
  },
];

export function ProjectsSection() {
  return (
    <section id="projetos" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-bricolage text-sm font-bold uppercase tracking-[0.2em] text-frufru-ganache/70 dark:text-frufru-cream/70">
          01/ selecionados
        </p>
        <h2 className="font-caprasimo mt-2 text-4xl text-frufru-ganache dark:text-frufru-cream sm:text-5xl">
          projetos que não pedem licença
        </h2>
        <p className="font-instrument mt-3 max-w-2xl text-lg italic text-frufru-ganache/75 dark:text-frufru-cream/75">
          um recorte do que o estúdio anda fabricando entre café, pixel e
          glitter.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PROJECTS.map((project) => (
            <article
              key={project.id}
              className={`${project.color} neo-press p-5 text-frufru-ganache`}
            >
              <p className="font-bricolage text-3xl font-black">{project.id}/</p>
              <p className="mt-4 inline-block border-2 border-frufru-ganache bg-frufru-cream px-2 py-0.5 font-bricolage text-xs font-semibold uppercase">
                {project.tag}
              </p>
              <h3 className="font-bricolage mt-3 text-2xl font-extrabold leading-tight">
                {project.title}
              </h3>
              <p className="font-bricolage mt-3 text-sm font-normal leading-relaxed">
                {project.copy}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="sobre" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="border-[3px] border-frufru-ganache bg-frufru-cream p-2 neo-shadow dark:border-frufru-cream dark:bg-frufru-ganache-deep">
          <div className="border-[3px] border-frufru-ganache bg-frufru-blue p-6 dark:border-frufru-cream">
            <Image
              src="/brand/wordmark.png"
              alt="Frufru Digital"
              width={720}
              height={180}
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
        <div>
          <p className="font-bricolage text-sm font-bold uppercase tracking-[0.2em] text-frufru-ganache/70 dark:text-frufru-cream/70">
            02/ o estúdio
          </p>
          <h2 className="font-caprasimo mt-2 text-4xl text-frufru-ganache dark:text-frufru-cream sm:text-5xl">
            frufru, mas com briefing
          </h2>
          <p className="font-bricolage mt-5 text-base font-normal leading-7 text-frufru-ganache dark:text-frufru-cream">
            Somos um estúdio de design, UI/UX e branding que mistura estética
            irreverente com método. O tom é doce. A entrega é nítida. Nada de
            template cinza fingindo que é “clean”.
          </p>
          <p className="font-instrument mt-4 text-lg italic text-frufru-ganache/80 dark:text-frufru-cream/80">
            se a marca não tem gosto, a gente coloca açúcar — e estrutura.
          </p>
        </div>
      </div>
    </section>
  );
}

export function BlogSection() {
  return (
    <section id="blog" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-bricolage text-sm font-bold uppercase tracking-[0.2em] text-frufru-ganache/70 dark:text-frufru-cream/70">
          03/ caderno
        </p>
        <h2 className="font-caprasimo mt-2 text-4xl text-frufru-ganache dark:text-frufru-cream sm:text-5xl">
          notas do estúdio
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {POSTS.map((post) => (
            <article
              key={post.id}
              className="border-[3px] border-frufru-ganache bg-frufru-cream p-6 neo-shadow dark:border-frufru-cream dark:bg-frufru-ganache-deep"
            >
              <p className="font-bricolage text-xs font-semibold uppercase tracking-widest text-frufru-ganache/70 dark:text-frufru-cream/70">
                {post.note}
              </p>
              <h3 className="font-bricolage mt-3 text-2xl font-bold text-frufru-ganache dark:text-frufru-cream">
                {post.title}
              </h3>
              <p className="font-bricolage mt-4 text-sm font-light text-frufru-ganache/70 dark:text-frufru-cream/70">
                em breve no cms · sanity já está no kit
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contato" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl border-[3px] border-frufru-ganache bg-frufru-pink p-8 neo-shadow dark:border-frufru-cream sm:p-12">
        <p className="font-bricolage text-sm font-bold uppercase tracking-[0.2em] text-frufru-ganache">
          04/ porta aberta
        </p>
        <h2 className="font-caprasimo mt-2 max-w-xl text-4xl text-frufru-ganache sm:text-5xl">
          bora fazer um bagulho bonito?
        </h2>
        <p className="font-instrument mt-4 max-w-xl text-xl italic text-frufru-ganache/80">
          briefing bagunçado? melhor ainda. a gente organiza com glitter.
        </p>
        <a
          href="mailto:oi@frufrudigital.com"
          className="neo-press mt-8 inline-flex bg-frufru-cream px-6 py-3 font-bricolage text-base font-extrabold text-frufru-ganache"
        >
          oi@frufrudigital.com
        </a>
      </div>
      <footer className="mx-auto mt-16 max-w-6xl border-t-[3px] border-frufru-ganache pt-6 dark:border-frufru-cream">
        <p className="font-bricolage text-xs font-extralight text-frufru-ganache/70 dark:text-frufru-cream/70">
          Frufru Digital Studio™ · @frufrudigital · feito com borda de 3px e
          zero vergonha
        </p>
      </footer>
    </section>
  );
}
