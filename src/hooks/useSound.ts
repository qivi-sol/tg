import { useState } from "react";

export const useSound = () => {
  const [muted, setMuted] = useState(true);

  const play = (_cue: "success" | "reveal" | "fail") => {
    if (muted) {
      return;
    }

    // TODO: Wire real sound assets once the final audio pack is approved.
  };

  return {
    muted,
    play,
    toggleMuted: () => setMuted((current) => !current)
  };
};
