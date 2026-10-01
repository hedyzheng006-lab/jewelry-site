import type { Product } from "@/lib/products";

const METAL: Record<Product["metal"], string> = {
  gold: "#c9a24a",
  silver: "#a9b0b8",
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
    case "ring":
      art = (
        <>
          <ellipse cx="200" cy="235" rx="85" ry="90" {...stroke} />
          {stone ? (
            <polygon points="200,105 228,135 200,165 172,135" fill={stone} stroke={metal} strokeWidth="5" />
          ) : (
            <rect x="165" y="125" width="70" height="30" rx="8" fill={metal} />
          )}
        </>
      );
      break;
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
    case "bracelet":
      art = (
        <>
          <ellipse cx="200" cy="200" rx="120" ry="70" {...stroke} />
          {stone &&
            [170, 200, 230].map((x) => <circle key={x} cx={x} cy="270" r="10" fill={stone} stroke={metal} strokeWidth="3" />)}
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
