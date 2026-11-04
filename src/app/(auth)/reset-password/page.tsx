import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Réinitialiser mon mot de passe | Movie Explorer",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  );
}
