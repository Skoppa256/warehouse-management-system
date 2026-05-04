export async function api(path: string, options: any = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
  console.log("Calling:", `${process.env.NEXT_PUBLIC_API_URL}${path}`);
  console.log("Token:", token);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    console.error("API ERROR RESPONSE:", res.status);
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function upload(path: string, formData: FormData) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    console.error("UPLOAD ERROR RESPONSE:", res.status);
    throw new Error(`Upload error: ${res.status}`);
  }

  return res.json();
}
