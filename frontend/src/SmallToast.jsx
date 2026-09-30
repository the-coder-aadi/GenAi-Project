import { useEffect, useState } from "react";

export default function SmallToast({
  isOpen,
  message,
  onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }

    // Smooth entry
    requestAnimationFrame(() => {
      setVisible(true);
    });

    // Automatically close after 3 seconds
    const timer = setTimeout(() => {
      setVisible(false);

      // Wait for exit animation
      setTimeout(() => {
        onClose();
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-5 right-5 left-5 z-[9999] flex justify-center sm:left-auto sm:right-5 sm:justify-start transition-all duration-300 ease-out ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-white px-4 py-3 shadow-md">
        
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />

        <p className="text-sm font-medium text-slate-700">
          {message}
        </p>

        <button
          onClick={() => {
            setVisible(false);

            setTimeout(() => {
              onClose();
            }, 300);
          }}
          className="ml-2 text-lg leading-none text-slate-400 hover:text-slate-700"
        >
          ×
        </button>

      </div>
    </div>
  );
}