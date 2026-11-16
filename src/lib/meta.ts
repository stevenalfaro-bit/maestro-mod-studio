export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · mestro_ac` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · mestro_ac` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
