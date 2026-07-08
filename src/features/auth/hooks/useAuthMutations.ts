import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth.store";
import type {
  SignInPayload,
  SignUpPayload,
} from "@/types/auth";

export function useSignIn() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: SignInPayload) => authService.signIn(payload),
    onSuccess: (session) => setSession(session),
  });
}

export function useSignUp() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: SignUpPayload) => authService.signUp(payload),
    onSuccess: (session) => setSession(session),
  });
}

export function useRequestPhoneOtp() {
  return useMutation({ mutationFn: (phone: string) => authService.requestPhoneOtp(phone) });
}

export function useVerifyPhoneOtp() {
  return useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) =>
      authService.verifyPhoneOtp(id, code),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authService.requestPasswordReset(email) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  });
}

export function useSignOut() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: () => authService.signOut(),
    onSettled: () => clear(),
  });
}