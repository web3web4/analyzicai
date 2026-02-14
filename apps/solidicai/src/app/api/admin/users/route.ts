import { NextRequest } from "next/server";
import { handleAdminUsersList } from "@web3web4/shared-platform/api-handlers/index";

export async function GET(request: NextRequest) {
  return handleAdminUsersList(request);
}
