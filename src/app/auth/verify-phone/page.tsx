import { Suspense } from "react";
import VerifyPhoneClient from "./VerifyPhoneClient";

function VerifyPhoneLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <p className="text-gray-600">Loading verification...</p>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <Suspense fallback={<VerifyPhoneLoading />}>
      <VerifyPhoneClient />
    </Suspense>
  );
}
