import type { ComponentType } from "react";
import RShellSim from "./RShellSim";
import SketchBoardSim from "./SketchBoardSim";
import NotebookSim from "./NotebookSim";

// Register a simulation here to give a skill card a "run simulation" button.
export const SIMS: Record<string, { title: string; component: ComponentType }> = {
  rshell: { title: "rshell — interactive simulation", component: RShellSim },
  sketchboard: { title: "sketchboard — interactive breadboard", component: SketchBoardSim },
  "data-analysis": { title: "data analysis — the real notebooks, rendered live", component: NotebookSim },
};
