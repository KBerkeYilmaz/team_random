import LoginForm from "@/components/forms/LoginForm";
import { redirect } from "@/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const Login = async () => {
  // AUDIT #87 (Phase 1): session now from Better Auth (auth.api.getSession)
  // instead of next-auth getServerSession(). Redirect away if already signed in.
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen w-full animate-fadeIn flex-col items-center justify-center pt-[72px]">
      <LoginForm />
    </main>
  );
};

export default Login;
