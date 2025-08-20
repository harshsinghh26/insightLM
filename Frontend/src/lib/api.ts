export const API_BASE = "https://insightlm.onrender.com";

export async function indexFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/index/pdf`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to index file");
  return res.json();
}

export async function indexText(text: string, name?: string) {
  const res = await fetch(`${API_BASE}/api/index/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, name }),
  });
  if (!res.ok) throw new Error("Failed to index text");
  return res.json();
}

export async function indexUrl(url: string) {
  const res = await fetch(`${API_BASE}/api/index/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to index URL");
  return res.json();
}

export async function chat(query: string) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

export async function chatStream(query: string, onToken: (t: string) => void): Promise<{ sources?: any }> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok || !res.body) throw new Error("Chat stream request failed");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sources: any | undefined;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split(/\n\n/).filter(Boolean);
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        if (json.token) onToken(json.token);
        if (json.done) sources = json.sources;
      } catch {}
    }
  }
  return { sources };
}

export async function summarizeStream(text: string, onToken: (t: string) => void) {
  const res = await fetch(`${API_BASE}/api/summarize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok || !res.body) throw new Error("Summarize stream request failed");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split(/\n\n/).filter(Boolean);
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        if (json.token) onToken(json.token);
      } catch {}
    }
  }
}
