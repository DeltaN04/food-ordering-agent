export const API = "";
export const sessionId = "sess_" + Math.random().toString(36).slice(2, 9);
export async function api(path, init) {
    const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
    if (!res.ok)
        throw new Error(await res.text());
    return res.json();
}
