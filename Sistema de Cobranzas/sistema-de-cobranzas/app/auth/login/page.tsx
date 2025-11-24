import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white text-slate-900 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
