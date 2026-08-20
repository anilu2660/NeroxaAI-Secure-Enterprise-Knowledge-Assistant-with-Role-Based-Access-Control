import { useRef, useState } from "react";
import {
  Building2,
  Camera,
  Check,
  Copy,
  IdCard,
  Info,
  KeyRound,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import type { UserProfile } from "@/api/types";
import type { Permission } from "@/auth/types";
import { statusLabel } from "@/users/components/UserBadges";
import { cn } from "@/shared/utils/utils";
import { updateUserAvatar } from "@/api/workspace-service";
import { ImageCropModal } from "./ImageCropModal";
import { useAuth } from "@/auth/auth-context";

export function AccountProfile({ profile }: { profile: UserProfile }) {
  const { can } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image file size must be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedImageSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveCroppedAvatar = async (croppedDataUrl: string) => {
    setIsUploading(true);
    await updateUserAvatar(profile.id, profile.email, croppedDataUrl);
    setIsUploading(false);
    setSelectedImageSrc(null);
  };

  const handleRemoveAvatar = async () => {
    await updateUserAvatar(profile.id, profile.email, null);
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const identityFields = [
    { icon: IdCard, label: "Full Name", value: profile.name },
    { icon: Mail, label: "Email Address", value: profile.email },
    { icon: Building2, label: "Organization", value: profile.organization },
    { icon: Users, label: "Department", value: profile.department || "Not assigned" },
    { icon: ShieldCheck, label: "Assigned Role", value: profile.role },
    { icon: Check, label: "Account Status", value: statusLabel[profile.status] },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {/* User Identity Hero Card with Glowing Mesh */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/90 via-card/50 to-primary/[0.08] p-5 sm:p-6 shadow-xl backdrop-blur-2xl transition-all duration-300">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 left-1/4 size-56 rounded-full bg-purple-500/10 blur-3xl"
          />

          <div className="relative flex flex-wrap items-center gap-5">
            {/* Interactive Avatar Container */}
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="size-20 rounded-full object-cover border-2 border-primary/60 shadow-xl ring-4 ring-primary/25 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 via-secondary to-primary/15 font-display text-2xl font-bold text-foreground border border-primary/30 shadow-xl ring-4 ring-primary/20 transition-transform duration-300 group-hover:scale-105">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 grid place-items-center rounded-full bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Camera className="size-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                  {profile.name}
                </h2>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-0.5 text-[11px] font-semibold tracking-wide uppercase shadow-xs",
                    profile.role === "ADMIN"
                      ? "border-primary/50 bg-primary/20 text-primary"
                      : "border-hairline bg-secondary/50 text-foreground/80",
                  )}
                >
                  {profile.role}
                </span>
              </div>
              <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground">
                {profile.roleLabel}
              </p>

              {/* Upload & Remove Picture Actions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-secondary/60 px-3 py-1.5 text-[12px] font-medium text-foreground transition-all hover:bg-accent/80 hover:border-primary/40 shadow-xs"
                >
                  <Camera className="size-3.5 text-primary" />
                  {isUploading ? "Uploading..." : profile.avatarUrl ? "Change Photo" : "Upload Picture"}
                </button>
                {profile.avatarUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-[12px] font-medium text-destructive transition-all hover:bg-destructive/20"
                  >
                    <Trash2 className="size-3.5" /> Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Identity Fields Cards Grid */}
          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {identityFields.map((field) => (
              <div
                key={field.label}
                className="group/item min-w-0 rounded-2xl border border-hairline bg-secondary/25 p-3 transition-all duration-200 hover:bg-secondary/45 hover:border-primary/30 shadow-xs"
              >
                <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                  <field.icon className="size-3.5 text-primary/80" />
                  {field.label}
                </dt>
                <dd className="mt-1 truncate font-display text-[13px] font-semibold text-foreground">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Live Permissions Matrix Card */}
        <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
          <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
                <KeyRound className="size-4.5" />
              </span>
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">
                  {profile.role === "ADMIN" ? "Administrative permissions" : "Your permissions"}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Active capabilities assigned to your account in PostgreSQL
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              Synced with PostgreSQL DB · Live Enforced
            </span>
          </header>

          <ul className="mt-4 space-y-2">
            {[
              { key: "workspace:access", label: "User Workspace" },
              { key: "assistant:query", label: "AI Assistant" },
              { key: "documents:read", label: "Browse & Open Documents" },
              { key: "documents:upload", label: "Upload Documents" },
              { key: "documents:manage", label: "Document Management" },
              { key: "users:manage", label: "User Management" },
              { key: "audit:read", label: "Audit Logs" },
              { key: "access:manage", label: "Access Control Matrix" },
            ].map((item) => {
              const isAllowed = can(item.key as Permission);
              return (
                <li
                  key={item.key}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-secondary/25 p-3 transition-all duration-200 hover:bg-secondary/45 hover:border-primary/30 shadow-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="block truncate text-[10.5px] font-mono text-muted-foreground">
                      {item.key}
                    </span>
                  </span>
                  {isAllowed ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-400 shadow-xs">
                      <Check className="size-3.5" />
                      Allowed
                    </span>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 rounded-xl border border-hairline bg-muted/30 px-3 py-1 text-[11px] font-normal text-muted-foreground/80">
                      Not allowed
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="space-y-5">
        {/* Knowledge Access Scope Panel */}
        <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
          <div className="flex items-center gap-2.5 pb-3 border-b border-hairline">
            <span className="grid size-9 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary shadow-xs">
              <Layers className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-sm font-semibold text-foreground">
                Knowledge access scope
              </h2>
              <p className="text-[11px] text-muted-foreground">Assigned scope filters for vector retrieval</p>
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            Determines which document collections can be retrieved for your account during AI Assistant queries.
          </p>

          {profile.accessScope.length > 0 ? (
            <ul className="mt-3.5 space-y-2">
              {profile.accessScope.map((scope) => (
                <li
                  key={scope}
                  className="flex items-center gap-2.5 rounded-2xl border border-primary/25 bg-primary/[0.08] px-3.5 py-2.5 text-[12.5px] font-medium text-foreground shadow-xs transition-all hover:border-primary/40"
                >
                  <Zap className="size-3.5 shrink-0 text-primary" />
                  <span>{scope}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 rounded-2xl border border-hairline bg-secondary/25 p-3 text-[12px] text-muted-foreground">
              <Lock className="size-4 shrink-0 text-amber-400" />
              No access scope assigned yet
            </p>
          )}
        </section>

        {/* Session & Account Source Panel */}
        <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-primary/30">
          <h2 className="font-display text-sm font-semibold text-foreground pb-3 border-b border-hairline">
            Session &amp; account source
          </h2>

          {(() => {
            const token = typeof window !== "undefined" ? sessionStorage.getItem("neroxa.token") : null;
            const maskedToken =
              token && token.length > 14
                ? `${token.slice(0, 8)}...${token.slice(-6)}`
                : token
                  ? token
                  : `jwt_sess_${profile.id.slice(0, 8)}`;
            const lastSignInDisplay = profile.lastSignInLabel ?? "Just now (Active Session)";

            return (
              <>
                <dl className="mt-4 space-y-3 text-[12px]">
                  <Row label="Profile source">
                    <span className="font-medium text-foreground">
                      {profile.managedInDirectory ? "Administered user record" : "PostgreSQL Database Account"}
                    </span>
                  </Row>

                  <Row label="Account ID">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-foreground/80 bg-secondary/40 px-2 py-0.5 rounded-md border border-hairline truncate max-w-[140px]">
                        {profile.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.id, "account_id")}
                        title="Copy Account ID"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        {copiedField === "account_id" ? (
                          <Check className="size-3 text-emerald-400" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </Row>

                  <Row label="Last sign-in">
                    <span className="flex items-center justify-end gap-1.5 text-emerald-400 font-medium">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      {lastSignInDisplay}
                    </span>
                  </Row>

                  <Row label="Access token">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 truncate max-w-[140px]">
                        {maskedToken}
                      </span>
                      {token ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(token, "token")}
                          title="Copy Access Token"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          {copiedField === "token" ? (
                            <Check className="size-3 text-emerald-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  </Row>
                </dl>

                <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-[11.5px] leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                  Your account is authenticated via JWT with role-based access control and live PostgreSQL permission synchronization.
                </p>
              </>
            );
          })()}
        </section>
      </div>

      {selectedImageSrc ? (
        <ImageCropModal
          imageSrc={selectedImageSrc}
          onClose={() => setSelectedImageSrc(null)}
          onSave={handleSaveCroppedAvatar}
        />
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-foreground/90">{children}</dd>
    </div>
  );
}
