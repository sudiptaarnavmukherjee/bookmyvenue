import Link from "next/link";
import { Sparkles, MapPin, Mail, Phone, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-pink-700/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">ShubhSpace</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Kolkata&apos;s most trusted marketplace for wedding venues &amp; catering services. Transparent pricing, verified listings.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <MapPin className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span>Kolkata, West Bengal, India</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Mail className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <a href="mailto:hello@shubhspace.in" className="hover:text-purple-300 transition-colors">
                hello@shubhspace.in
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Phone className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <a href="tel:+918100000000" className="hover:text-purple-300 transition-colors">
                +91 81000 00000
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-purple-300 mb-4">Explore</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/venues", label: "Wedding Venues" },
                { href: "/catering", label: "Catering Services" },
                { href: "/venues?area=Salt+Lake", label: "Salt Lake Venues" },
                { href: "/venues?area=New+Town", label: "New Town Venues" },
                { href: "/catering?city=Kolkata", label: "Kolkata Caterers" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-flex items-center gap-1.5 group"
                  >
                    <span className="h-1 w-1 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-purple-300 mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/about", label: "About Us" },
                { href: "/how-it-works", label: "How It Works" },
                { href: "/list-your-venue", label: "List Your Venue" },
                { href: "/list-your-catering", label: "List Your Catering" },
                { href: "/contact", label: "Contact Us" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-flex items-center gap-1.5 group"
                  >
                    <span className="h-1 w-1 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-purple-300 mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/help", label: "Help Center" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/cancellation", label: "Cancellation Policy" },
                { href: "/refund", label: "Refund Policy" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-400 hover:text-white transition-colors hover:translate-x-1 inline-flex items-center gap-1.5 group"
                  >
                    <span className="h-1 w-1 rounded-full bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social */}
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-300 mb-3">Follow Us</p>
              <div className="flex items-center gap-3">
                {[
                  { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
                  { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
                  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
                ].map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} ShubhSpace. All rights reserved. Made with ❤️ in Kolkata.
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
