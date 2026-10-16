import { studioConfig } from "@/config/studio";
import { navigation } from "@/data/navigation";
import { Logo } from "@/components/ui/Logo";

const socialLinks = Object.entries(studioConfig.social).filter(([, value]) => Boolean(value));

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Logo />
            <p>{studioConfig.description}</p>
          </div>
          <div className="footer-column">
            <h3>Explora</h3>
            {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
          </div>
          <div className="footer-column">
            <h3>Contacto</h3>
            {studioConfig.contact.whatsapp ? <a href={`https://wa.me/${studioConfig.contact.whatsapp}`}>WhatsApp</a> : <span>WhatsApp: pendiente</span>}
            {studioConfig.contact.address ? <span>{studioConfig.contact.address}</span> : <span>Ubicación: pendiente</span>}
            {studioConfig.contact.hours ? <span>{studioConfig.contact.hours}</span> : <span>Horarios: pendientes</span>}
            {socialLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer">{name}</a>)}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {studioConfig.name}. Derechos reservados.</span>
          {studioConfig.policies.privacyUrl ? <a href={studioConfig.policies.privacyUrl}>Aviso de privacidad</a> : <span>Aviso de privacidad pendiente</span>}
        </div>
      </div>
    </footer>
  );
}
