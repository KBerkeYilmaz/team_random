import LoginForm from "@/components/forms/LoginForm";
import { redirect } from "@/navigation";
import { getServerSession } from "next-auth";

const Login = async () => {
  const session = await getServerSession();
  if (session !== null) {
    redirect("/");
  }

  return (
    <main className="flex flex-col justify-center items-center w-full pt-[72px] min-h-screen animate-fadeIn">
      <LoginForm />
    </main>
  );
};

export default Login;
