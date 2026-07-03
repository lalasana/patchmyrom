import { IconShieldCheck } from "@/components/ui/icons";

export default function PrivacyNote() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent-green/25 bg-accent-green/5 px-4 py-3 text-sm text-muted">
      <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-green/15 text-accent-green">
        <IconShieldCheck className="h-4 w-4" />
      </span>
      <p>
        <span className="font-medium text-foreground">Your files never leave your device.</span>{" "}
        ROM and patch files are processed locally in your browser. Nothing is uploaded to any
        server.
      </p>
    </div>
  );
}
