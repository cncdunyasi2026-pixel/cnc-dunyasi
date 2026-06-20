import AdList from "@/components/ad/AdList";

type Props = {
  params: Promise<{ category: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Kategori: {category}</h1>
      <AdList category={category} />
    </section>
  );
}
