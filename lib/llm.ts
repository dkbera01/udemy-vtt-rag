import OpenAI from "openai";
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function rewriteQuery(query: string): Promise<string> {
  const prompt = `Rewrite the user query for transcript search. Keep the intent, remove ambiguity.\nUser: "${query}"\nRewritten:`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });
  return res.choices[0].message?.content?.trim() || query;
}
