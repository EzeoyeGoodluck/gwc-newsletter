"use client";

import { useState, useEffect } from "react";
import {
  MembersDirectory,
  Member,
} from "@/components/members/members-directory";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetch(`/api/members?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members);
        setTotal(data.total);
      });
  }, [page]);

  return (
    <MembersDirectory
      members={members}
      total={total}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onAddMember={() => {}}
      onAction={(action, member) => console.log(action, member)}
    />
  );
}
