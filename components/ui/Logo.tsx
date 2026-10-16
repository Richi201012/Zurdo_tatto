import Image from "next/image";
import Link from "next/link";
import { studioConfig } from "@/config/studio";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label={`${studioConfig.name}, inicio`}>
      <Image src={studioConfig.logo} alt="" width={64} height={64} priority />
      <span className="brand-name">{studioConfig.name}</span>
    </Link>
  );
}
