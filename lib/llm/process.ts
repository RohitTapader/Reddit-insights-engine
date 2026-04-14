export async function runLLM(prompt: string) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a product analyst. Use ONLY given data. Do not hallucinate.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
  
    const data = await res.json();
    return data.choices[0].message.content;
  }