import { getCatalogContent } from "@/lib/content";
import { NextResponse } from "next/server";

export async function GET() {
  const content = getCatalogContent();
  // Return the minimal foundation catalog payload
  return NextResponse.json(content);
}
