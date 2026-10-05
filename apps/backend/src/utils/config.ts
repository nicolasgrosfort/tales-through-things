export { TOPICS } from "../../../shared/config";

export const MAX_TURNS = 10;

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
