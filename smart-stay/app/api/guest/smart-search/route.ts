import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type SmartFilters = {
  location?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minGuests?: number;
  amenities?: string[];
  keywords?: string[];
};

function parseFallback(query: string): SmartFilters {
  const normalized = query.toLowerCase();
  const categoryRules: Array<{ pattern: RegExp; category: string }> = [
    { pattern: /\bluxury\s+villa(s)?\b/, category: "luxury-villas" },
    { pattern: /\bmountain\s+cabin(s)?\b/, category: "mountain-cabins" },
    { pattern: /\bcity\s+apartment(s)?\b/, category: "city-apartments" },
    { pattern: /\btropical\s+home(s)?\b/, category: "tropical-homes" },
    { pattern: /\bbeach\s+house(s)?\b/, category: "beach-houses" },
    { pattern: /\bloft(s)?\b/, category: "loft" },
  ];

  const amenityCandidates = ["wifi", "pool", "kitchen", "parking", "ac", "heating", "washer", "dryer", "tv", "gym"];
  const amenities = amenityCandidates.filter((a) => normalized.includes(a));

  const underMatch = normalized.match(/under\s*\$?(\d+)/);
  const betweenMatch = normalized.match(/between\s*\$?(\d+)\s*(and|to)\s*\$?(\d+)/);
  const overMatch = normalized.match(/over\s*\$?(\d+)/);
  const guestMatch = normalized.match(/(for|up to)?\s*(\d+)\s*(guest|guests|people|person)/);

  let category: string | undefined;
  for (const rule of categoryRules) {
    if (rule.pattern.test(normalized)) {
      category = rule.category;
      break;
    }
  }

  const locationMatch = normalized.match(/\b(?:in|near|around|at)\s+([a-z][a-z\s-]{1,40})$/);
  const location = locationMatch?.[1]?.trim();

  const words = normalized
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((w) => !["find", "show", "me", "a", "an", "the", "with", "in", "for", "under", "over", "between", "and", "to", "near", "around", "at"].includes(w));

  const keywordBlacklist = new Set([
    "luxury",
    "villa",
    "villas",
    "mountain",
    "cabin",
    "cabins",
    "city",
    "apartment",
    "apartments",
    "tropical",
    "home",
    "homes",
    "beach",
    "house",
    "houses",
    "loft",
    "lofts",
    ...amenityCandidates,
    "guest",
    "guests",
    "people",
    "person",
  ]);
  const keywords = words.filter((w) => !keywordBlacklist.has(w));

  const filters: SmartFilters = {
    location,
    amenities,
    keywords,
    category,
  };

  if (betweenMatch) {
    filters.minPrice = Number(betweenMatch[1]);
    filters.maxPrice = Number(betweenMatch[3]);
  } else if (underMatch) {
    filters.maxPrice = Number(underMatch[1]);
  } else if (overMatch) {
    filters.minPrice = Number(overMatch[1]);
  }

  if (guestMatch) {
    filters.minGuests = Number(guestMatch[2]);
  }

  return filters;
}

async function parseWithOpenAI(query: string): Promise<SmartFilters> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return parseFallback(query);

  const prompt = `Extract structured rental search filters from this user query. Return ONLY valid JSON with keys: location, category, minPrice, maxPrice, minGuests, amenities, keywords.\n\nAllowed categories: luxury-villas, mountain-cabins, city-apartments, tropical-homes, beach-houses, loft, other.\n\nQuery: ${query}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: "You extract search filters for property rentals. Output only JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return parseFallback(query);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return {
      location: typeof parsed.location === "string" ? parsed.location : undefined,
      category: typeof parsed.category === "string" ? parsed.category : undefined,
      minPrice: Number.isFinite(parsed.minPrice) ? Number(parsed.minPrice) : undefined,
      maxPrice: Number.isFinite(parsed.maxPrice) ? Number(parsed.maxPrice) : undefined,
      minGuests: Number.isFinite(parsed.minGuests) ? Number(parsed.minGuests) : undefined,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities.map((a: unknown) => String(a)) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map((k: unknown) => String(k)) : [],
    };
  } catch {
    return parseFallback(query);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json({ error: "A valid query is required" }, { status: 400 });
    }

    const filters = await parseWithOpenAI(query.trim());

    const client = await clientPromise;
    const db = client.db();

    const properties = await db.collection("properties").aggregate([
      {
        $lookup: {
          from: "users",
          localField: "host",
          foreignField: "_id",
          as: "hostDetails",
        },
      },
      { $unwind: { path: "$hostDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          images: 1,
          city: 1,
          country: 1,
          price: 1,
          maxGuests: 1,
          bedrooms: 1,
          bathrooms: 1,
          amenities: 1,
          createdAt: 1,
          host: 1,
          "hostDetails._id": 1,
          "hostDetails.name": 1,
          "hostDetails.email": 1,
        },
      },
    ]).toArray();

    const q = (text: unknown) => String(text || "").toLowerCase();
    const locationQuery = q(filters.location);
    const keywordQueries = (filters.keywords || []).map((k) => k.toLowerCase());
    const amenityQueries = (filters.amenities || []).map((a) => a.toLowerCase());

    const applyFilters = (activeFilters: SmartFilters) => {
      const activeLocationQuery = q(activeFilters.location);
      const activeKeywordQueries = (activeFilters.keywords || []).map((k) => k.toLowerCase());
      const activeAmenityQueries = (activeFilters.amenities || []).map((a) => a.toLowerCase());

      return properties.filter((p: any) => {
        if (activeFilters.category && p.category !== activeFilters.category) return false;
        if (typeof activeFilters.minPrice === "number" && Number(p.price || 0) < activeFilters.minPrice) return false;
        if (typeof activeFilters.maxPrice === "number" && Number(p.price || 0) > activeFilters.maxPrice) return false;
        if (typeof activeFilters.minGuests === "number" && Number(p.maxGuests || 0) < activeFilters.minGuests) return false;

        if (activeLocationQuery) {
          const city = q(p.city);
          const country = q(p.country);
          const title = q(p.title);
          const description = q(p.description);
          if (!(city.includes(activeLocationQuery) || country.includes(activeLocationQuery) || title.includes(activeLocationQuery) || description.includes(activeLocationQuery))) {
            return false;
          }
        }

        if (activeAmenityQueries.length > 0) {
          const amenityText = (p.amenities || []).map((a: unknown) => q(a));
          const hasAll = activeAmenityQueries.every((a) => amenityText.some((am: string) => am.includes(a)));
          if (!hasAll) return false;
        }

        if (activeKeywordQueries.length > 0) {
          const haystack = `${q(p.title)} ${q(p.description)} ${q(p.city)} ${q(p.country)}`;
          const hasAnyKeyword = activeKeywordQueries.some((k) => haystack.includes(k));
          if (!hasAnyKeyword) return false;
        }

        return true;
      });
    };

    let filtered = applyFilters(filters);

    if (
      filtered.length === 0 &&
      filters.category &&
      (Boolean(filters.location) || Boolean(filters.keywords?.length) || Boolean(filters.amenities?.length))
    ) {
      filtered = applyFilters({ ...filters, category: undefined });
    }

    return NextResponse.json({
      query,
      filters,
      properties: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error("Smart search failed:", error);
    return NextResponse.json({ error: "Smart search failed" }, { status: 500 });
  }
}
