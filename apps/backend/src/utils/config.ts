import { readPromptFile } from "./helpers";
import { GlobalState } from "./types";
export { TOPICS } from "../../../shared/config";

export const MAX_TURNS = 10;

export const HERMES_URL = "http://localhost:8642/v1/chat/completions";
export const HERMES_AUTH = "Bearer tales-through-things";

export const OLLAMA_URL = "http://localhost:11434/v1/chat/completions";
export const OLLAMA_MODEL = "gemma4:e4b-mlx";

export const SYSTEMONE_URL = "http://localhost:11434/v1/systemone";
export const SYSTEMONE_MODEL = "nimble";
export const SYSTEMONE_QUESTIONS = {
  place: {
    type: "noul",
    instructions:
      "Does the text describe where the memory takes place (type of place, surroundings)?",
    criteria: {
      true: "Yes, the place is described",
      false: "No, the place is missing or vague",
    },
  },
  object: {
    type: "noul",
    instructions:
      "Does the text describe one central object (shape, color or material)?",
    criteria: {
      true: "Yes, an object is described",
      false: "No, the object is missing or vague",
    },
  },
  people: {
    type: "noul",
    instructions:
      "Does the text describe the people present (appearance or actions)?",
    criteria: {
      true: "Yes, people are described",
      false: "No, people are missing or vague",
    },
  },
  moment: {
    type: "noul",
    instructions:
      "Does the text describe one specific moment: what happened, when, at which season or time of day?",
    criteria: {
      true: "Yes, a specific moment is described",
      false: "No, it stays general",
    },
  },
};

export const HEADROOM_URL = `http://localhost:${process.env.HEADROOM_PORT ?? 8787}`;

export const DEFAULT_STATE: GlobalState = {
  status: "idle",
};

export const QUESTIONS: Record<string, string> = {
  q1: "Raconte-moi un moment avec [sujet] dont tu te souviens encore aujourd'hui.",
  q2: "Y a-t-il un moment que tu aimerais garder avant qu'il ne s'efface ?",
  q3: "Que s'est-il passé ce jour-là ?",
  q4: "Où étais-tu à ce moment-là ? Décris-moi l'endroit.",
  q5: "Qui était avec toi ?",
  q6: "C'était quelle saison, ou quel moment de la journée ?",
  q7: "Qu'y avait-il autour de toi : des meubles, des murs, une fenêtre, des arbres ?",
  q8: "D'où venait la lumière ? Elle était comment : douce, vive, chaude, grise ?",
  q9: "Si tu fermes les yeux, où te tiens-tu et qu'est-ce que tu vois devant toi ?",
  q10: "Quel son, quelle odeur ou quel goût te revient quand tu y penses ?",
  q11: "Qu'est-ce que tes mains touchaient ou tenaient ?",
  q12: "Quel objet était là, au milieu de ce moment ?",
  q13: "Si un seul objet pouvait garder ce souvenir, lequel serait-ce ?",
  q14: "Où était [l'objet] dans la pièce, et qui était près de lui ?",
  q15: "À quoi ressemblait [l'objet] quand tu le revois dans cette scène ?",
  q16: "Il était fait de quoi ? Lourd, léger, brillant, mat ?",
  q17: "Que faisait [la personne] à ce moment-là, et où se tenait-elle ?",
  q18: "Qu'as-tu ressenti à ce moment-là ?",
  q19: "Pourquoi ce souvenir est-il resté, selon toi ?",
  q20: "Y a-t-il quelque chose que tu aimerais ajouter avant qu'on garde ce souvenir ?",
};

export const SLOTS: Record<string, [string, number]> = {
  contexte: ["Does the story describe what happened during this moment?", 0.6],
  lieu: ["Does the story say what kind of place the scene happens in?", 0.7],
  decor: [
    "Does the story describe at least two elements of the surroundings?",
    0.6,
  ],
  saison_moment: [
    "Does the story indicate a season, a time of day or the weather?",
    0.7,
  ],
  sensoriel: [
    "Does the story contain a precise sound, smell, taste or texture?",
    0.7,
  ],
  objet: ["Is one concrete physical object at the center of this memory?", 0.8],
  aspect: [
    "Does the story describe the shape or color of the central object?",
    0.6,
  ],
};

export const SYSTEM_PROMPT = {
  IMAGE: {
    role: "system",
    content: readPromptFile("IMAGE.md"),
  },
};
