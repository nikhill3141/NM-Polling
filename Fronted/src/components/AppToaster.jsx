import React from "react";
import { Toaster } from "react-hot-toast";

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={14}
      containerClassName="nm-hot-toaster"
      toastOptions={{
        duration: 4200,
        className: "nm-hot-toast",
        success: { className: "nm-hot-toast nm-hot-toast--success" },
        error: { className: "nm-hot-toast nm-hot-toast--error" },
        style: { background: "transparent", boxShadow: "none", padding: 0 },
      }}
    />
  );
}
