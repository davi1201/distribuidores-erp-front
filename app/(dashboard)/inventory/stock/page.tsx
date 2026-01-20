import { StockList } from "@/features/client/stock";
import { Loader } from "@mantine/core";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<Loader />}>
      <StockList />
    </Suspense>
  )
}