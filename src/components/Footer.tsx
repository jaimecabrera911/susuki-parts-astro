import React from 'react';
import { MapPin } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTiktok, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { getFooterConfig, getStoreAddress, getSocialLinks } from '../utils/config';
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

export const Footer: React.FC<FooterProps> = ({ onOpenTutorial, onOpenContact }) => {
  const footerConfig = getFooterConfig();
  const storeAddress = getStoreAddress();
  const socialLinks = getSocialLinks();

  const legalLinks = (footerConfig?.legalLinks ?? []).filter(
    (link) => link && link.label?.trim() && link.href?.trim(),
  );

  const socials = SOCIAL_ICONS.filter(({ key }) => socialLinks?.[key]?.trim());

  const tagline = footerConfig?.tagline?.trim() || '';
  const copyright = footerConfig?.copyright?.trim() || '';
  const description = footerConfig?.description?.trim() || '';
  const hasInfo = Boolean(tagline || copyright || description || storeAddress.trim() || socials.length > 0);

  return (
    <footer id="footer" className="bg-slate-200/80 border-t border-slate-300 mt-16 py-10 text-slate-700 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {hasInfo && (
          <div>
            {tagline && (
              <div className="font-extrabold text-slate-900 uppercase text-sm mb-2">
                {tagline}
              </div>
            )}
            {(copyright || description) && (
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {copyright}
                {copyright && description && <br />}
                {description}
              </p>
            )}

            {storeAddress.trim() && (
              <p className="mt-3 flex items-start gap-1.5 text-slate-600 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-[#E60012] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{storeAddress}</span>
              </p>
            )}

            {socials.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                {socials.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={socialLinks?.[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="w-8 h-8 rounded-full bg-white border border-slate-300 hover:border-[#E60012] hover:text-[#E60012] text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="md:text-right space-y-1">
          {onOpenContact && (
            <button
              type="button"
              onClick={onOpenContact}
              className="hover:text-[#E60012] block text-left md:ml-auto mb-3 cursor-pointer font-bold"
            >
              Contacto
            </button>
          )}

          {legalLinks.length > 0 && (
            <>
              <div className="font-extrabold text-slate-800 text-[11px] uppercase mb-2">
                LEGAL & INFO
              </div>
              <div className="space-y-1 text-slate-700">
                {legalLinks.map((link, index) =>
                  link.href === '#tutorial' ? (
                    <button
                      key={index}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenTutorial?.();
                      }}
                      className="hover:text-[#E60012] block text-left md:ml-auto cursor-pointer underline"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      key={index}
                      href={link.href}
                      className="hover:text-[#E60012] block text-left md:ml-auto underline"
                    >
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};