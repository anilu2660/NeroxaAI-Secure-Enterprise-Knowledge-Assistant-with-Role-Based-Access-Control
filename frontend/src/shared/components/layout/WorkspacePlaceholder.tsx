export function WorkspacePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mt-2 rounded-2xl border border-hairline bg-card/60 px-6 py-10 backdrop-blur-xl">
      <h1 className="font-display text-[26px] font-medium tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 max-w-[60ch] text-[13.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      <p className="mt-4 text-[12px] text-muted-foreground/80">
        Route reserved — no backend integration yet.
      </p>
    </section>
  );
}
