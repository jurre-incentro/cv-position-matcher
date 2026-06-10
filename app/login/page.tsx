import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-8 shadow-soft">
        <h1 className="mb-1 text-xl font-semibold text-ink">Inloggen</h1>
        <p className="mb-6 text-sm text-ink/60">CV Position Matcher — alleen voor Incentro medewerkers.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
