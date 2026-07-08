import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AuthLayout } from "../components/AuthLayout";
import { PrimaryButton } from "../components/PrimaryButton";
import { ROUTES } from "@/constants/routes";

export function PasswordUpdatedScreen() {
  const navigate = useNavigate();
  return (
    <AuthLayout title="Password updated" subtitle="You can now sign in with your new password.">
      <div className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 16 }}
          className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-pink text-noir shadow-glow"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>
        <PrimaryButton onClick={() => navigate({ to: ROUTES.signIn, replace: true })}>
          Back to sign in
        </PrimaryButton>
      </div>
    </AuthLayout>
  );
}