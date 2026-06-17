import { useParams } from "wouter";
import PhoneNumberPage   from "@/pages/product/PhoneNumberPage";
import UltraPlanPage     from "@/pages/product/UltraPlanPage";
import BusinessPage      from "@/pages/product/BusinessPage";
import SecurityPage      from "@/pages/product/SecurityPage";
import DataCalculatorPage from "@/pages/product/DataCalculatorPage";
import CompatibilityPage from "@/pages/product/CompatibilityPage";
import NotFound          from "@/pages/not-found";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";

  if (slug === "phone-number")    return <PhoneNumberPage />;
  if (slug === "ultra-plan")      return <UltraPlanPage />;
  if (slug === "esim-business")   return <BusinessPage />;
  if (slug === "security")        return <SecurityPage />;
  if (slug === "data-calculator") return <DataCalculatorPage />;
  if (slug === "compatibility")   return <CompatibilityPage />;
  return <NotFound />;
}
