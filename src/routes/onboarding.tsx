import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  ImageIcon,
  Loader2,
  Mail,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/lib/app-context";
import {
  useUpdateCompany,
  useUpdateCompanyBranding,
  useUploadCompanyLogo,
  useInviteCompanyMember,
} from "@/lib/onboarding-api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "QuestLMS — Welcome" }] }),
  component: OnboardingPage,
});

type StepId = "welcome" | "organization" | "branding" | "invites" | "done";

const STEPS: { id: StepId; label: string }[] = [
  { id: "welcome",      label: "Welcome" },
  { id: "organization", label: "Organization" },
  { id: "branding",     label: "Branding" },
  { id: "invites",      label: "Invite team" },
  { id: "done",         label: "All set" },
];

const BRAND_COLORS = [
  { name: "Indigo",   value: "#6366f1" },
  { name: "Violet",   value: "#8b5cf6" },
  { name: "Emerald",  value: "#10b981" },
  { name: "Amber",    value: "#f59e0b" },
  { name: "Rose",     value: "#f43f5e" },
  { name: "Sky",      value: "#0ea5e9" },
  { name: "Slate",    value: "#475569" },
  { name: "Cyan",     value: "#06b6d4" },
];

interface Invite {
  id: string;
  name: string;
  email: string;
  role: "company_admin" | "instructor" | "assistant";
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { context } = useAppContext();
  const isBackend = context.mode === "backend";
  const companyId = typeof context.activeTenant.id === "number" ? context.activeTenant.id : Number(context.activeTenant.id);

  const [stepIndex, setStepIndex] = useState(0);
  const stepId = STEPS[stepIndex].id;
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [orgName, setOrgName]         = useState(context.activeTenant.name ?? "");
  const [subdomain, setSubdomain]     = useState(context.activeTenant.slug ?? "");
  const [orgSize, setOrgSize]         = useState<string>("");
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(context.activeTenant.logoUrl ?? null);
  const [brandColor, setBrandColor]   = useState<string>(context.activeTenant.brandColor ?? BRAND_COLORS[0].value);
  const [invites, setInvites]         = useState<Invite[]>([
    { id: crypto.randomUUID(), name: "", email: "", role: "company_admin" },
  ]);

  const updateCompany       = useUpdateCompany();
  const updateBranding      = useUpdateCompanyBranding();
  const uploadLogo          = useUploadCompanyLogo();
  const inviteMember        = useInviteCompanyMember();

