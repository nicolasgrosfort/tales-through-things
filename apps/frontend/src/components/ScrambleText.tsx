import { useScramble } from "use-scramble";

type ScrambleTextProps = {
  text: string;
  className?: string;
};

export const ScrambleText = ({ text, className }: ScrambleTextProps) => {
  const { ref } = useScramble({
    text,
    speed: 0.6,
    tick: 1,
    step: 2,
    scramble: 1,
    overdrive: false,
    overflow: false,
  });

  return <p ref={ref} className={className} />;
};
