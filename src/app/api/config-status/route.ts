import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.TMDB_ACCESS_TOKEN;
  const isConfigured = typeof token === "string" && token.length > 5;
  return NextResponse.json({
    configured: isConfigured,
    baseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
  });
}
