import React from 'react';
import { MapPin, Mail, Phone, ArrowLeft } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import {
  getStoreName,
  getStoreTagline,
  getStoreAddress,
  getStoreLogo,
  getWhatsAppNumber,
  getContactEmail,
  getSocialLinks,
} from '../utils/config';
import type { SocialLinks } from '../types';
import logoImg from '../assets/logo.png';

const logoUrl = typeof logoImg === 'string' ? logoImg : (logoImg?.src || '/src/assets/logo.png');

interface ContactPageProps {
  onGoHome?: () => void;
}

const SOCIAL_ICONS: { key: keyof SocialLinks; Icon: React.ElementType; label: string }[] = [
  { key: 'facebook', Icon: FaFacebookF, label: 'Facebook' },
  { key: 'instagram', Icon: FaInstagram, label: 'Instagram' },
  { key: 'tiktok', Icon: FaTiktok, label: 'TikTok' },
  { key: 'youtube', Icon: FaYoutube, label: 'YouTube' },
  { key: 'whatsapp', Icon: FaWhatsapp, label: 'WhatsApp' },
];

export const ContactPage: React.FC<ContactPageProps> = ({ onGoHome }) => {
  const storeName = getStoreName();
  const storeTagline = getStoreTagline();
  const storeLogo = getStoreLogo();
  const storeAddress = getStoreAddress();
  const whatsappNumber = getWhatsAppNumber();
  const contactEmail = getContactEmail();
  const socialLinks = getSocialLinks();

  const logoToShow = storeLogo || logoUrl;
  const socials = SOCIAL_ICONS.filter(({ key }) => socialLinks?.[key]?.trim());
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : socialLinks?.whatsapp?.trim() || '';

  return (
    <div id="contact-page" className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
            Contacto
          </h1>
          <p className="text-sm text-slate-500 font-sans mt-1">
            Información de la tienda {storeName} {storeTagline ? `| ${storeTagline}` : ''}
          </p>
        </div>
        {onGoHome && (
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#E60012] hover:text-[#E60012] text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Tienda
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-200 shrink-0">
              <img src={logoToShow} alt={storeName} className="w-full h-full object-cover pointer-events-none select-none" />
            </div>
            <div>
              <div className="font-black text-slate-900 uppercase font-display leading-tight">
                {storeName}
              </div>
              {storeTagline && (
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                  {storeTagline}
                </p>
              )}
            </div>
          </div>

          {storeAddress.trim() && (
            <div className="flex items-start gap-3 text-slate-700 text-sm">
              <MapPin className="w-4 h-4 text-[#E60012] shrink-0 mt-0.5" />
              <span className="font-sans">{storeAddress}</span>
            </div>
          )}

          {contactEmail.trim() && (
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 text-slate-700 text-sm hover:text-[#E60012] transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#E60012] shrink-0" />
              <span className="font-sans">{contactEmail}</span>
            </a>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-slate-700 text-sm hover:text-[#E60012] transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#E60012] shrink-0" />
              <span className="font-mono font-bold">{whatsappNumber}</span>
            </a>
          )}

          {socials.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono mb-2">
                Nuestras Redes
              </div>
              <div className="flex items-center gap-2">
                {socials.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={socialLinks?.[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 hover:border-[#E60012] hover:text-[#E60012] text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 flex flex-col justify-center items-center text-center text-slate-500 text-sm">
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3">
            <Phone className="w-5 h-5 text-[#E60012]" />
          </div>
          <p className="font-sans leading-relaxed max-w-xs">
            ¿Necesitas repuestos o asesoría técnica? Escríbenos por WhatsApp y
            te atendemos directamente.
          </p>
        </div>
      </div>
    </div>
  );
};