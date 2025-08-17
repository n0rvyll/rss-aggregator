// app/api/nameday/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 21600;

// Egyszerű HU névnap-térkép. Töltsd fel később teljes készlettel.
// Kulcs: "M-D" (vezető nullák NINCSENEK). Érték: név(ek) vesszővel.
const NAMEDAYS_HU: Record<string, string> = {
  // PÉLDÁK – kérlek bővítsd ki!
  "1-1": "Fruzsina",
  "1-6": "Menyhért, Gáspár, Boldizsár",
  "2-14": "Bálint",
  "3-8": "Zoltán",
  "3-15": "Krisztián",
  "4-12": "Gyula",
  "5-1": "Munka ünnepe (nincs hagyományos névnap)",
  "6-1": "Tünde",
  "7-20": "Illés",
  "8-15": "Mária",
  "8-17": "Jácint", // ← a te példád napja
  "8-18": "Ilona",
  "8-20": "István",
  "9-1": "Egyed",
  "10-23": "Gyöngyi",
  "11-1": "Mindenszentek (nincs hagyományos névnap)",
  "11-11": "Márton",
  "12-6": "Miklós",
  "12-24": "Ádám, Éva",
  "12-25": "Karácsony (Eugenia)",
};

// Budapest-idő szerint határozzuk meg az aktuális hónapot/napot,
// ha a kliens nem küld paramétert.
function getBudapestMonthDay(): { month: number; day: number } {
  const parts = new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { month, day };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let month = Number(searchParams.get("month") || "");
  let day = Number(searchParams.get("day") || "");

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    day < 1
  ) {
    const md = getBudapestMonthDay();
    month = md.month;
    day = md.day;
  }

  const key = `${month}-${day}`;
  const name = NAMEDAYS_HU[key] || null;

  return NextResponse.json({
    month,
    day,
    name, // ha nincs adat → null (a UI „—”-t mutathat)
    source: "local", // később tehetsz ide „remote”-ot is, ha külső API-t használsz
  });
}
