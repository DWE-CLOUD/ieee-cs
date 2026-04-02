interface DecorativeArrowProps {
  className?: string;
}

const DecorativeArrow = ({ className }: DecorativeArrowProps) => {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Curved arrow shape */}
      <path
        d="M12 32C12 32 12 20 24 20C36 20 36 32 36 32"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M36 32L52 32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M46 26L52 32L46 38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default DecorativeArrow;
