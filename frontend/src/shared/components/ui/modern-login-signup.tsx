import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Github, Loader2, Mail, Phone, ShieldCheck, ArrowLeft, RefreshCw, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { Logo } from "@/shared/components/landing/Logo";
import { useAuth } from "@/auth/auth-context";
import { ROLE_HOME } from "@/auth/types";
import { initiateRegistration, verifyOTPAndRegister } from "@/api/workspace-service";

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";

// Magic UI Components
import { ShimmerButton } from "@/shared/components/magicui/shimmer-button";
import { BorderBeam } from "@/shared/components/magicui/border-beam";

type Mode = "signin" | "signup";
type SignupStep = "details" | "verify_otp";

type Errors = Partial<Record<"email" | "password" | "name" | "phone" | "confirm" | "email_otp" | "mobile_otp" | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.75 4.4-5.35 4.4-3.2 0-5.8-2.65-5.8-5.9S8.8 6.6 12 6.6c1.8 0 3 .75 3.7 1.4l2.05-2C16.4 4.7 14.4 3.9 12 3.9 7.3 3.9 3.5 7.7 3.5 12.5S7.3 21.1 12 21.1c5 0 8.3-3.5 8.3-8.45 0-.6-.05-1.05-.15-1.55Z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 23 23" aria-hidden className="size-4">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H1z" />
    </svg>
  );
}

/**
 * Modern Shadcn UI & Magic UI Authentication Experience.
 * Features Shadcn Card, Tabs, Inputs, Labels, Buttons + Magic UI ShimmerButton, BorderBeam,
 * Gmail SMTP Email Verification, and Mobile SMS OTP Verification.
 */
