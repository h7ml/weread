import { FreshContext } from "fresh";
import { getByToken } from "@/kv";
import { jsonResponse } from "@/utils";

export async function handler(req: Request, _ctx: FreshContext) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  
  if (!token) {
    return jsonResponse({ success: false, error: "No token" }, 401);
  }
  
  const credential = await getByToken(token);
  if (credential) {
    return jsonResponse({ 
      success: true, 
      data: {
        vid: credential.vid,
        name: credential.name,
      }
    });
  }
  
  return jsonResponse({ success: false, error: "Invalid token" }, 401);
}