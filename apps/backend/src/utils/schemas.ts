import z from "zod";

export const ResponseSchema = z.object({
  username: z
    .string()
    .describe(
      "Prénom de l'utilisateur, tel qu'il l'a donné. Vide tant qu'il n'a pas été demandé.",
    ),

  question: z
    .string()
    .describe(
      "La prochaine question à poser à l'utilisateur. Une seule question, courte, ouverte. " +
        "Jamais une question sur l'objet, l'image, ou le processus de mémorisation.",
    ),

  haiku: z
    .string()
    .describe(
      "Le souvenir mis en forme de haïku (trois vers, esprit 5-7-5 non strict en français). " +
        "Vide ('') tant que le souvenir n'est pas assez incarné pour être écrit.",
    ),

  object: z
    .string()
    .describe(
      "Nom de l'objet identifié silencieusement comme ancrage du souvenir, choisi par toi seul — " +
        "jamais nommé ni suggéré par l'utilisateur, jamais mentionné dans 'question'. " +
        "Vide ('') tant qu'aucun objet n'a émergé du souvenir.",
    ),

  prompt: z
    .string()
    .describe(
      "Prompt de génération d'image en anglais, décrivant uniquement l'objet d'ancrage " +
        "(matière, forme, lumière, usure) — pas la scène du souvenir, pas l'utilisateur. " +
        "Vide ('') tant que 'object' n'est pas rempli.",
    ),

  ready: z
    .boolean()
    .describe(
      "true uniquement quand 'haiku' ET 'object' sont tous deux suffisamment définis et que le " +
        "souvenir est jugé assez remémoré pour déclencher la génération d'image et la sauvegarde. " +
        "false dans tous les autres cas, y compris pendant les questions d'approfondissement.",
    ),

  image_url: z
    .string()
    .describe(
      "URL de l'image renvoyée par l'outil mcp_memorize_image, générée à partir de 'prompt'. " +
        "Vide ('') tant que l'outil n'a pas encore été appelé ou n'a pas encore répondu.",
    ),
});
