import { NextRequest } from "next/server";
import {
  handleProfileGet,
  handleProfileUpdate,
} from "@web3web4/shared-platform/api-handlers/index";

export async function GET() {
  return handleProfileGet();
}

export async function PATCH(request: NextRequest) {
  return handleProfileUpdate(request);
}
