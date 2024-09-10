import { getServerSession } from "next-auth";
import React from "react";
import { Course } from "~/app/_components/course";
import { api, HydrateClient } from "~/trpc/server";

const GradeCalculator = async () => {
  const session = await getServerSession();
  void api.user.getUserEnrollments.prefetch({ userId: session?.user.id });
  return (
    <HydrateClient>
      <div>Your GPA calculation component goes here</div>
      <Course />
    </HydrateClient>
  );
};

export default GradeCalculator;
