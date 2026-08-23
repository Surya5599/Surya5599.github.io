import type { ComponentType } from "react";
import RShellSim from "./RShellSim";

// Register a simulation here to give a skill card a "run simulation" button.
export const SIMS: Record<string, { title: string; component: ComponentType }> = {
  rshell: { title: "rshell — interactive simulation", component: RShellSim },
};
