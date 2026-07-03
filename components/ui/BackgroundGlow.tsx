export default function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden">
      <div className="absolute left-1/2 top-[-220px] h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-accent-green/15 blur-[110px]" />
      <div className="absolute right-[-120px] top-[60px] h-[380px] w-[380px] rounded-full bg-accent-blue/15 blur-[110px]" />
      <div className="absolute left-[-100px] top-[180px] h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[110px]" />
    </div>
  );
}
