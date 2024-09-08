import React from "react";
import { Course } from "~/app/_components/course";
import { Enrollments } from "~/components/enrollments";
import { getServerAuthSession } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

const GradeCalculator = async () => {
  const session = await getServerAuthSession();
  void api.user.getUserEnrollments.prefetch({ userId: session?.user.id });
  return (
    <HydrateClient>
      <div>Your GPA calculation component goes here</div>
      <Enrollments />
      {/* <Course /> */}
    </HydrateClient>
  );
};

export default GradeCalculator;
