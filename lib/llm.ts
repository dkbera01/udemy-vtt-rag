import OpenAI from "openai";
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function rewriteQuery(query: string): Promise<string> {
  const prompt = `Rewrite the user query to make it more precise for transcript search. Remove ambiguity, fix typos, but keep the original intent. User: "${query}" Rewritten:`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });
  return res.choices[0].message?.content?.trim() || query;
}
