import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { ScanCheck, ScanMeta, ScanResult, Verdict } from "./scan/types";

const urlInput = z.object({ url: z.string().min(3).max(300) });
const idInput = z.object({ id: z.string().uuid() });

export const scanUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => urlInput.parse(data))
  .handler(async ({ data }): Promise<ScanResult> => {
    const { normalizeInputUrl } = await import("./scan/types");
    const target = normalizeInputUrl(data.url);
    if (!target) {
      throw new Error("Bitte eine gültige Web-Adresse eingeben, z. B. beispiel-shop.de");
    }

    const { analyzeUrl } = await import("./scan/analyze.server");
    const result = await analyzeUrl(target);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("scans")
        .insert({
          url: result.url,
          host: result.host,
          final_url: result.finalUrl,
          score: result.score,
          verdict: result.verdict,
          checks: result.checks as unknown as never,
          meta: result.meta as unknown as never,
          fetched_at: result.fetchedAt,
        })
        .select("id")
        .single();
      if (row) result.id = row.id;
    } catch (error) {
      console.error("scan persist failed", error);
    }

    return result;
  });

export const getScan = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data }): Promise<ScanResult | null> => {
    const { publicClient } = await import("./scan/db.server");
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("scans")
      .select("id, url, host, final_url, score, verdict, checks, meta, fetched_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return null;
    return {
      id: row.id,
      url: row.url,
      host: row.host,
      finalUrl: row.final_url,
      score: row.score,
      verdict: row.verdict as Verdict,
      checks: row.checks as unknown as ScanCheck[],
      meta: row.meta as unknown as ScanMeta,
      fetchedAt: row.fetched_at,
    };
  });

export interface RecentScan {
  id: string;
  host: string;
  score: number;
  verdict: Verdict;
  fetchedAt: string;
}

export const listRecentScans = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecentScan[]> => {
    const { publicClient } = await import("./scan/db.server");
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("scans")
      .select("id, host, score, verdict, fetched_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      host: row.host,
      score: row.score,
      verdict: row.verdict as Verdict,
      fetchedAt: row.fetched_at,
    }));
  },
);
