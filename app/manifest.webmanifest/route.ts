const manifest = {
  name: "House Notes",
  short_name: "House Notes",
  description: "A private visual idea book for a future house.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  lang: "en-US",
  dir: "ltr",
  background_color: "#f4f0e7",
  theme_color: "#173d32",
  prefer_related_applications: false,
  categories: ["lifestyle", "productivity"],
  icons: [
    {
      src: "/house-notes-icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/house-notes-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/house-notes-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
  share_target: {
    action: "/share-target",
    method: "POST",
    enctype: "multipart/form-data",
    params: {
      title: "title",
      text: "text",
      url: "url",
      files: [
        {
          name: "images",
          accept: ["image/*", ".jpg", ".jpeg", ".png", ".webp", ".gif"],
        },
      ],
    },
  },
};

export function GET() {
  return new Response(JSON.stringify(manifest), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=300, must-revalidate",
    },
  });
}
