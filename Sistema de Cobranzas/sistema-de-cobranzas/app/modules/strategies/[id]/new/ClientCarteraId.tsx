"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function ClientCarteraId() {
  const pathname = usePathname() ?? "";
  // Expected path: /modules/strategies/:id/new
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("strategies");
  let id: string | null = null;
  if (idx >= 0 && parts.length > idx + 1) {
    id = parts[idx + 1];
  }

  return (
    <div className="mt-2 text-sm text-slate-700">
      
    </div>
  );
}
