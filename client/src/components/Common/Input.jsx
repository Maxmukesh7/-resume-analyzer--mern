import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Input({
  label,
  type = 'text',
  placeholder,
  error,
  className = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-all duration-300 backdrop-blur-md text-sm
            ${error 
              ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/30' 
              : 'border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]'
            }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex="-1"
          >
            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-400 font-medium mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
