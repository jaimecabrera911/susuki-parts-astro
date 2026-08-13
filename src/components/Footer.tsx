import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import {
  getStoreName,
  getStoreTagline,
  getStoreLogo,
  getFooterConfig,
  getStoreAddress,
  getSocialLinks,
  getWhatsAppNumber,
  getContactEmail,
} from '../utils/config';
import type { SocialLinks } from '../types';

interface FooterProps {
  onOpenTutorial?: () => void;
  onOpenContact?: () => void;
}

const SOCIAL_ICONS: { key: keyof SocialLinks; Icon: React.ElementType; label: string }[] = [
  { key: 'facebook', Icon: FaFacebookF, label: 'Facebook' },
  { key: 'instagram', Icon: FaInstagram, label: 'Instagram' },
  { key: 'tiktok', Icon: FaTiktok, label: 'TikTok' },
  { key: 'youtube', Icon: FaYoutube, label: 'YouTube' },
  { key: 'whatsapp', Icon: FaWhatsapp, label: 'WhatsApp' },
];

const RULER_COUNT = 41;

export const Footer: React.FC<FooterProps> = ({ onOpenTutorial, onOpenContact }) => {
  const storeName = getStoreName();
  const storeTagline = getStoreTagline();
  const storeLogo = getStoreLogo();
  const footerConfig = getFooterConfig();
  const storeAddress = getStoreAddress();
  const socialLinks = getSocialLinks();
  const whatsappNumber = getWhatsAppNumber();
  const contactEmail = getContactEmail();

  const legalLinks = (footerConfig?.legalLinks ?? []).filter(
    (link) => link && link.label?.trim() && link.href?.trim(),
  );

  const socials = SOCIAL_ICONS.filter(({ key }) => socialLinks?.[key]?.trim());

  const copyright = footerConfig?.copyright?.trim() || '';
  const description = footerConfig?.description?.trim() || '';
  const hasInfo = Boolean(
    storeName ||
      storeTagline ||
      storeLogo ||
      copyright ||
      description ||
      storeAddress.trim() ||
      contactEmail.trim() ||
      whatsappNumber.trim() ||
      socials.length > 0,
  );

  const rulerTicks = Array.from(
    { length: RULER_COUNT },
    (_, i) => i - (RULER_COUNT - 1) / 2,
  );

  return (
    <footer
      id="footer"
      className="mt-16 bg-[#0c1016] text-slate-400 border-t-2 border-[#E60012]"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        {hasInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                {storeLogo ? (
                  <div className="w-11 h-11 overflow-hidden flex items-center justify-center bg-white shrink-0">
                    <img
                      src={storeLogo}
                      alt={storeName}
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                  </div>
                ) : storeName ? (
                  <div className="w-11 h-11 flex items-center justify-center bg-[#E60012] shrink-0">
                    <span className="text-white font-display font-black text-lg leading-none">
                      {storeName.charAt(0)}
                    </span>
                  </div>
                ) : null}

                <div>
                  {storeName && (
                    <div className="text-[#E60012] font-display font-black uppercase text-lg leading-tight tracking-tight">
                      {storeName}
                    </div>
                  )}
                  {storeTagline && (
                    <div className="font-technical text-[10px] tracking-[0.2em] text-slate-500 mt-0.5">
                      {storeTagline}
                    </div>
                  )}
                </div>
              </div>

              {description && (
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  {description}
                </p>
              )}
            </div>

            {/* Assistance column */}
            <div className="space-y-4">
              <div className="font-technical text-[10px] tracking-[0.2em] text-slate-500">
                ASISTENCIA
              </div>

              {storeAddress.trim() && (
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-relaxed">{storeAddress}</span>
                </div>
              )}

              {contactEmail.trim() && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-xs hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:rounded"
                >
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="data-mono">{contactEmail}</span>
                </a>
              )}

              {whatsappNumber.trim() && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:rounded"
                >
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="data-mono">{whatsappNumber}</span>
                </a>
              )}

              {onOpenContact && (
                <button
                  type="button"
                  onClick={onOpenContact}
                  className="block text-xs font-bold text-white bg-[#E60012] hover:bg-[#b5000b] px-4 py-2 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1016]"
                >
                  Página de Contacto
                </button>
              )}

              {socials.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {socials.map(({ key, Icon, label }) => (
                    <a
                      key={key}
                      href={socialLinks?.[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                      className="w-8 h-8 flex items-center justify-center bg-[#141a23] border border-slate-800 text-slate-400 hover:text-[#E60012] hover:border-[#E60012] transition-colors rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012]"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Legal column */}
            {legalLinks.length > 0 && (
              <div className="space-y-4">
                <div className="font-technical text-[10px] tracking-[0.2em] text-slate-500">
                  LEGAL & INFO
                </div>
                <div className="space-y-2">
                  {legalLinks.map((link, index) =>
                    link.href === '#tutorial' ? (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenTutorial?.();
                        }}
                        className="block text-xs text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:rounded"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        key={index}
                        href={link.href}
                        className="block text-xs text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60012] focus-visible:rounded"
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spec strip */}
        <div className="mt-10 pt-5 border-t border-slate-800 flex flex-col items-center gap-4">
          {copyright && (
            <div className="font-technical text-[10px] tracking-[0.15em] text-slate-600 text-center">
              {copyright}
            </div>
          )}

          <div className="flex items-end justify-center gap-[3px]" aria-hidden="true">
            {rulerTicks.map((pos) => {
              const isCenter = pos === 0;
              const isMajor = Math.abs(pos) % 5 === 0;
              const height = isCenter ? 16 : isMajor ? 11 : 6;
              return (
                <span
                  key={pos}
                  className={`w-px rounded-full ${
                    isCenter ? 'bg-[#E60012]' : 'bg-slate-700'
                  }`}
                  style={{ height }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};
