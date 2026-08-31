interface ChipProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "sold-out";
  className?: string;
}

const Chip = ({ children, variant = "default", className = "" }: ChipProps) => {
  const baseClasses = "chip";
  
  const variantClasses = {
    default: "",
    accent: "chip-accent",
    "sold-out": "bg-accent text-accent-foreground"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Chip;