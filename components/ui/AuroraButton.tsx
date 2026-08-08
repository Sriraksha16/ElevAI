import { ArrowRight } from "lucide-react";

type AuroraButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export function AuroraButton({
  children,
  onClick,
}: AuroraButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        group
        relative
        inline-flex
        items-center
        justify-center
        gap-2
        overflow-hidden
        rounded-xl
        px-6
        py-3
        font-medium
        text-white
        transition-all
        duration-300
        hover:scale-[1.02]
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-400/50
      "
    >
      <span
        className="
          absolute
          inset-0
         bg-linear-to-r
          from-violet-600
          via-indigo-500
          to-cyan-400
          transition-transform
          duration-500
          group-hover:scale-110
        "
      />

      <span
        className="
          absolute
          inset-0
          opacity-0
          blur-xl
          transition-opacity
          duration-300
          group-hover:opacity-70
          bg-linear-to-r
          from-violet-600
          via-indigo-500
          to-cyan-400
        "
      />

      <span className="relative z-10 flex items-center gap-2">
        {children}

        <ArrowRight
          size={18}
          className="
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
        />
      </span>
    </button>
  );
}