export function Card({ children, className, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-xl ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={`px-6 pb-6 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}

export function CardDescription({ children, ...props }) {
  return (
    <p className="mt-1 text-sm text-slate-500" {...props}>
      {children}
    </p>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={`px-6 pt-6 ${className || ""}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, ...props }) {
  return (
    <h2 className="text-2xl font-bold text-slate-900" {...props}>
      {children}
    </h2>
  );
}
