import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Se connecter",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; activated?: string }>;
}) {
  const { registered, activated } = await searchParams;
  return <LoginForm registered={registered === "true"} activated={activated === "true"} />;
}
