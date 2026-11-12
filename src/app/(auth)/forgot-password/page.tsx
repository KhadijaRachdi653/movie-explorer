import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Mot de passe oublié | Movie Explorer",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  );
}
