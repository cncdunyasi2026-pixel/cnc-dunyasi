type Props = {
  title: string;
  body: string;
};

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[#0F2A4A]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function LegalDocumentView({ title, body }: Props) {
  const blocks = body.split(/\n{2,}/);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-extrabold text-[#0F2A4A] md:text-3xl">{title}</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-[#4b5d74] md:text-base">
        {blocks.map((block, index) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          if (trimmed === "---") {
            return <hr key={index} className="border-[#dbe2ea]" />;
          }

          if (trimmed.startsWith("## ")) {
            return (
              <h2 key={index} className="pt-2 text-lg font-bold text-[#0F2A4A]">
                {renderInline(trimmed.slice(3))}
              </h2>
            );
          }

          if (trimmed.startsWith("### ")) {
            return (
              <h3 key={index} className="pt-1 text-base font-bold text-[#0F2A4A]">
                {renderInline(trimmed.slice(4))}
              </h3>
            );
          }

          if (trimmed.startsWith("- ")) {
            const items = trimmed.split("\n").filter((line) => line.startsWith("- "));
            return (
              <ul key={index} className="list-disc space-y-2 pl-5">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item.slice(2))}</li>
                ))}
              </ul>
            );
          }

          return <p key={index}>{renderInline(trimmed.replace(/\n/g, " "))}</p>;
        })}
      </div>
    </article>
  );
}
