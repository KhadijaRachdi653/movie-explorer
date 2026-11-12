import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Réinitialiser mon mot de passe | Movie Explorer",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  );
}