  const canNext = useMemo(() => {
    if (stepId === "organization") return orgName.trim().length >= 2 && /^[a-z0-9-]{3,32}$/.test(subdomain);
    if (stepId === "branding")     return Boolean(brandColor);
    if (stepId === "invites") {
      return invites.every(
        (i) => (i.email === "" && i.name === "") || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.email) && i.name.trim().length >= 2),
      );
    }
    return true;
  }, [stepId, orgName, subdomain, brandColor, invites]);

  async function submitStep(): Promise<boolean> {
    if (!isBackend || !Number.isFinite(companyId) || companyId <= 0) return true;
    try {
      if (stepId === "organization") {
        await updateCompany.mutateAsync({ companyId, patch: { name: orgName, subdomain } });
      }
      if (stepId === "branding") {
        await updateBranding.mutateAsync({ companyId, patch: { primaryColor: brandColor, displayName: orgName } });
        if (logoFile) {
          await uploadLogo.mutateAsync({ companyId, file: logoFile });
        }
      }
      if (stepId === "invites") {
        const valid = invites.filter((i) => i.email.trim() && i.name.trim());
        await Promise.all(
          valid.map((i) =>
            inviteMember.mutateAsync({ companyId, email: i.email.trim(), fullName: i.name.trim(), role: i.role }),
          ),
        );
      }
      return true;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    }
  }

  async function next() {
    if (stepIndex >= STEPS.length - 1) return;
    setSubmitting(true);
    const ok = await submitStep();
    setSubmitting(false);
    if (ok) setStepIndex((i) => i + 1);
  }

  function back() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  function finish() {
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-9 bg-secondary text-secondary-foreground rounded-lg grid place-items-center font-black italic">Q</div>
            <span className="font-extrabold text-lg tracking-tighter uppercase">QuestLMS</span>
          </div>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip for now
          </Link>
        </div>
      </header>

      <Stepper current={stepIndex} />

      <main className="flex-1 w-full">
        <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
          {stepId === "welcome" && <WelcomeStep />}
          {stepId === "organization" && (
            <OrganizationStep
              orgName={orgName} setOrgName={setOrgName}
              subdomain={subdomain} setSubdomain={setSubdomain}
              orgSize={orgSize} setOrgSize={setOrgSize}
            />
          )}
          {stepId === "branding" && (
            <BrandingStep
              orgName={orgName || "Your Academy"}
              logoDataUrl={logoDataUrl}
              setLogoDataUrl={setLogoDataUrl}
              setLogoFile={setLogoFile}
              brandColor={brandColor}
              setBrandColor={setBrandColor}
            />
          )}
          {stepId === "invites" && <InvitesStep invites={invites} setInvites={setInvites} />}
          {stepId === "done" && (
            <DoneStep
              orgName={orgName || "Your Academy"}
              subdomain={subdomain || "your-school"}
              invites={invites.filter((i) => i.email.trim() !== "")}
            />
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={back} disabled={stepIndex === 0 || submitting}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          <span className="text-xs text-muted-foreground hidden sm:block">Step {stepIndex + 1} of {STEPS.length}</span>
          {stepId === "done" ? (
            <Button type="button" onClick={finish}>
              Go to dashboard <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={next} disabled={!canNext || submitting}>
              {submitting && <Loader2 className="size-4 animate-spin mr-1" />}
              {stepId === "invites" ? "Finish setup" : "Continue"}
              {!submitting && <ArrowRight className="size-4" />}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

/* ── Stepper ── */

function Stepper({ current }: { current: number }) {
  return (
    <div className="border-b border-border bg-card/40">
      <ol className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-2 sm:gap-3">
        {STEPS.map((step, idx) => {
          const state = idx < current ? "done" : idx === current ? "current" : "upcoming";
          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={
                "size-7 shrink-0 rounded-full grid place-items-center text-xs font-bold transition-colors " +
                (state === "done" ? "bg-primary text-primary-foreground" : state === "current" ? "bg-foreground text-background" : "bg-muted text-muted-foreground")
              } aria-current={state === "current" ? "step" : undefined}>
                {state === "done" ? <Check className="size-4" /> : idx + 1}
              </div>
              <span className={"text-xs sm:text-sm font-medium truncate " + (state === "upcoming" ? "text-muted-foreground" : "")}>
                {step.label}
              </span>
              {idx < STEPS.length - 1 && <div className="hidden sm:block flex-1 h-px bg-border" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Steps ── */

function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <Sparkles className="size-8" />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Welcome to QuestLMS</h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
          Let's set up your academy in a few quick steps — name it, brand it, and invite your team. You can change everything later.
        </p>
      </div>
      <ul className="grid sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto pt-4">
        {[
          { icon: GraduationCap, title: "Your academy",  body: "Name & subdomain" },
          { icon: ImageIcon,     title: "Branding",      body: "Logo & color" },
          { icon: Mail,          title: "Your team",     body: "Invite admins & instructors" },
        ].map((item, i) => (
          <li key={i} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
            <div className="size-9 rounded-lg bg-muted grid place-items-center">
              <item.icon className="size-4.5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrganizationStep({
  orgName, setOrgName, subdomain, setSubdomain, orgSize, setOrgSize,
}: {
  orgName: string; setOrgName: (v: string) => void;
  subdomain: string; setSubdomain: (v: string) => void;
  orgSize: string; setOrgSize: (v: string) => void;
}) {
  const subdomainOk = subdomain === "" || /^[a-z0-9-]{3,32}$/.test(subdomain);

  function suggest() {
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 32);
    if (slug.length >= 3) setSubdomain(slug);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Tell us about your academy</h2>
        <p className="text-muted-foreground mt-1">This is how your school appears to students and instructors.</p>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="org-name">Academy name</Label>
          <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value.slice(0, 80))}
            onBlur={() => { if (!subdomain) suggest(); }} placeholder="e.g. Aurora Learning" maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain</Label>
          <div className="flex items-stretch rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background overflow-hidden">
            <Input id="subdomain" value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32))}
              placeholder="your-school" className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none" maxLength={32} />
            <div className="px-3 grid place-items-center text-sm text-muted-foreground bg-muted/50 border-l border-border">.questlms.app</div>
          </div>
          <p className={"text-xs " + (subdomainOk ? "text-muted-foreground" : "text-destructive")}>
            {subdomainOk ? "Lowercase letters, numbers and dashes. 3–32 characters." : "Use 3–32 lowercase letters, numbers or dashes."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-size">Approximate size</Label>
          <Select value={orgSize} onValueChange={setOrgSize}>
            <SelectTrigger id="org-size"><SelectValue placeholder="Select size" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Just me</SelectItem>
              <SelectItem value="small">2–25 learners</SelectItem>
              <SelectItem value="mid">26–250 learners</SelectItem>
              <SelectItem value="large">250+ learners</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function BrandingStep({
  orgName, logoDataUrl, setLogoDataUrl, setLogoFile, brandColor, setBrandColor,
}: {
  orgName: string;
  logoDataUrl: string | null;
  setLogoDataUrl: (v: string | null) => void;
  setLogoFile: (f: File | null) => void;
  brandColor: string;
  setBrandColor: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Make it yours</h2>
        <p className="text-muted-foreground mt-1">Upload a logo and pick a brand color. Students will see this across your portal.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-5 space-y-4">
          <Label>Logo</Label>
          <div className="aspect-square w-full rounded-xl border border-dashed border-border bg-muted/30 grid place-items-center overflow-hidden">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Logo preview" className="size-full object-contain p-4" />
            ) : (
              <div className="text-center text-muted-foreground space-y-2 px-4">
                <ImageIcon className="size-8 mx-auto" />
                <p className="text-xs">PNG or SVG, square. Max 2MB.</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={onFile} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />{logoDataUrl ? "Replace" : "Upload"}
            </Button>
            {logoDataUrl && (
              <Button type="button" variant="ghost" onClick={() => { setLogoDataUrl(null); setLogoFile(null); }} aria-label="Remove logo">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <Label>Brand color</Label>
          <div className="grid grid-cols-4 gap-2">
            {BRAND_COLORS.map((c) => {
              const selected = c.value === brandColor;
              return (
                <button key={c.value} type="button" onClick={() => setBrandColor(c.value)} aria-label={c.name} aria-pressed={selected}
                  className={"aspect-square rounded-lg border-2 transition-all grid place-items-center " + (selected ? "border-foreground scale-105 shadow-sm" : "border-transparent hover:scale-105")}
                  style={{ backgroundColor: c.value }}>
                  {selected && <Check className="size-4 text-white" />}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-color" className="text-xs text-muted-foreground">Or pick a custom hex</Label>
            <div className="flex items-center gap-2">
              <input id="custom-color" type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                className="size-10 rounded-lg border border-border cursor-pointer bg-transparent" />
              <Input value={brandColor} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setBrandColor(e.target.value); }}
                maxLength={7} className="font-mono uppercase" />
            </div>
          </div>
        </Card>
      </div>

      {/* Preview */}
      <div>
        <p className="text-sm font-semibold mb-2">Preview</p>
        <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: `${brandColor}10` }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: brandColor }}>
            <div className="flex items-center gap-3">
              {logoDataUrl ? (
                <img src={logoDataUrl} alt="" className="size-9 rounded-lg bg-white/95 object-contain p-1" />
              ) : (
                <div className="size-9 rounded-lg bg-white/20 grid place-items-center text-white font-black italic">
                  {orgName.charAt(0).toUpperCase() || "Q"}
                </div>
              )}
              <span className="text-white font-extrabold tracking-tight">{orgName}</span>
            </div>
            <Badge className="bg-white/20 text-white border-0">Live</Badge>
          </div>
          <div className="p-5 grid grid-cols-3 gap-3">
            {["Courses", "Students", "Reports"].map((label) => (
              <div key={label} className="rounded-lg bg-card border border-border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-extrabold" style={{ color: brandColor }}>
                  {label === "Students" ? "248" : label === "Courses" ? "12" : "8"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvitesStep({ invites, setInvites }: { invites: Invite[]; setInvites: (v: Invite[]) => void }) {
  function update(id: string, patch: Partial<Invite>) {
    setInvites(invites.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function add() {
    setInvites([...invites, { id: crypto.randomUUID(), name: "", email: "", role: "instructor" }]);
  }
  function remove(id: string) {
    setInvites(invites.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Invite your team</h2>
        <p className="text-muted-foreground mt-1">Add admins, instructors, or assistants. They'll get an email to join. You can skip and invite later.</p>
      </div>

      <div className="space-y-3">
        {invites.map((inv, idx) => {
          const emailOk = inv.email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email);
          const nameOk  = inv.name === "" || inv.name.trim().length >= 2;
          return (
            <div key={inv.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:items-center">
              <Input value={inv.name} onChange={(e) => update(inv.id, { name: e.target.value.slice(0, 80) })}
                placeholder="Full name" maxLength={80} aria-invalid={!nameOk}
                className={!nameOk ? "border-destructive" : ""} />
              <Input value={inv.email} onChange={(e) => update(inv.id, { email: e.target.value.slice(0, 254) })}
                placeholder="email@school.com" type="email" maxLength={254} aria-invalid={!emailOk}
                className={!emailOk ? "border-destructive" : ""} />
              <Select value={inv.role} onValueChange={(v) => update(inv.id, { role: v as Invite["role"] })}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="assistant">Assistant</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(inv.id)}
                disabled={invites.length === 1 && idx === 0} aria-label="Remove">
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={add} className="w-full sm:w-auto">
        <Plus className="size-4" /> Add another
      </Button>
    </div>
  );
}

function DoneStep({ orgName, subdomain, invites }: { orgName: string; subdomain: string; invites: Invite[] }) {
  return (
    <div className="text-center space-y-6">
      <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <CheckCircle2 className="size-9" />
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight">You're all set, {orgName}!</h2>
        <p className="text-muted-foreground">
          Your academy is ready at <span className="font-mono text-foreground">{subdomain}.questlms.app</span>.
        </p>
      </div>
      <Card className="p-5 max-w-md mx-auto text-left space-y-3">
        <p className="text-sm font-semibold">What's next</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Check className="size-4 text-primary mt-0.5 shrink-0" />
            <span>Create your first course in the catalog.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="size-4 text-primary mt-0.5 shrink-0" />
            <span>{invites.length > 0 ? `${invites.length} invite${invites.length === 1 ? "" : "s"} will be sent.` : "Invite your team from the Staff page."}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="size-4 text-primary mt-0.5 shrink-0" />
            <span>Connect Zoom, Google Classroom and Stripe from Integrations.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
