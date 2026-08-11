import {
  Building2,
  Check,
  IdCard,
  Info,
  KeyRound,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { UserProfile } from "@/api/types";
import { PERMISSION_LABELS } from "@/roles/permissions";
import { statusLabel } from "@/users/components/UserBadges";
import { cn } from "@/shared/utils/utils";

/**
 * Reusable Account structure for BOTH roles. Everything rendered here comes
 * from the single administered user record resolved by `getUserProfile()` —
 * no field is hardcoded per role or duplicated from another surface.
 */
import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { updateUserAvatar } from "@/api/workspace-service";
import { ImageCropModal } from "./ImageCropModal";

export function AccountProfile({ profile }: { profile: UserProfile }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    // Reset file input value so same file can be selected again
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

  const identityFields = [
    { icon: IdCard, label: "Full name", value: profile.name },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Building2, label: "Organization", value: profile.organization },
    { icon: Users, label: "Department", value: profile.department || "Not assigned" },
    { icon: ShieldCheck, label: "Role", value: profile.role },
    { icon: Check, label: "Status", value: statusLabel[profile.status] },
  ];

  return (
    <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_318px]">
      <div className="space-y-3.5">
        <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-4">
            {/* Interactive Avatar Container with Camera Overlay */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="size-16 rounded-full object-cover border-2 border-primary/50 shadow-md ring-2 ring-primary/20 transition-transform group-hover:scale-105"
                />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 via-secondary to-primary/10 font-display text-[22px] font-semibold text-foreground border border-hairline shadow-md transition-transform group-hover:scale-105">
                  {profile.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-5 text-white" />
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
              <div className="flex items-center gap-2">
                <p className="truncate font-display text-[19px] font-medium text-foreground">
                  {profile.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-medium",
                    profile.role === "ADMIN"
                      ? "border-primary/45 bg-primary/12 text-primary"
                      : "border-hairline bg-secondary/40 text-foreground/80",
                  )}
                >
                  {profile.role}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                {profile.roleLabel}
              </p>

              {/* Upload & Remove Picture Buttons */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-secondary/50 px-2.5 py-1 text-[11.5px] text-foreground/90 transition-colors hover:bg-accent/70 hover:text-foreground"
                >
                  <Camera className="size-3.5 text-primary" />
                  {isUploading ? "Uploading..." : profile.avatarUrl ? "Change Photo" : "Upload Picture"}
                </button>
                {profile.avatarUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-2 py-1 text-[11px] text-destructive transition-colors hover:bg-destructive/20"
                  >
                    <Trash2 className="size-3" /> Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
            {identityFields.map((field) => (
              <div key={field.label} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <field.icon className="size-3.5" />
                  {field.label}
                </dt>
                <dd className="mt-1 truncate text-[13px] text-foreground">{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
          <header className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-[13.5px] font-medium text-foreground">
              <KeyRound className="size-4 text-primary" />
              {profile.role === "ADMIN" ? "Administrative permissions" : "Your permissions"}
            </h2>
            <span className="text-[10.5px] text-muted-foreground">
              Granted by role · not enforced yet
            </span>
          </header>
          <ul className="mt-3 space-y-1.5">
            {profile.permissions.map((permission) => (
              <li
                key={permission}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-secondary/25 px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] text-foreground">
                    {PERMISSION_LABELS[permission]}
                  </span>
                  <span className="block truncate text-[10.5px] text-muted-foreground">
                    {permission}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-allowed/35 bg-allowed/10 px-2 py-0.5 text-[10.5px] text-allowed">
                  <Check className="size-3" />
                  Allowed
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-3.5">
        <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
          <h2 className="flex items-center gap-2 font-display text-[13.5px] font-medium text-foreground">
            <Layers className="size-4 text-primary" />
            Knowledge access scope
          </h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
            Assigned in User Management. It will decide which documents can be retrieved for you
            once the retrieval service is connected.
          </p>
          {profile.accessScope.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {profile.accessScope.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-[12.5px] text-foreground">
                  <Check className="size-3.5 shrink-0 text-allowed" />
                  {scope}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              No access scope assigned yet
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
          <h2 className="font-display text-[13.5px] font-medium text-foreground">
            Session &amp; account source
          </h2>
          <dl className="mt-2.5 space-y-2 text-[12px]">
            <Row label="Profile source">
              {profile.managedInDirectory
                ? "Administered user record"
                : "Sign-in details (no admin record yet)"}
            </Row>
            <Row label="Account ID">{profile.id}</Row>
            <Row label="Last sign-in">{profile.lastSignInLabel ?? "Not recorded"}</Row>
            <Row label="Access token">Not issued — no auth backend</Row>
          </dl>
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {profile.managedInDirectory
              ? "These details come from the record an administrator manages in User Management. No identity backend or JWT is connected, so nothing here is server-verified and no permission is enforced."
              : "This account has no administered record yet, so department and access scope are unassigned. An administrator can create the record in User Management."}
          </p>
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
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-foreground/90">{children}</dd>
    </div>
  );
}
