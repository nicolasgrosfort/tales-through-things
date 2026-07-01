const HERMES_SYSTEM_PROMPT = "";

export async function sendMessage(input: string, conversationId: string) {
  const res = await fetch("http://localhost:8642/v1/responses", {
    method: "POST",
    headers: {
      Authorization: "Bearer tales-through-things",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hermes-agent",
      input,
      conversation: conversationId,
    }),
  });

  const data = await res.json();
  const message = data.output.find((o: any) => o.type === "message");
  return message?.content?.[0]?.text ?? "";
}

export const getSession = async (sessionId: string) => {
  const apiUrl = sessionId
    ? `http://localhost:8642/api/sessions/${sessionId}`
    : `http://localhost:8642/api/sessions`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: "Bearer tales-through-things",
    },
  });

  return await res.json();
};
