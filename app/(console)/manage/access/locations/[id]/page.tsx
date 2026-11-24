import { LocationsView } from "@/components/console/views/LocationsView";

export default async function LocationFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LocationsView key={id} id={id} basePath="/manage/access/locations" />;
}
