"use server"

import Member from "@/models/member";

async function createMember(member) {
  return await Member.create(member);
}