import { CheckCircle, XCircle, X } from "lucide-react";

export default function QuizResultPopup({
  isOpen,
  isCorrect,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/1 px-4 backdrop-blur-[1px]">
      
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-sm">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isCorrect
              ? "bg-emerald-100 text-emerald-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isCorrect ? (
            <CheckCircle size={34} />
          ) : (
            <XCircle size={34} />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-slate-900">
          {isCorrect ? "Correct!" : "Not quite!"}
        </h2>

        {/* Message */}
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isCorrect
            ? "Great job! You selected the correct answer."
            : "That's not the correct answer. Keep going!"}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className={`mt-6 w-full rounded-xl px-5 py-3 font-bold text-white ${
            isCorrect
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Continue
        </button>

      </div>
    </div>
  );
}