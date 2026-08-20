import { NexoraLogo } from "@/shared/components/ui/NexoraLogo";

export function Logo({ className = "size-5" }: { className?: string }) {
  return (
    <div className={className}>
      <NexoraLogo className="size-full" animated={false} withGlow={false} variant="plain" />
    </div>
  );
}