export function ModernLoginSignup() {
  const navigate = useNavigate();
  const { signIn, authenticateToken } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "+91 ",
    department: "General",
    requestedRole: "employee",
    password: "",
    confirm: "",
    emailOtp: "",
    mobileOtp: "",
  });

  // Handle URL callback parameters (e.g. ?token=... or ?oauth_error=... from OAuth redirect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    // Backend sends ?oauth_error=...; also support legacy ?error=
    const errorParam = urlParams.get("oauth_error") || urlParams.get("error");

    if (errorParam) {
      const msg =
        errorParam === "authentication_failed"
          ? "OAuth authentication failed. Please try again."
          : errorParam === "configuration"
            ? "OAuth is not configured for this provider."
            : decodeURIComponent(errorParam);
      setErrors({ form: msg });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (tokenParam) {
      setLoading(true);
      authenticateToken(tokenParam)
        .then((session) => {
          window.history.replaceState({}, document.title, window.location.pathname);
          const roleStr = String(session.user.role).toLowerCase();
          const targetPath = roleStr === "admin" ? "/admin" : "/dashboard";
          window.location.href = targetPath;
        })
        .catch((err) => {
          setErrors({ form: err instanceof Error ? err.message : "OAuth authentication failed." });
          setLoading(false);
        });
    }
  }, [authenticateToken]);


  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const validatePasswordComplexity = (pwd: string): string | null => {
    if (pwd.length < 12) return "Password must be at least 12 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter.";
    if (!/\d/.test(pwd)) return "Password must contain at least one digit.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':,./<>?]/.test(pwd))
      return "Password must contain at least one special character (!@#$%^&* etc.).";
    return null;
  };

  const validate = () => {
    const next: Errors = {};
    if (!EMAIL_RE.test(values.email.trim())) next.email = "Enter a valid email address.";

    if (mode === "signup") {
      if (signupStep === "details") {
        if (values.name.trim().length < 2) next.name = "Enter your full name.";
        if (values.phone.trim().length < 10) next.phone = "Enter a valid mobile phone number.";
        const pwdError = validatePasswordComplexity(values.password);
        if (pwdError) next.password = pwdError;
        if (values.confirm !== values.password) next.confirm = "Passwords do not match.";
      } else {
        if (values.emailOtp.trim().length !== 6) next.email_otp = "Enter 6-digit Gmail SMTP OTP.";
        if (values.mobileOtp.trim().length !== 6) next.mobile_otp = "Enter 6-digit Mobile SMS OTP.";
      }
    } else {
      if (!values.password) next.password = "Password is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Handle Step 1: Send Gmail SMTP & Mobile SMS OTPs
  const handleInitiateRegistration = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await initiateRegistration({
        email: values.email,
        password: values.password,
        full_name: values.name,
        phone_number: values.phone,
        department: values.department,
        requested_role: values.requestedRole,
      });
      setSessionToken(res.session_token);
      setOtpInfoMessage(res.message);
      setSignupStep("verify_otp");
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Failed to send verification OTPs." });
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify Gmail & Mobile OTPs
  const handleVerifyOTP = async () => {
    if (!validate() || !sessionToken) return;
    setLoading(true);
    setErrors({});
    try {
      const result = await verifyOTPAndRegister({
        session_token: sessionToken,
        email_otp: values.emailOtp,
        mobile_otp: values.mobileOtp,
      });
      const session = await authenticateToken(result.access_token);
      const roleStr = String(session.user.role).toLowerCase();
      const targetPath = roleStr === "admin" ? "/admin" : "/dashboard";
      window.location.href = targetPath;
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "OTP verification failed." });
      setLoading(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "signin") {
      if (!validate()) return;
      setLoading(true);
      try {
        const session = await signIn({
          email: values.email,
          password: values.password,
        });
        const roleStr = String(session.user.role).toLowerCase();
        const targetPath = roleStr === "admin" ? "/admin" : "/dashboard";
        window.location.href = targetPath;
      } catch (error) {
        setErrors({ form: error instanceof Error ? error.message : "Invalid email or password." });
        setLoading(false);
      }
    } else {
      if (signupStep === "details") {
        await handleInitiateRegistration();
      } else {
        await handleVerifyOTP();
      }
    }
  };

  const handleSocialLogin = (provider: "google" | "github" | "microsoft") => {
    const apiUrl = ((import.meta.env["VITE_API_URL"] as string | undefined) || "").replace(/\/$/, "");
    if (!apiUrl && typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
      setErrors({
        form: `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth requires a running backend API. Set VITE_API_URL in your Vercel Environment Variables to point to your FastAPI backend server.`,
      });
      return;
    }
    setLoading(true);
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/oauth/${provider}/login` : `/api/v1/auth/oauth/${provider}/login`;
    window.location.href = targetUrl;
  };

  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      {/* Background Dots & Glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="auth-dots absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(110%_80%_at_50%_0%,transparent_10%,var(--background)_75%)]" />
      </div>

      {/* Main Authentication Container using Shadcn Card & Magic UI BorderBeam */}
      <Card className="relative w-full max-w-[460px] overflow-hidden border-hairline bg-surface-strong/95 p-2 shadow-2xl backdrop-blur-2xl">
        <BorderBeam size={340} duration={14} delay={0} colorFrom="#3b82f6" colorTo="#a855f7" />

        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-display text-[18px] font-semibold tracking-tight text-foreground">
                NeroxaAI
              </span>
            </div>

            {mode === "signup" && signupStep === "verify_otp" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSignupStep("details")}
                className="h-8 gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Button>
            ) : null}
          </div>

          {/* Shadcn Tabs for Mode Switcher */}
          <Tabs
            value={mode}
            onValueChange={(val) => {
              setMode(val as Mode);
              setSignupStep("details");
              setErrors({});
            }}
            className="w-full pt-2"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/40 p-1">
              <TabsTrigger value="signin" className="rounded-lg text-[13px] font-medium">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-[13px] font-medium">
                Create Account
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <CardTitle className="font-display text-[21px] font-medium tracking-tight text-foreground pt-1">
            {mode === "signin"
              ? "Sign in to your workspace"
              : signupStep === "details"
                ? "Register a new user account"
                : "Verify OTP Codes"}
          </CardTitle>
          <CardDescription className="text-[12.5px]">
            {mode === "signin"
              ? "Access your enterprise AI RAG assistant & documents."
              : signupStep === "details"
                ? "Enter your details to receive Gmail SMTP & Mobile SMS OTPs."
                : `Verification codes sent to ${values.email} and ${values.phone}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {mode === "signup" && signupStep === "verify_otp" ? (
              /* Step 2: Dual OTP Verification Screen */
              <div className="space-y-4 animate-in fade-in-50 duration-300">
                {otpInfoMessage ? (
                  <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-[12px] text-primary">
                    <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                    <span>{otpInfoMessage}</span>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="auth-email-otp" className="flex items-center gap-1.5 text-[12px]">
                    <Mail className="size-3.5 text-primary" /> Gmail SMTP Verification Code
                  </Label>
                  <Input
                    id="auth-email-otp"
                    type="text"
                    maxLength={6}
                    className="font-mono text-center tracking-widest text-[16px] h-10 border-input bg-card/60"
                    value={values.emailOtp}
                    onChange={set("emailOtp")}
                    placeholder="123456"
                  />
                  {errors.email_otp ? (
                    <p className="text-[11.5px] text-destructive">{errors.email_otp}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-mobile-otp" className="flex items-center gap-1.5 text-[12px]">
                    <Phone className="size-3.5 text-primary" /> Mobile SMS OTP Code
                  </Label>
                  <Input
                    id="auth-mobile-otp"
                    type="text"
                    maxLength={6}
                    className="font-mono text-center tracking-widest text-[16px] h-10 border-input bg-card/60"
                    value={values.mobileOtp}
                    onChange={set("mobileOtp")}
                    placeholder="654321"
                  />
                  {errors.mobile_otp ? (
                    <p className="text-[11.5px] text-destructive">{errors.mobile_otp}</p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleInitiateRegistration}
                    disabled={loading}
                    className="h-8 gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} /> Resend OTPs
                  </Button>
                </div>
              </div>
            ) : mode === "signup" ? (
              /* Step 1: Registration Form */
              <div className="space-y-3.5 animate-in fade-in-50 duration-300">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-name">Full Name</Label>
                  <Input
                    id="auth-name"
                    className="h-10 border-input bg-card/60"
                    value={values.name}
                    onChange={set("name")}
                    autoComplete="name"
                    placeholder="Alex Morgan"
                  />
                  {errors.name ? <p className="text-[11.5px] text-destructive">{errors.name}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-email">Gmail / Work Email Address</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    className="h-10 border-input bg-card/60"
                    value={values.email}
                    onChange={set("email")}
                    autoComplete="email"
                    placeholder="name@gmail.com"
                  />
                  {errors.email ? <p className="text-[11.5px] text-destructive">{errors.email}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-phone">Mobile Phone Number</Label>
                  <Input
                    id="auth-phone"
                    type="tel"
                    className="h-10 border-input bg-card/60"
                    value={values.phone}
                    onChange={set("phone")}
                    placeholder="+91 9876543210"
                  />
                  {errors.phone ? <p className="text-[11.5px] text-destructive">{errors.phone}</p> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-department">Department</Label>
                    <select
                      id="auth-department"
                      className="flex h-10 w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring/60"
                      value={values.department}
                      onChange={set("department")}
                    >
                      <option value="General">General</option>
                      <option value="Finance">Finance</option>
                      <option value="Engineering">Engineering</option>
                      <option value="HR">HR</option>
                      <option value="Sales">Sales</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-requested-role">Preferred Role</Label>
                    <select
                      id="auth-requested-role"
                      className="flex h-10 w-full rounded-md border border-input bg-card/60 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring/60"
                      value={values.requestedRole}
                      onChange={set("requestedRole")}
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="analyst">Data Analyst</option>
                      <option value="finance_lead">Finance Lead</option>
                      <option value="hr_manager">HR Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-password">Password</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      className="h-10 border-input bg-card/60"
                      value={values.password}
                      onChange={set("password")}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-confirm">Confirm Password</Label>
                    <Input
                      id="auth-confirm"
                      type="password"
                      className="h-10 border-input bg-card/60"
                      value={values.confirm}
                      onChange={set("confirm")}
                      autoComplete="new-password"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>
                {errors.password ? (
                  <p className="text-[11.5px] text-destructive">{errors.password}</p>
                ) : null}
                {errors.confirm ? (
                  <p className="text-[11.5px] text-destructive">{errors.confirm}</p>
                ) : null}
              </div>
            ) : (
              /* Sign In Form */
              <div className="space-y-3.5 animate-in fade-in-50 duration-300">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-email">Email Address</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    className="h-10 border-input bg-card/60"
                    value={values.email}
                    onChange={set("email")}
                    autoComplete="email"
                    placeholder="name@work-email.com"
                  />
                  {errors.email ? <p className="text-[11.5px] text-destructive">{errors.email}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="auth-password">Password</Label>
                  <Input
                    id="auth-password"
                    type="password"
                    className="h-10 border-input bg-card/60"
                    value={values.password}
                    onChange={set("password")}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                  />
                  {errors.password ? (
                    <p className="text-[11.5px] text-destructive">{errors.password}</p>
                  ) : null}
                </div>
              </div>
            )}

            {errors.form ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11.5px] text-destructive">
                {errors.form}
              </p>
            ) : null}

            {/* Primary Action Button using Magic UI ShimmerButton */}
            <ShimmerButton
              type="submit"
              disabled={loading}
              shimmerColor="#3b82f6"
              background="rgba(15, 23, 42, 0.95)"
              className="w-full h-11 text-[13.5px] font-semibold text-white shadow-xl"
            >
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              {mode === "signin"
                ? "Sign In to Workspace"
                : signupStep === "details"
                  ? "Send Verification OTPs"
                  : "Verify & Complete Registration"}
            </ShimmerButton>
          </form>

          {mode === "signin" ? (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-hairline" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-surface-strong px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* Social Logins using Shadcn Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Google", icon: <GoogleIcon />, provider: "google" as const },
                  { label: "GitHub", icon: <Github className="size-4" />, provider: "github" as const },
                  { label: "Microsoft", icon: <MicrosoftIcon />, provider: "microsoft" as const },
                ].map((item) => (
                  <Button
                    key={item.provider}
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleSocialLogin(item.provider)}
                    className="h-10 border-input bg-card/40 text-[12.5px] hover:bg-accent"
                  >
                    {item.icon}
                    <span className="ml-1.5 hidden sm:inline">{item.label}</span>
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center pt-2 pb-4">
          <p className="text-center text-[12px] text-muted-foreground">
            {mode === "signin" ? "Need an account? " : "Already registered? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setSignupStep("details");
                setErrors({});
              }}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create Account" : "Sign In"}
            </button>
          </p>
          <p className="mt-2 text-center text-[10.5px] text-muted-foreground/75">
            Protected by NeroxaAI Enterprise Security &amp; Role-Based Access Control
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
