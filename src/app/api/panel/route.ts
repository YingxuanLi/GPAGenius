// File: pages/api/panel.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { renderTrpcPanel } from "@metamorph/trpc-panel";
import { appRouter } from "~/server/api/root"; // Adjust the path as needed

const handler = async (_: NextRequest) => {
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3001/api/trpc"
      : `https://${process.env.VERCEL_URL}/api/trpc`;
  const panelHtml = renderTrpcPanel(appRouter, {
    url: baseUrl, // Ensure this is your tRPC endpoint
    transformer: "superjson", // Ensure this matches your app's transformer
  });

  // Return the response using NextResponse
  return new NextResponse(panelHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
};
export { handler as GET, handler as POST };
