export default function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[780px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
      <div className="absolute left-1/2 top-[-90px] h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-accent-green/12 blur-[120px]" />
      <div className="absolute right-[-120px] top-[190px] h-[380px] w-[380px] rounded-full bg-accent-blue/15 blur-[110px]" />
      <div className="absolute left-[-100px] top-[310px] h-[300px] w-[300px] rounded-full bg-purple-500/12 blur-[110px]" />
    </div>
  );
}
