"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/auth/login";
  }
};

export function useAuthGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("access_token");

    if (!t) {
      router.replace("/auth/login");
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}
