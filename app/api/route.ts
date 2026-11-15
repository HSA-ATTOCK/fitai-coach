import { NextResponse, connection  } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  await connection();
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    const missingTable =
      error?.code === "42P01" ||
      error?.code === "PGRST205";

    if (error && !missingTable) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: missingTable
        ? "Supabase connected successfully. Profiles table is not created yet."
        : "Supabase connected successfully and profiles table is accessible.",
    });
  } catch (error) {
    console.error("Supabase connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Supabase connection failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}