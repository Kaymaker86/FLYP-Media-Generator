'use client';

interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  label?: string;
}

export default function GenerateButton({
  onClick,
  loading,
  disabled,
  label = 'Generate',
}: GenerateButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {loading ? 'Generating...' : label}
    </button>
  );
}
