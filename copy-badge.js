const src = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\23761632-7a5d-48ea-8ffe-dfc2a8ce2ee4\\media__1774208564872.jpg";
const dest = "c:\\Users\\Admin\\Desktop\\wac\\public\\badges\\verified-eagle.png";

async function main() {
  const fs = await import("node:fs");

  try {
    fs.copyFileSync(src, dest);
    console.log("Success");
  } catch (e) {
    console.error("Error", e);
  }
}

void main();
