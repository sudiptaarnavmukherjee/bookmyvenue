import { redirect } from "next/navigation";

/**
 * Legacy OTP verification route - retired after reverting to classic login/signup flow
 * Redirects to home
 */
export default function VerifyPhonePage() {
  redirect("/");
}
