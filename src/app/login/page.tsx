import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900">TPRM</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
      </div>
      <LoginForm />
    </div>
  );
}
