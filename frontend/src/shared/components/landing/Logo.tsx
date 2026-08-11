export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.5 19.5C4.5 10.9 10.2 4.4 19.5 3.5c-1.1 9.1-7 15.1-15 16Z" fill="currentColor" />
      <path
        d="M8.5 15.5C10.8 11.3 14.3 8.4 19.5 3.5"
        stroke="var(--background)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
