export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label-base">{label}</label>}
      <select
        className={`input-base bg-white ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
