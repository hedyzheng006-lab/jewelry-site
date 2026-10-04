import type { Product } from "@/lib/products";

const METAL: Record<Product["metal"], string> = {
  gold: "#c9a24a",
  "gold-plated": "#c9a24a",
  silver: "#a9b0b8",
  "silver-tone": "#a9b0b8",
  "rose-gold": "#d29a85",
};

// Placeholder artwork until real photos are added (set `image` on the product).
export default function ProductImage({ product, size = 400 }: { product: Product; size?: number }) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.name} width={size} height={size} className="product-img" />;
  }
  const metal = METAL[product.metal];
  const stone = product.stoneColor;
  const stroke = { fill: "none", stroke: metal, strokeWidth: 10, strokeLinecap: "round" as const };

  let art;
  switch (product.category) {
    case "necklace":
      art = (
        <>
          <path d="M90 80 Q200 290 310 80" {...stroke} strokeWidth={5} />
          {stone ? (
            <path d="M200 230 C175 260 180 300 200 315 C220 300 225 260 200 230Z" fill={stone} stroke={metal} strokeWidth="5" />
          ) : (
            <circle cx="200" cy="250" r="18" fill={metal} />
          )}
        </>
      );
      break;
    case "earrings":
      art = (
        <>
          {[140, 260].map((x) => (
            <g key={x}>
              <circle cx={x} cy="190" r="45" {...stroke} strokeWidth={8} />
              {stone && <circle cx={x} cy="240" r="16" fill={stone} stroke={metal} strokeWidth="4" />}
            </g>
          ))}
        </>
      );
      break;
  }

  return (
    <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label={product.name} className="product-img">
      <rect width="400" height="400" fill="#f3ede4" />
      {art}
    </svg>
  );
}
