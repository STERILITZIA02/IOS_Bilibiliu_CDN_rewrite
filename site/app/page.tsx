import { bundledCatalog } from "@/lib/catalog";
import { Customizer } from "./Customizer";

export default function Home() {
  return <Customizer initialCatalog={bundledCatalog} />;
}
