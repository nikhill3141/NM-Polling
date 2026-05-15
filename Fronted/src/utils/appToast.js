import { createElement } from "react";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const iconProps = { size: 20, strokeWidth: 2.25, "aria-hidden": true };

const toastBase = {
  className: "nm-hot-toast",
};

export function toastClear() {
  toast.dismiss();
}

export function toastSuccess(message) {
  if (!message) return;
  toast.success(message, {
    ...toastBase,
    icon: createElement(CheckCircle2, {
      ...iconProps,
      className: "nm-hot-toast-icon nm-hot-toast-icon--success",
    }),
  });
}

export function toastError(message) {
  if (!message) return;
  toast.error(message, {
    ...toastBase,
    icon: createElement(AlertCircle, {
      ...iconProps,
      className: "nm-hot-toast-icon nm-hot-toast-icon--error",
    }),
  });
}

export function toastInfo(message) {
  if (!message) return;
  toast(message, {
    ...toastBase,
    icon: createElement(Info, {
      ...iconProps,
      className: "nm-hot-toast-icon nm-hot-toast-icon--info",
    }),
  });
}
