import { permanentRedirect } from "next/navigation";

export default function FaqRedirectPage() {
  // 308 permanen: /faq tidak pernah menjadi halaman mandiri, isinya ada di /informasi.
  permanentRedirect("/informasi");
}
