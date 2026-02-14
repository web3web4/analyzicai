import { NextRequest } from "next/server";
import {
  handleAdminUserGet,
  handleAdminUserUpdate,
} from "@web3web4/shared-platform/api-handlers/index";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  return handleAdminUserGet(request, { params });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  return handleAdminUserUpdate(request, { params });
}
