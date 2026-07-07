import { RecallFormClient } from "./RecallFormClient";
export const dynamic = "force-dynamic";

export default async function RecallPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <RecallFormClient token={token} />;
}
