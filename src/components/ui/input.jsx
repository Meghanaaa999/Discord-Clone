export function Input({ className = "", ...props }) {
  return (
    <input
      className={`h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ${className}`}
      {...props}
    />
  );
}
